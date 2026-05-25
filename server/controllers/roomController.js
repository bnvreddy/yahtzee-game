const prisma = require('../config/db');

// Generate a random 6-character room code
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const createRoom = async (req, res) => {
  try {
    const { hostId, hostDisplay, mode, entryFee } = req.body;

    const host = await prisma.user.findUnique({ where: { loginname: hostId } });
    if (host.coins < entryFee) {
      return res.status(400).json({ message: 'Not enough coins to set this entry fee' });
    }

    const code = generateCode();
    const initialPlayers = JSON.stringify([{ loginname: hostId, displayname: hostDisplay }]);

    // Deduct entry fee
    const updatedHost = await prisma.user.update({
      where: { loginname: hostId },
      data: { coins: host.coins - entryFee },
    });

    // TELL THE FRONTEND THE NEW BALANCE INSTANTLY
    req.io.emit('wallet-update', { loginname: hostId, newBalance: updatedHost.coins });

    const room = await prisma.room.create({
      data: { code, mode, entryFee, hostId, players: initialPlayers },
    });

    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating room' });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { loginname, displayname: joinerDisplay, code } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status !== 'waiting') return res.status(400).json({ message: 'Game already started' });

    const players = JSON.parse(room.players);
    if (players.find(p => p.loginname === loginname)) return res.status(400).json({ message: 'Already in room' });

    const user = await prisma.user.findUnique({ where: { loginname } });
    if (user.coins < room.entryFee) {
      return res.status(400).json({ message: 'Not enough coins to join' });
    }

    // Deduct entry fee
    const updatedUser = await prisma.user.update({
      where: { loginname },
      data: { coins: user.coins - room.entryFee },
    });

    // TELL THE FRONTEND THE NEW BALANCE INSTANTLY
    req.io.emit('wallet-update', { loginname, newBalance: updatedUser.coins });

    players.push({ loginname, displayname: joinerDisplay });
    await prisma.room.update({
      where: { code },
      data: { players: JSON.stringify(players) },
    });

    res.status(200).json({ message: 'Joined room successfully', roomCode: code });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error joining room' });
  }
};

const getActiveGame = async (req, res) => {
  try {
    const { loginname } = req.params;
    
    // Check if there is any room in the DB containing this loginname
    // (Since we delete rooms when they end, any room found is an active game)
    const room = await prisma.room.findFirst({
      where: {
        players: { contains: loginname }
      }
    });

    if (room) {
      res.json({ roomCode: room.code, status: room.status });
    } else {
      res.json({ roomCode: null }); // Not in any game
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking active game' });
  }
};

const getRoomDetails = async (req, res) => {
  try {
    const room = await prisma.room.findUnique({ where: { code: req.params.code } });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room' });
  }
};

// Update module.exports to include the new function
module.exports = { createRoom, joinRoom, getRoomDetails, getActiveGame };
