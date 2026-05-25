import { createContext, useState, useEffect } from 'react';
import authApi from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('yahtzee_token');
    const userData = localStorage.getItem('yahtzee_user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const register = async (loginname, displayname, password) => {
    try {
      const data = await authApi.register({ loginname, displayname, password });
      localStorage.setItem('yahtzee_token', data.token);
      localStorage.setItem('yahtzee_user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const login = async (loginname, password) => {
    try {
      const data = await authApi.login({ loginname, password });
      localStorage.setItem('yahtzee_token', data.token);
      localStorage.setItem('yahtzee_user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('yahtzee_token');
    localStorage.removeItem('yahtzee_user');
    setUser(null);
  };

  const addCoins = (amount) => {
    if (user) {
      const updatedUser = { ...user, coins: user.coins + amount };
      setUser(updatedUser);
      localStorage.setItem('yahtzee_user', JSON.stringify(updatedUser));
    }
  };

  const syncWallet = (newAmount) => {
    if (user) {
      const updatedUser = { ...user, coins: newAmount };
      setUser(updatedUser);
      localStorage.setItem('yahtzee_user', JSON.stringify(updatedUser));
    }
  };

  const deductCoins = (amount) => {
    if (user) {
      const updatedUser = { ...user, coins: user.coins - amount };
      setUser(updatedUser);
      localStorage.setItem('yahtzee_user', JSON.stringify(updatedUser));
    }
  };

  const updateStreak = (newBalance, newStreakDay, newLastCheckIn) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        coins: newBalance, 
        currentStreakDay: newStreakDay, 
        lastCheckIn: newLastCheckIn 
      };
      setUser(updatedUser);
      localStorage.setItem('yahtzee_user', JSON.stringify(updatedUser));
    }
  };

    // NEW: Update Display Name locally
  const updateDisplayNameLocal = (newName) => {
    if (user) {
      const updatedUser = { ...user, displayname: newName };
      setUser(updatedUser);
      localStorage.setItem('yahtzee_user', JSON.stringify(updatedUser));
    }
  };

  // Update the return statement to include it
  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, addCoins, syncWallet, deductCoins, updateStreak, updateDisplayNameLocal }}>
      {children}
    </AuthContext.Provider>
  );
};