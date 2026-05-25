import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from './context/AuthContext';
import { useSocket } from './context/SocketContext';


import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import WaitingPage from './pages/WaitingPage';
import GamePage from './pages/GamePage';
import ProfilePage from './pages/ProfilePage';



const WalletSync = () => {
  const { user, syncWallet } = useContext(AuthContext);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleWalletUpdate = (data) => {
      if (user && data.loginname === user.loginname) {
        syncWallet(data.newBalance);
      }
    };

    socket.on('wallet-update', handleWalletUpdate);

    return () => {
      socket.off('wallet-update', handleWalletUpdate);
    };
  }, [socket, user, syncWallet]);

  return null; // Renders nothing
};



const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

// Auto-Redirect if in active game
const GameRejoinCheck = ({ children }) => {
  const activeGame = localStorage.getItem('activeGame');
  
  // If there is an active game code saved, force redirect to the game page
  if (activeGame) {
    return <Navigate to={`/game/${activeGame}`} replace />;
  }
  
  return children;
};

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <WalletSync />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route 
            path="/lobby" 
            element={
              <ProtectedRoute>
                  <LobbyPage />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/waiting/:code" element={<ProtectedRoute><WaitingPage /></ProtectedRoute>} />
          <Route path="/game/:code" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;