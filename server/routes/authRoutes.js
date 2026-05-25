const express = require('express');
const router = express.Router();
const { register, login, claimDailyBonus, updateDisplayName } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/claim-bonus', claimDailyBonus);
router.put('/profile', updateDisplayName);

module.exports = router;