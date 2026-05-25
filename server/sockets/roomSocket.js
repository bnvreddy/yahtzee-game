const prisma = require('../config/db');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // When a player opens the waiting room page
    socket.on('join-room-waiting', async (roomCode) => {
      socket.join(roomCode);
      
      // Fetch current room data and send it to everyone in the room
      const room = await prisma.room.findUnique({ where: { code: roomCode } });
      if (room) {
        io.to(roomCode).emit('room-updated', room);
      }
    });

    // When the host clicks "Start Game"
    socket.on('start-game', async (roomCode) => {
      const room = await prisma.room.findUnique({ where: { code: roomCode } });
      
      if (room && room.status === 'waiting') {
        // Update database status to active
        await prisma.room.update({
          where: { code: roomCode },
          data: { status: 'active' },
        });

        // Tell all clients in the room to redirect to the game screen
        io.to(roomCode).emit('game-started', roomCode);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};