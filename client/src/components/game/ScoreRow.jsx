import '../game/GameStyles.css';
import calculateScores from '../../utils/yahtzeeCalculator';

const ScoreRow = ({ category, label, allPlayers, myLoginname, currentTurnPlayer, playerStates, currentDice, isMyTurn, rollsLeft, onLock }) => {
  const hasRolled = rollsLeft < 3; 
  
  // Calculate potential scores based on current dice
  let potentialScores = {};
  if (hasRolled && currentDice && currentDice[0] !== 0) {
    potentialScores = calculateScores(currentDice);
  }

  return (
    <>
      <div className="score-category">{label}</div>
      {allPlayers.map(player => {
        const isMe = player.loginname === myLoginname;
        const isMyTurnNow = player.loginname === currentTurnPlayer; // Is this the active player's column?
        
        const lockedScore = playerStates[player.loginname]?.scorecard[category];
        const isLocked = lockedScore !== undefined && lockedScore !== null;

        // Can only lock if it's MY screen, it's MY column, I haven't locked it, and dice are rolled
        const canLock = isMe && isMyTurnNow && !isLocked && hasRolled;

        let displayScore = '-';
        let cellClass = 'score-cell';

        if (isLocked) {
          displayScore = lockedScore;
          cellClass += ' locked';
        } else if (isMyTurnNow && hasRolled) {
          // ONLY show potential scores in the column of the player whose turn it is!
          displayScore = potentialScores[category] || 0;
          if (canLock) {
            cellClass += ' clickable'; // Gold clickable style only for the active player
          } else {
            cellClass += ' potential'; // Dim potential for the active player if viewing from another screen
          }
        }
        // If it's not their turn and not locked, it remains '-'

        return (
          <div 
            key={player.loginname}
            className={cellClass}
            onClick={() => canLock && onLock(category)}
          >
            {displayScore}
          </div>
        );
      })}
    </>
  );
};

export default ScoreRow;