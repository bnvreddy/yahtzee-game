const prisma = require('../config/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/authUtils');

const register = async (req, res) => {
  try {
    const { loginname, displayname, password } = req.body;

    // Check if loginname already exists
    const existingUser = await prisma.user.findUnique({ where: { loginname } });
    if (existingUser) {
      return res.status(400).json({ message: 'Login name already taken' });
    }

    // Hash password
    const hashedPwd = await hashPassword(password);

    // Create user with 1000 coins default
    const user = await prisma.user.create({
      data: {
        loginname,
        displayname,
        password: hashedPwd,
        coins: 1000,
      },
    });

    // Generate JWT
    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        loginname: user.loginname,
        displayname: user.displayname,
        coins: user.coins,
        currentStreakDay: user.currentStreakDay,
        lastCheckIn: user.lastCheckIn,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { loginname, password } = req.body;

    const user = await prisma.user.findUnique({ where: { loginname } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        loginname: user.loginname,
        displayname: user.displayname,
        coins: user.coins,
        currentStreakDay: user.currentStreakDay,
        lastCheckIn: user.lastCheckIn,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};


const claimDailyBonus = async (req, res) => {
  try {
    const { loginname } = req.body;

    const user = await prisma.user.findUnique({ where: { loginname } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const rewards = [50, 100, 150, 200, 250, 300, 500];

    let newStreakDay = 1;
    let rewardIndex = 0;

    if (user.lastCheckIn) {
      const lastCheck = new Date(user.lastCheckIn);
      const lastCheckDay = new Date(lastCheck.getFullYear(), lastCheck.getMonth(), lastCheck.getDate());
      
      const diffTime = today - lastCheckDay;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already claimed today
        return res.status(400).json({ message: 'Already claimed today', currentStreakDay: user.currentStreakDay });
      } else if (diffDays === 1) {
        // Consecutive day!
        newStreakDay = user.currentStreakDay + 1;
        // Loop back to Day 1 after Day 7
        if (newStreakDay > 7) newStreakDay = 1;
      } else {
        // Missed a day, reset to Day 1
        newStreakDay = 1;
      }
    } else {
      // First time ever claiming
      newStreakDay = 1;
    }

    rewardIndex = newStreakDay - 1;
    const rewardAmount = rewards[rewardIndex];

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { loginname },
      data: {
        coins: { increment: rewardAmount },
        currentStreakDay: newStreakDay,
        lastCheckIn: now
      }
    });

    res.status(200).json({
      message: `Claimed Day ${newStreakDay} bonus!`,
      reward: rewardAmount,
      newBalance: updatedUser.coins,
      currentStreakDay: updatedUser.currentStreakDay
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error claiming bonus' });
  }
};



const updateDisplayName = async (req, res) => {
  try {
    const { loginname, newDisplayName } = req.body;

    if (!newDisplayName || newDisplayName.trim() === '') {
      return res.status(400).json({ message: 'Display name cannot be empty' });
    }

    const updatedUser = await prisma.user.update({
      where: { loginname },
      data: { displayname: newDisplayName.trim() }
    });

    res.status(200).json({ 
      message: 'Display name updated successfully!',
      displayname: updatedUser.displayname 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating display name' });
  }
};

module.exports = { register, login, claimDailyBonus, updateDisplayName };


