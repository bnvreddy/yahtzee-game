import '../game/GameStyles.css';

const SingleDie = ({ value, isHeld, isRolling, holdDie }) => {
  // Don't render dice structure if it hasn't been rolled yet
  if (value === 0) {
    return (
      <div className={`single-die unrolled`} onClick={holdDie}>
        ?
      </div>
    );
  }

  // Combine all active classes
  const dieClasses = [
    'single-die',
    isHeld ? 'held' : '',
    isRolling ? 'rolling' : ''
  ].join(' ').trim();

  return (
    <div 
      className={dieClasses}
      onClick={holdDie}
    >
      <div className="dice-grid">
        {/* Top Row */}
        <div className={`dot-container top-left ${(value === 2 || value === 3 || value === 4 || value === 5 || value === 6) ? 'visible' : ''}`}>
          <div className="dot"></div>
        </div>
        <div className={`dot-container top-center `}>
          <div className="dot"></div>
        </div>
        <div className={`dot-container top-right ${(value === 4 || value === 5 || value === 6) ? 'visible' : ''}`}>
          <div className="dot"></div>
        </div>

        {/* Middle Row */}
        <div className={`dot-container middle-left ${(value === 6) ? 'visible' : ''}`}>
          <div className="dot"></div>
        </div>
        <div className={`dot-container middle-center ${(value === 1 || value === 3 || value === 5) ? 'visible' : ''}`}>
          <div className="dot"></div>
        </div>
        <div className={`dot-container middle-right ${(value === 6) ? 'visible' : ''}`}>
          <div className="dot"></div>
        </div>

        {/* Bottom Row */}
        <div className={`dot-container bottom-left ${(value === 4 || value === 5 || value === 6) ? 'visible' : ''}`}>
          <div className="dot"></div>
        </div>
        <div className={`dot-container bottom-center `}>
          <div className="dot"></div>
        </div>
        <div className={`dot-container bottom-right ${(value === 2 || value === 3 || value === 4 || value === 5 || value === 6) ? 'visible' : ''}`}>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
};

export default SingleDie;