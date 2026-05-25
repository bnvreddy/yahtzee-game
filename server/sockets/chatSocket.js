module.exports = (io) => {
  io.on('connection', (socket) => {
    
    // Listen for chat messages
    socket.on('send-chat-message', (data) => {
      // Data contains: { roomCode, loginname, displayname, message }
      // We broadcast it to everyone in the game room EXCEPT the sender,
      // or to everyone including sender. Usually, including sender is easier 
      // so the sender sees their own message instantly in the UI.
      io.to(`${data.roomCode}_game`).emit('chat-message', {
        displayname: data.displayname,
        message: data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

  });
};