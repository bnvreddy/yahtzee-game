const calculateScores = (dice) => {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  let sum = 0;

  dice.forEach(die => {
    counts[die]++;
    sum += die;
  });

  const results = {
    ones: 0, twos: 0, threes: 0, fours: 0, fives: 0, sixes: 0,
    threeOfAKind: 0, fourOfAKind: 0, fullHouse: 0,
    smallStraight: 0, largeStraight: 0, yahtzee: 0, chance: 0
  };

  results.ones = counts[1] * 1;
  results.twos = counts[2] * 2;
  results.threes = counts[3] * 3;
  results.fours = counts[4] * 4;
  results.fives = counts[5] * 5;
  results.sixes = counts[6] * 6;

  const maxCount = Math.max(...counts.slice(1));

  if (maxCount >= 3) results.threeOfAKind = sum;
  if (maxCount >= 4) results.fourOfAKind = sum;
  
  const hasThree = counts.slice(1).includes(3);
  const hasTwo = counts.slice(1).includes(2);
  if (hasThree && hasTwo) results.fullHouse = 25;

  const uniqueDice = [...new Set(dice)].sort().join('');
  if (uniqueDice.includes('1234') || uniqueDice.includes('2345') || uniqueDice.includes('3456')) {
    results.smallStraight = 30;
  }
  if (uniqueDice === '12345' || uniqueDice === '23456') {
    results.largeStraight = 40;
  }

  if (maxCount === 5) results.yahtzee = 50;
  results.chance = sum;

  return results;
};

export default calculateScores;