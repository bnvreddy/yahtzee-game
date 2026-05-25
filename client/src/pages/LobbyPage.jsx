import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // ENSURE LINK IS IMPORTED HERE
import { AuthContext } from '../context/AuthContext';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';
import roomApi from '../api/room';
import authApi from '../api/auth';
import { toast } from 'react-toastify';

const LobbyPage = () => {
  const { user, logout, syncWallet, updateStreak } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false)

  // Wallet Sync on mount
  useEffect(() => {
    const localUser = localStorage.getItem('yahtzee_user');
    if (localUser) {
      const parsedUser = JSON.parse(localUser);
      if (parsedUser.coins !== user?.coins) {
        syncWallet(parsedUser.coins);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Active Game Check on mount
  useEffect(() => {
    const checkForActiveGame = async () => {
      try {
        const data = await roomApi.checkActiveGame(user.loginname);
        if (data.roomCode) {
          localStorage.setItem('activeGame', data.roomCode);
          if (data.status === 'waiting') navigate(`/waiting/${data.roomCode}`);
          else navigate(`/game/${data.roomCode}`);
        } else {
          localStorage.removeItem('activeGame');
        }
      } catch (error) {
        console.error("Failed to check active game");
      }
    };
    checkForActiveGame();
  }, [user, navigate]);

  // Check if bonus is already claimed today
  const hasClaimedToday = () => {
    if (!user?.lastCheckIn) return false;
    const today = new Date();
    const lastCheck = new Date(user.lastCheckIn);
    return (
      today.getFullYear() === lastCheck.getFullYear() &&
      today.getMonth() === lastCheck.getMonth() &&
      today.getDate() === lastCheck.getDate()
    );
  };

  const handleClaimBonus = async () => {
    try {
      const data = await authApi.claimDailyBonus(user.loginname);
      updateStreak(data.newBalance, data.currentStreakDay, new Date().toISOString());
      toast.success(`🎉 Day ${data.currentStreakDay} Bonus: +${data.reward} coins!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error claiming bonus');
    }
  };

  const rewards = [50, 100, 150, 200, 250, 300, 500];
  const currentStreak = user?.currentStreakDay || 0; 
  const isClaimed = hasClaimedToday();

  let displayStreakDay = 1;
  let displayReward = 50;

  if (isClaimed) {
    displayStreakDay = currentStreak;
    let tomorrowStreak = currentStreak + 1;
    if (tomorrowStreak > 7) tomorrowStreak = 1;
    displayReward = rewards[tomorrowStreak - 1];
  } else {
    if (currentStreak === 0) {
      displayStreakDay = 1;
      displayReward = rewards[0];
    } else {
      const lastCheck = new Date(user.lastCheckIn);
      const lastCheckDay = new Date(lastCheck.getFullYear(), lastCheck.getMonth(), lastCheck.getDate());
      const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
      const diffDays = Math.floor((today - lastCheckDay) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        displayStreakDay = currentStreak + 1;
        if (displayStreakDay > 7) displayStreakDay = 1;
        displayReward = rewards[displayStreakDay - 1];
      } else {
        displayStreakDay = 1;
        displayReward = rewards[0];
      }
    }
  }

  useEffect(() => {
    const handler = (e) => {
      // Prevent the default mini-infobar
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success("App Installed Successfully! 🎉");
      setShowInstallBtn(false);
    }
    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  return (
    <div className="lobby-container">
      
      {/* Floating Profile Button - Top Right */}
      <Link to="/profile" className="profile-fab">👤</Link>

      <header style={{ marginBottom: '30px' }}>
        <h2>Welcome, {user?.displayname}!</h2>
        <p>Wallet: {user?.coins} 🪙</p>
        <button onClick={() => { logout(); navigate('/login'); }} className="btn-danger" style={{ marginTop: '15px', width: 'auto', padding: '8px 20px' }}>
          Logout
        </button>
      </header>

      {/* NEW: Install App Button */}
      {showInstallBtn && (
        <button 
          onClick={handleInstallClick} 
          className="btn-secondary" 
          style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          📲 Install App
        </button>
      )}

      {/* DAILY BONUS SECTION */}
      <div className="daily-bonus-card">
        <h3>🔥 Daily Streak: Day {displayStreakDay}</h3>
        
        {isClaimed ? (
          <>
            <p>Tomorrow's Reward: +{displayReward} 🪙</p>
            <p style={{ marginTop: '10px', color: '#22c55e', fontWeight: 'bold', fontSize: '0.9rem' }}>✅ Come back tomorrow!</p>
          </>
        ) : (
          <>
            <p>Today's Reward: +{displayReward} 🪙</p>
            <button 
              onClick={handleClaimBonus} 
              className="btn-primary"
              style={{ marginTop: '10px' }}
            >
              Claim +{displayReward} Coins!
            </button>
          </>
        )}
      </div>

      <div className="lobby-actions">
        <button onClick={() => setShowCreate(true)} className="btn-primary">Create Room</button>
        <button onClick={() => setShowJoin(true)} className="btn-secondary">Join Room</button>
      </div>

      {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} />}
      {showJoin && <JoinRoomModal onClose={() => setShowJoin(false)} />}
    </div>
  );
};

export default LobbyPage;