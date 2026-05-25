import axios from 'axios';

const API_URL = '${import.meta.env.VITE_API_URL}/api/room';

const createRoom = async (hostId, hostDisplay, mode, entryFee) => {
  const response = await axios.post(`${API_URL}/create`, { hostId, hostDisplay, mode, entryFee });
  return response.data;
};

const joinRoom = async (loginname, displayname, code) => {
  const response = await axios.post(`${API_URL}/join`, { loginname, displayname, code });
  return response.data;
};

const getRoomDetails = async (code) => {
  const response = await axios.get(`${API_URL}/${code}`);
  return response.data;
};

// NEW: Ask server if user is in an active game
const checkActiveGame = async (loginname) => {
  const response = await axios.get(`${API_URL}/active-game/${loginname}`);
  return response.data;
};

export default { createRoom, joinRoom, getRoomDetails, checkActiveGame };