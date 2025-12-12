import { Participant, RankingItem, ScoreData } from '../types';

export const calculateStats = (participant: Participant): { average: number; finalScore: number; gamesPlayed: number } => {
  const { song1, song2, song3 } = participant.scores;
  const scores = [song1, song2, song3].filter((s): s is number => typeof s === 'number' && s !== 0);
  
  const gamesPlayed = scores.length;
  if (gamesPlayed === 0) {
    return { average: 0, finalScore: 0, gamesPlayed: 0 };
  }

  const sum = scores.reduce((a, b) => a + b, 0);
  const average = sum / gamesPlayed;
  // Final score is Average + Handicap
  let finalScore = average + participant.handicap;
  
  // Cap Final Score at 100
  if (finalScore > 100) {
    finalScore = 100;
  }

  return {
    average: parseFloat(average.toFixed(3)),
    finalScore: parseFloat(finalScore.toFixed(3)),
    gamesPlayed
  };
};

export const generateRanking = (participants: Participant[]): RankingItem[] => {
  // 1. Calculate basic stats for everyone
  const tempRanked = participants.map(p => {
    const stats = calculateStats(p);
    return { ...p, ...stats };
  });

  // 2. Find the highest final score across all participants
  let maxFinalScore = 0;
  tempRanked.forEach(p => {
    if (p.finalScore > maxFinalScore) {
      maxFinalScore = p.finalScore;
    }
  });

  // 3. Calculate rank and next handicap
  // Sort by Final Score descending
  // If tied, lower handicap is ranked higher (ascending handicap)
  tempRanked.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    // Tie-breaker: Lower handicap comes first
    return a.handicap - b.handicap;
  });

  return tempRanked.map((item, index) => {
    // New Formula: Max Final Score - My Final Score
    let diff = maxFinalScore - item.finalScore;
    
    // Ensure non-negative
    if (diff < 0) diff = 0;

    // Floor to integer (user request: 小数切り捨て)
    let nextHandicap = Math.floor(diff);
    
    // Cap at 15
    if (nextHandicap > 15) nextHandicap = 15;

    return {
      ...item,
      rank: index + 1,
      nextHandicap: nextHandicap
    };
  });
};

export const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};