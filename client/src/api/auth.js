import axios from 'axios';

const API_URL = '${import.meta.env.VITE_API_URL}/api/auth';

const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  return response.data;
};

const claimDailyBonus = async (loginname) => {
  const response = await axios.post(`${API_URL}/claim-bonus`, { loginname });
  return response.data;
};

// NEW: Update Display Name
const updateDisplayName = async (loginname, newDisplayName) => {
  const response = await axios.put(`${API_URL}/profile`, { loginname, newDisplayName });
  return response.data;
};

export default { register, login, claimDailyBonus, updateDisplayName };