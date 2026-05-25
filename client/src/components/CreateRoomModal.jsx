import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import roomApi from '../api/room';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CreateRoomModal = ({ onClose }) => {
  const [entryFee, setEntryFee] = useState(100);
  const { user, deductCoins } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Hardcoded mode to 'normal'
      const room = await roomApi.createRoom(user.loginname, user.displayname, 'normal', Number(entryFee));
      deductCoins(Number(entryFee));
      toast.success(`Room created! Code: ${room.code}`);
      navigate(`/waiting/${room.code}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create room');
    }
  };

  return (
          <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Create Room</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
          <form onSubmit={handleCreate}>
            <label>Entry Fee (Coins):</label>
            <input 
              type="number" 
              min="10" 
              value={entryFee} 
              onChange={(e) => setEntryFee(e.target.value)} 
              required 
            />
            <button type="submit" className="btn-primary">Create</button>
          </form>
        </div>
      </div>
  );
};

export default CreateRoomModal;