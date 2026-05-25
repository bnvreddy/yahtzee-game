const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Use a secure string in .env for production
const JWT_SECRET = process.env.JWT_SECRET || 'yahtzee_super_secret_key_2024';

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
};

module.exports = { hashPassword, comparePassword, generateToken, JWT_SECRET };