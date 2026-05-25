const calculateScores = (dice) => {
  // dice is an array of 5 numbers, e.g., [1, 3, 3, 3, 5]
  const counts = [0, 0, 0, 0, 0, 0, 0]; // Index 0 unused, 1-6 for dice faces
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

  // Upper Section
  results.ones = counts[1] * 1;
  results.twos = counts[2] * 2;
  results.threes = counts[3] * 3;
  results.fours = counts[4] * 4;
  results.fives = counts[5] * 5;
  results.sixes = counts[6] * 6;

  // Lower Section Helpers
  const maxCount = Math.max(...counts.slice(1));

  // Three of a Kind
  if (maxCount >= 3) results.threeOfAKind = sum;

  // Four of a Kind
  if (maxCount >= 4) results.fourOfAKind = sum;

  // Full House (3 of one, 2 of another)
  const hasThree = counts.slice(1).includes(3);
  const hasTwo = counts.slice(1).includes(2);
  if (hasThree && hasTwo) results.fullHouse = 25;

  // Straights
  const uniqueDice = [...new Set(dice)].sort().join('');
  if (uniqueDice.includes('1234') || uniqueDice.includes('2345') || uniqueDice.includes('3456')) {
    results.smallStraight = 30;
  }
  if (uniqueDice === '12345' || uniqueDice === '23456') {
    results.largeStraight = 40;
  }

  // Yahtzee (5 of a kind)
  if (maxCount === 5) results.yahtzee = 50;

  // Chance
  results.chance = sum;

  return results;
};

module.exports = calculateScores;