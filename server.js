const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const authRoutes = require('./server/routes/authRoutes');
const roomRoutes = require('./server/routes/roomRoutes');
const initRoomSocket = require('./server/sockets/roomSocket');
const initGameSocket = require('./server/sockets/gameSocket');
const initChatSocket = require('./server/sockets/chatSocket');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: ['http://localhost:5173', process.env.CLIENT_URL] }
});

app.use(cors({
  origin: ['http://localhost:5173', process.env.CLIENT_URL], // Allow both local and deployed frontend
}));
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/room', roomRoutes);

app.get('/', (req, res) => res.send('Yahtzee Backend is Running!'));

// Initialize Socket.io logic
initRoomSocket(io);
initGameSocket(io);
initChatSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server & Socket.io running on port ${PORT}`));