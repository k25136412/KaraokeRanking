export interface ScoreData {
  song1: number | '';
  song2: number | '';
  song3: number | '';
}

export interface Participant {
  id: string;
  name: string;
  handicap: number;
  scores: ScoreData;
}

export interface Session {
  id: string;
  date: string; // ISO string
  name: string;
  location?: string;
  machineType?: string;
  participants: Participant[];
  isFinished: boolean;
  isDeleted?: boolean;
}

export type ViewState = 'HISTORY' | 'SETUP' | 'ACTIVE' | 'DETAILS' | 'DELETED_HISTORY';

export interface RankingItem extends Participant {
  average: number;
  finalScore: number;
  rank: number;
  gamesPlayed: number;
  nextHandicap: number;
}