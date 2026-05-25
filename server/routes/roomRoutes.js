const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getRoomDetails, getActiveGame } = require('../controllers/roomController');
const prisma = require('../config/db');

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/active-game/:loginname', getActiveGame);

router.get('/:code', getRoomDetails);
module.exports = router;