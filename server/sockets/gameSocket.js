const prisma = require('../config/db');
const calculateScores = require('../utils/yahtzeeCalculator');

module.exports = (io) => {
  const activeGames = {};

    async function handleGameEnd(roomCode) {
    const game = activeGames[roomCode];
    if (!game || game.status === 'finished') return;
    game.status = 'finished';

    try {
      const room = await prisma.room.findUnique({ where: { code: roomCode } });
      if (room) {
        const originalPlayers = JSON.parse(room.players);
        const prizePool = originalPlayers.length * game.entryFee;

        // 1. Find the highest score among all players
        const maxScore = Math.max(...game.players.map(p => game.playerStates[p].totalScore));
        
        // 2. Find ALL players who have that highest score (Handles Ties!)
        const winners = game.players.filter(p => game.playerStates[p].totalScore === maxScore);
        
        // 3. Split the prize pool equally (rounded down to avoid decimals)
        const prizePerWinner = Math.floor(prizePool / winners.length);

        // 4. Award coins to ALL winners
        for (const winnerLoginname of winners) {
          const updatedWinner = await prisma.user.update({
            where: { loginname: winnerLoginname },
            data: { coins: { increment: prizePerWinner } }
          });
          
          // Tell each winner's frontend to update their wallet
          io.to(`${roomCode}_game`).emit('wallet-update', { 
            loginname: winnerLoginname, 
            newBalance: updatedWinner.coins 
          });
        }

        // Delete the room from DB to save storage
        await prisma.room.delete({ where: { code: roomCode } });

        // 5. Emit game over with the array of winners
        io.to(`${roomCode}_game`).emit('game-over', { 
          winners: winners, // Now an array of loginnames
          prizePool: prizePool,
          prizePerWinner: prizePerWinner
        });
      }
    } catch (error) {
      console.error("Error ending game in DB:", error);
    }
    delete activeGames[roomCode];
  }

  io.on('connection', (socket) => {

    socket.on('join-game-room', async (roomCode, loginname) => {
      socket.join(`${roomCode}_game`);
      
      // MAP SOCKET TO USER (Crucial for disconnects)
      socket.data.loginname = loginname;
      socket.data.roomCode = roomCode;

      if (!activeGames[roomCode]) {
        const room = await prisma.room.findUnique({ where: { code: roomCode } });
        if (!room) return;
        
        const players = JSON.parse(room.players);
        const playerStates = {};
        const connectedPlayers = {};
        
        for (const p of players) {
          const dbUser = await prisma.user.findUnique({ where: { loginname: p.loginname } });
          playerStates[p.loginname] = {
            displayname: p.displayname,
            scorecard: {},
            totalScore: 0,
            wallet: dbUser.coins
          };
          connectedPlayers[p.loginname] = true; // Mark connected
        }

        activeGames[roomCode] = {
          roomCode,
          mode: room.mode,
          entryFee: room.entryFee,
          players: players.map(p => p.loginname),
          playerStates,
          currentTurnIndex: 0,
          currentDice: [0, 0, 0, 0, 0],
          heldDice: [false, false, false, false, false],
          rollsLeft: 3,
          status: 'active',
          isPaused: false, // NEW: Pause state
          disconnectedPlayer: null, // NEW: Who disconnected
          connectedPlayers // NEW: Online status tracking
        };
      } else {
        // Game already exists, mark player as connected
        const game = activeGames[roomCode];
        game.connectedPlayers[loginname] = true;

        // CHECK RECONNECT: If they were the disconnected player, resume game!
        if (game.isPaused && game.disconnectedPlayer === loginname) {
          game.isPaused = false;
          game.disconnectedPlayer = null;
          io.to(`${roomCode}_game`).emit('game-resumed');
        }
      }

      io.to(socket.id).emit('game-state-update', activeGames[roomCode]);
      io.to(`${roomCode}_game`).emit('player-connection-update', activeGames[roomCode].connectedPlayers);
    });

        // --- DISCONNECT LOGIC ---
    socket.on('disconnect', async () => {
      const { loginname, roomCode } = socket.data;
      if (!loginname || !roomCode) return; 

      const game = activeGames[roomCode];
      if (!game || game.status === 'finished') return;

      // Mark as disconnected
      game.connectedPlayers[loginname] = false;
      io.to(`${roomCode}_game`).emit('player-connection-update', game.connectedPlayers);

      // Check if it was their turn WHEN THEY DISCONNECTED
      const currentTurnPlayer = game.players[game.currentTurnIndex];
      if (loginname === currentTurnPlayer && !game.isPaused) {
        game.isPaused = true;
        game.disconnectedPlayer = loginname;
        io.to(`${roomCode}_game`).emit('game-paused', { disconnectedPlayer: loginname });
      }
    });

    socket.on('roll-dice', async (roomCode, loginname, heldDice) => {
      const game = activeGames[roomCode];
      if (!game || game.status === 'finished' || game.isPaused) return; // BLOCK IF PAUSED

      const currentTurnPlayer = game.players[game.currentTurnIndex];
      if (loginname !== currentTurnPlayer) return; 
      if (game.rollsLeft <= 0) return;

      const newDice = [...game.currentDice];
      for (let i = 0; i < 5; i++) {
        if (!heldDice[i]) newDice[i] = Math.floor(Math.random() * 6) + 1;
      }
      game.currentDice = newDice;
      game.heldDice = heldDice;
      game.rollsLeft--;

      io.to(`${roomCode}_game`).emit('dice-rolled', { currentDice: newDice, rollsLeft: game.rollsLeft, heldDice: game.heldDice });
    });

    socket.on('toggle-die', async (roomCode, loginname, dieIndex) => {
      const game = activeGames[roomCode];
      if (!game || game.isPaused) return;
      const currentTurnPlayer = game.players[game.currentTurnIndex];
      if (loginname !== currentTurnPlayer || game.rollsLeft === 3) return;
      game.heldDice[dieIndex] = !game.heldDice[dieIndex];
      io.to(`${roomCode}_game`).emit('dice-toggled', game.heldDice);
    });

        socket.on('lock-score', async (roomCode, loginname, category) => {
      const game = activeGames[roomCode];
      if (!game || game.status === 'finished' || game.isPaused) return; // BLOCK IF PAUSED

      const currentTurnPlayer = game.players[game.currentTurnIndex];
      if (loginname !== currentTurnPlayer) return;

      const playerState = game.playerStates[loginname];
      if (playerState.scorecard[category] !== undefined) return;

      const potentialScores = calculateScores(game.currentDice);
      playerState.scorecard[category] = potentialScores[category];

      let upperSum = 0, lowerSum = 0;
      const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
      for (const [cat, val] of Object.entries(playerState.scorecard)) {
        if (upperCategories.includes(cat)) upperSum += val; else lowerSum += val;
      }
      playerState.totalScore = upperSum + (upperSum >= 63 ? 35 : 0) + lowerSum;

      // Reset for next turn
      game.currentDice = [0, 0, 0, 0, 0];
      game.heldDice = [false, false, false, false, false];
      game.rollsLeft = 3;
      
      // Advance to next player
      game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;

      // NEW LOGIC: Check if the NEXT player is disconnected. If yes, PAUSE.
      const nextTurnPlayer = game.players[game.currentTurnIndex];
      if (!game.connectedPlayers[nextTurnPlayer]) {
        game.isPaused = true;
        game.disconnectedPlayer = nextTurnPlayer;
        io.to(`${roomCode}_game`).emit('game-paused', { disconnectedPlayer: nextTurnPlayer });
      }

      io.to(`${roomCode}_game`).emit('game-state-update', game);

      const allFinished = game.players.every(p => Object.keys(game.playerStates[p].scorecard).length === 13);
      if (allFinished) {
        await handleGameEnd(roomCode);
      }
    });

    socket.on('leave-game', async (roomCode, loginname) => {
      const game = activeGames[roomCode];
      if (!game) return;

      const playerIndex = game.players.indexOf(loginname);
      if (playerIndex === -1) return;

      game.players.splice(playerIndex, 1);
      delete game.playerStates[loginname];
      delete game.connectedPlayers[loginname];
      socket.leave(`${roomCode}_game`);

      if (game.isPaused && game.disconnectedPlayer === loginname) {
        game.isPaused = false;
        game.disconnectedPlayer = null;
        io.to(`${roomCode}_game`).emit('game-resumed');
      }

      if (game.players.length === 0) {
        await prisma.room.delete({ where: { code: roomCode } }).catch(() => {});
        delete activeGames[roomCode];
      } else if (game.players.length === 1) {
        const lastPlayer = game.players[0];
        await handleGameEnd(roomCode, lastPlayer);
      } else {
        if (playerIndex <= game.currentTurnIndex) {
          game.currentTurnIndex = game.currentTurnIndex % game.players.length;
        }
        if (game.players[game.currentTurnIndex] !== loginname) {
          game.currentDice = [0,0,0,0,0];
          game.rollsLeft = 3;
          game.heldDice = [false,false,false,false,false];
        }
        io.to(`${roomCode}_game`).emit('game-state-update', game);
      }
    });

  });
};