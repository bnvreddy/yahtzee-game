import { createContext, useState, useContext, useEffect } from 'react';
import { useSocket } from './SocketContext';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const socket = useSocket();
  const [gameState, setGameState] = useState(null);
  const [currentDice, setCurrentDice] = useState([0, 0, 0, 0, 0]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [heldDice, setHeldDice] = useState([false, false, false, false, false]);
  const [gameOverData, setGameOverData] = useState(null);
  
  // NEW: Pause & Connection State
  const [isPaused, setIsPaused] = useState(false);
  const [disconnectedPlayer, setDisconnectedPlayer] = useState(null);
  const [connectedPlayers, setConnectedPlayers] = useState({});

  useEffect(() => {
    if (!socket) return;

    socket.on('game-state-update', (state) => {
      setGameState(state);
      setCurrentDice(state.currentDice);
      setRollsLeft(state.rollsLeft);
      setHeldDice(state.heldDice);
      setIsPaused(state.isPaused); // Sync pause state
      setDisconnectedPlayer(state.disconnectedPlayer);
      setConnectedPlayers(state.connectedPlayers);
    });

    socket.on('dice-rolled', ({ currentDice, rollsLeft, heldDice }) => {
      setCurrentDice(currentDice);
      setRollsLeft(rollsLeft);
      setHeldDice(heldDice);
    });

    socket.on('dice-toggled', (updatedHeldDice) => {
      setHeldDice(updatedHeldDice);
    });

    socket.on('game-over', (data) => {
      setGameOverData(data);
    });

    // NEW: Pause/Resume Listeners
    socket.on('game-paused', (data) => {
      setIsPaused(true);
      setDisconnectedPlayer(data.disconnectedPlayer);
    });

    socket.on('game-resumed', () => {
      setIsPaused(false);
      setDisconnectedPlayer(null);
    });

    socket.on('player-connection-update', (data) => {
      setConnectedPlayers(data);
    });

    return () => {
      socket.off('game-state-update');
      socket.off('dice-rolled');
      socket.off('dice-toggled');
      socket.off('game-over');
      socket.off('game-paused');
      socket.off('game-resumed');
      socket.off('player-connection-update');
    };
  }, [socket]);

  return (
    <GameContext.Provider value={{ gameState, currentDice, rollsLeft, heldDice, gameOverData, setHeldDice, isPaused, disconnectedPlayer, connectedPlayers }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);