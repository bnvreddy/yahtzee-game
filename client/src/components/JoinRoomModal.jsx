import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import roomApi from '../api/room';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const JoinRoomModal = ({ onClose }) => {
  const [code, setCode] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const res = await roomApi.joinRoom(user.loginname, user.displayname, code.toUpperCase());
      toast.success(res.message);
      navigate(`/waiting/${code.toUpperCase()}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join room');
    }
  };

  return (
          <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Join Room</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
          <form onSubmit={handleJoin}>
            <input 
              type="text" 
              maxLength={6}
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())} 
              placeholder="Enter Room Code"
              required 
            />
            <button type="submit" className="btn-primary">Join</button>
          </form>
        </div>
      </div>
  );
};

export default JoinRoomModal;