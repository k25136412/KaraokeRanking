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
    average: parseFloat(average.toFixed(2)),
    finalScore: parseFloat(finalScore.toFixed(2)),
    gamesPlayed
  };
};

export const generateRanking = (participants: Participant[]): RankingItem[] => {
  // 1. Calculate basic stats for everyone
  const tempRanked = participants.map(p => {
    const stats = calculateStats(p);
    return { ...p, ...stats };
  });

  // 2. Find the global max song score across all participants
  let globalMaxSongScore = 0;
  participants.forEach(p => {
    [p.scores.song1, p.scores.song2, p.scores.song3].forEach(s => {
      if (typeof s === 'number' && s > globalMaxSongScore) {
        globalMaxSongScore = s;
      }
    });
  });

  // 3. Calculate rank and next handicap
  // Sort by Final Score descending
  tempRanked.sort((a, b) => b.finalScore - a.finalScore);

  return tempRanked.map((item, index) => {
    // Formula: Max Song Score - My Final Score (Max 15)
    let nextHandicap = globalMaxSongScore - item.finalScore;
    if (nextHandicap < 0) nextHandicap = 0; // Floor at 0
    if (nextHandicap > 15) nextHandicap = 15; // Cap at 15

    return {
      ...item,
      rank: index + 1,
      nextHandicap: parseFloat(nextHandicap.toFixed(2))
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