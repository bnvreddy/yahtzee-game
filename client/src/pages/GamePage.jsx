import { useEffect, useContext, useState } from 'react'; // Added useState
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { GameProvider, useGame } from '../context/GameContext';
import DiceArea from '../components/game/DiceArea';
import ScoreCard from '../components/game/ScoreCard';
import ChatBox from '../components/game/ChatBox';

const GameInner = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const socket = useSocket();
  const { gameState, gameOverData, isPaused, disconnectedPlayer, connectedPlayers } = useGame();

  const [showExitModal, setShowExitModal] = useState(false); // NEW: State for custom modal

  useEffect(() => {
    socket.emit('join-game-room', code, user.loginname);
    localStorage.setItem('activeGame', code);
  }, [code, socket, user.loginname]);

  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href);
    const preventBack = () => window.history.pushState(null, document.title, window.location.href);
    window.addEventListener('popstate', preventBack);
    return () => window.removeEventListener('popstate', preventBack);
  }, []);

  useEffect(() => {
    const preventClose = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', preventClose);
    return () => window.removeEventListener('beforeunload', preventClose);
  }, []);

  // REMOVED window.confirm here
  const handleExitGame = () => {
    socket.emit('leave-game', code, user.loginname);
    localStorage.removeItem('activeGame');
    navigate('/lobby');
  };

  const handleBackToLobby = () => {
    localStorage.removeItem('activeGame');
    navigate('/lobby');
  };

  if (!gameState) return <div>Loading Game...</div>;

  const disconnectedDisplayName = disconnectedPlayer ? gameState.playerStates[disconnectedPlayer]?.displayname : '';

  return (
    <div className="game-page-container">
      
      {/* Custom Exit Game Modal */}
      {showExitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ color: '#ef4444', fontSize: '1.5rem' }}>🚪 Exit Game?</h2>
            <p style={{ color: '#e2e8f0', margin: '15px 0', fontSize: '0.95rem' }}>
              Are you sure? If you are the last player, the other person will win the pot!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleExitGame} className="btn-danger" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
                Yes, Exit Game
              </button>
              <button onClick={() => setShowExitModal(false)} className="btn-secondary" style={{ width: '100%', padding: '12px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

            {/* Game Over Modal */}
      {gameOverData && (
        <div className="modal-overlay">
          <div className="modal-content game-over-modal">
            <div className="modal-trophy">🏆</div>
            <h2>GAME OVER</h2>
            
            <div className="winner-section">
              <p className="winner-label">{gameOverData.winners.length > 1 ? "It's a Tie!" : "Winner"}</p>
              <h3 className="winner-name">
                {gameOverData.winners.map(w => gameState.playerStates[w]?.displayname).join(' & ')}
              </h3>
            </div>

            <div className="prize-pool-badge">
              <span>{gameOverData.winners.length > 1 ? "Split Prize" : "Prize Pool"}</span>
              <strong>{gameOverData.prizePerWinner} 🪙</strong> {/* Shows the split amount */}
            </div>

            {/* Check if current user is one of the winners */}
            {gameOverData.winners.includes(user.loginname) ? (
              <p className="result-text win">🎉 Congratulations! 🎉</p>
            ) : (
              <p className="result-text lose">Better luck next time!</p>
            )}
            <button onClick={handleBackToLobby} className="btn-primary modal-btn">Back to Lobby</button>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {isPaused && (
        <div className="modal-overlay">
          <div className="modal-content pause-modal">
            <div className="pause-icon">⏸️</div>
            <h2>Game Paused</h2>
            <p className="pause-player">{disconnectedDisplayName} has disconnected.</p>
            <div className="loading-dots">
              <span>Waiting for reconnect</span>
              <div className="dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. HEADER - Top */}
      <div className="game-header">
        <div className="game-header-left">
          <h2>Room: {code}</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>
            Entry: {gameState.entryFee} 🪙
          </p>
        </div>
        <div className="game-header-right">
          <p className="wallet-text">{user?.coins} 🪙</p>
          {/* Changed to trigger our custom modal */}
          <button onClick={() => setShowExitModal(true)} className="btn-danger">Exit</button>
        </div>
      </div>

      {/* 2. SCORECARD - Scrollable Middle */}
      <div className="game-content-scroll">
        <ScoreCard />
      </div>

      {/* 3. DICE - Fixed Bottom */}
      <div className="game-dice-footer">
        <DiceArea />
      </div>

      <ChatBox />
    </div>
  );
};

const GamePage = () => {
  return (
    <GameProvider>
      <GameInner />
    </GameProvider>
  );
};

export default GamePage;