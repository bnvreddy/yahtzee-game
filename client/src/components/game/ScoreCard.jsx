import { useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useSocket } from '../../context/SocketContext';
import ScoreRow from './ScoreRow';

const ScoreCard = () => {
  const { user } = useContext(AuthContext);
  const { gameState, currentDice, rollsLeft } = useGame();
  const socket = useSocket();

  const isMyTurn = gameState?.players[gameState.currentTurnIndex] === user.loginname;
  const currentTurnPlayer = gameState?.players[gameState.currentTurnIndex];
  // Get an array of all players with their displaynames
  const allPlayers = gameState?.players.map(pName => ({
    loginname: pName,
    displayname: gameState.playerStates[pName]?.displayname || pName
  })) || [];

  const handleLock = (category) => {
    socket.emit('lock-score', gameState.roomCode, user.loginname, category);
  };

  const categories = [
    { key: 'ones', label: 'Ones' },
    { key: 'twos', label: 'Twos' },
    { key: 'threes', label: 'Threes' },
    { key: 'fours', label: 'Fours' },
    { key: 'fives', label: 'Fives' },
    { key: 'sixes', label: 'Sixes' },
    { key: 'threeOfAKind', label: '3 of a Kind' },
    { key: 'fourOfAKind', label: '4 of a Kind' },
    { key: 'fullHouse', label: 'Full House' },
    { key: 'smallStraight', label: 'Sm. Straight' },
    { key: 'largeStraight', label: 'Lg. Straight' },
    { key: 'yahtzee', label: 'YAHTZEE' },
    { key: 'chance', label: 'Chance' },
  ];

  const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];

  return (
    <div className="scorecard-container">
      {/* Dynamic Grid: 1fr for category, 60px for each player column */}
      <div className="scorecard-grid" style={{ gridTemplateColumns: `1fr repeat(${allPlayers.length}, 60px)` }}>
        
        {/* Header Row */}
        <div className="score-header-cat">Category</div>
        {allPlayers.map(p => (
          <div key={p.loginname} className="score-header-player">
            {p.displayname} {p.loginname === user.loginname ? '(You)' : ''}
          </div>
        ))}

        {/* Category Rows */}
        {categories.map(cat => (
          <ScoreRow 
            key={cat.key}
            category={cat.key}
            label={cat.label}
            allPlayers={allPlayers}
            myLoginname={user.loginname}
            playerStates={gameState.playerStates}
            currentTurnPlayer={currentTurnPlayer}
            currentDice={currentDice}
            isMyTurn={isMyTurn}
            rollsLeft={rollsLeft}
            onLock={handleLock}
          />
        ))}

                {/* Bonus Row (Dynamic Progress) */}
        <div className="score-category bonus-row">Upper Bonus</div>
        {allPlayers.map(p => {
           const upperSum = upperCategories.reduce((sum, cat) => sum + (gameState.playerStates[p.loginname]?.scorecard[cat] || 0), 0);
           const hasBonus = upperSum >= 63;
           
           return (
             <div key={p.loginname} className={`score-cell locked bonus-row ${hasBonus ? 'bonus-achieved' : ''}`}>
               {hasBonus ? '✅ +35' : `${upperSum}/63`}
             </div>
           )
        })}

        {/* Total Score Row */}
        <div className="score-category total-row">Total</div>
        {allPlayers.map(p => (
          <div key={p.loginname} className="score-cell locked total-row">
            {gameState.playerStates[p.loginname]?.totalScore || 0}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreCard;