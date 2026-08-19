export interface ScoreData {
  song1: number | '';
  song1Title: string;
  song1Image?: string;
  song1Artwork?: string;
  song2: number | '';
  song2Title: string;
  song2Image?: string;
  song2Artwork?: string;
  song3: number | '';
  song3Title: string;
  song3Image?: string;
  song3Artwork?: string;
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