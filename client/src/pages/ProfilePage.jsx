import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/auth';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { user, logout, syncWallet, updateDisplayNameLocal } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [newDisplayName, setNewDisplayName] = useState(user?.displayname || '');

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

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (newDisplayName.trim() === '') {
      toast.error("Display name cannot be empty!");
      return;
    }
    if (newDisplayName === user.displayname) {
      toast.info("No changes made.");
      return;
    }

    try {
      const data = await authApi.updateDisplayName(user.loginname, newDisplayName);
      updateDisplayNameLocal(data.displayname); // Update React state instantly
      toast.success("Display name updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update name');
    }
  };

  const rewards = [50, 100, 150, 200, 250, 300, 500];
  const currentStreak = user?.currentStreakDay || 0;
  const nextReward = currentStreak > 0 && currentStreak < 7 ? rewards[currentStreak] : rewards[0];

  return (
    <div className="auth-container" style={{ width: '400px' }}>
      <h2 style={{ marginBottom: '20px' }}>My Profile</h2>
      
      <div className="profile-info-box">
        <p><strong>Login Name:</strong> {user?.loginname}</p>
        <p><strong>Wallet Balance:</strong> {user?.coins} 🪙</p>
        <p><strong>Daily Streak:</strong> Day {currentStreak} (Next: +{nextReward} 🪙)</p>
      </div>

      <form onSubmit={handleUpdateName} style={{ marginTop: '30px', textAlign: 'left' }}>
        <label style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Change Display Name</label>
        <input 
          type="text" 
          value={newDisplayName} 
          onChange={(e) => setNewDisplayName(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">Save Name</button>
      </form>

      <div style={{ marginTop: '40px', display: 'flex', gap: '10px', width: '100%' }}>
        <button onClick={() => navigate('/lobby')} className="btn-secondary" style={{ flex: 1 }}>
          Back to Lobby
        </button>
        <button onClick={() => { logout(); navigate('/login'); }} className="btn-secondary" style={{ flex: 1 }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;