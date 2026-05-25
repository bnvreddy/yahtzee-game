import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import roomApi from '../api/room';

const WaitingPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Get user for coins
  const socket = useSocket();

  const [room, setRoom] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const data = await roomApi.getRoomDetails(code);
        setRoom(data);
        localStorage.setItem('activeGame', code);
      } catch (error) {
        alert('Room not found');
        navigate('/lobby');
      }
    };

    fetchRoom();

    socket.emit('join-room-waiting', code);

    const handleRoomUpdate = (updatedRoom) => {
      setRoom(updatedRoom);
    };

    const handleGameStart = (roomCode) => {
      navigate(`/game/${roomCode}`);
    };

    socket.on('room-updated', handleRoomUpdate);
    socket.on('game-started', handleGameStart);

    return () => {
      socket.off('room-updated', handleRoomUpdate);
      socket.off('game-started', handleGameStart);
    };
  }, [code, socket, navigate]);

  const handleStartGame = () => {
    socket.emit('start-game', code);
  };

  if (!room) return <div>Loading Room...</div>;

  const players = JSON.parse(room.players);
  const isHost = user.loginname === room.hostId;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Waiting Room</h2>
      <p>Share this code with your friends:</p>
      <h1 style={{ letterSpacing: '5px', color: '#4caf50' }}>{code}</h1>
      <p>Mode: {room.mode.toUpperCase()} | Entry Fee: {room.entryFee} 🪙</p>
      
      {/* ADDED WALLET DISPLAY HERE */}
      <p style={{ fontSize: '1.2rem', color: '#fbbf24', fontWeight: 'bold' }}>
        Your Wallet: {user?.coins} 🪙
      </p>

      <div className="waiting-players-box">
        <h3>Players ({players.length}):</h3>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {players.map((p) => (
            <li key={p.loginname} className="player-item">
              {p.displayname} {p.loginname === room.hostId && '👑 (Host)'}
            </li>
          ))}
        </ul>
      </div>

      {isHost && (
        <button 
          onClick={handleStartGame} 
          className="btn-primary"
          style={{ marginTop: '30px', padding: '10px 20px', fontSize: '1.2rem' }}
        >
          Start Game
        </button>
      )}
      
      {!isHost && <p style={{ marginTop: '30px', color: '#666' }}>Waiting for the Host to start the game...</p>}
    </div>
  );
};

export default WaitingPage;