import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import SingleDie from './SingleDie';

const DiceArea = () => {
  const { user } = useContext(AuthContext);
  const { gameState, currentDice, rollsLeft, heldDice, setHeldDice, isPaused } = useGame();
  const socket = useSocket();
  
  const [isRolling, setIsRolling] = useState(false);

  const isMyTurn = gameState?.players[gameState.currentTurnIndex] === user.loginname;

  const handleHold = (index) => {
    if (!isMyTurn || rollsLeft === 3 || isRolling || isPaused) return; 
    
    // 1. Update local state INSTANTLY (so the clicker feels zero lag)
    const newHeld = [...heldDice];
    newHeld[index] = !newHeld[index];
    setHeldDice(newHeld);

    // 2. EMIT TO SERVER (so the other players see the dice pop up)
    socket.emit('toggle-die', gameState.roomCode, user.loginname, index);
  };

  const handleRoll = () => {
    if (!isMyTurn || rollsLeft <= 0 || isRolling || isPaused) return;
    
    setIsRolling(true);
    socket.emit('roll-dice', gameState.roomCode, user.loginname, heldDice);

    // Just wait for the CSS animation to finish, then allow interactions
    setTimeout(() => {
      setIsRolling(false);
    }, 400); // Matches CSS animation duration
  };

  return (
    <div className="dice-area">
      <div className="dice-container">
        {currentDice.map((die, idx) => (
          <SingleDie 
            key={idx} 
            value={die} 
            isHeld={heldDice[idx]} 
            isRolling={isRolling && !heldDice[idx]} 
            holdDie={() => handleHold(idx)}
          />
        ))}
      </div>
      <p className="rolls-left-text">Rolls Left: {rollsLeft}</p>
      <button 
        onClick={handleRoll} 
        disabled={!isMyTurn || rollsLeft <= 0 || isRolling || isPaused}
        className="btn-primary roll-btn"
      >
        {isPaused ? '⏸️ Paused' : 
         isRolling ? '🎲 Rolling...' : 
         isMyTurn ? 'ROLL DICE' : 
         `⏳ ${gameState?.playerStates[gameState.players[gameState.currentTurnIndex]]?.displayname}'s Turn`}
      </button>
    </div>
  );
};

export default DiceArea;