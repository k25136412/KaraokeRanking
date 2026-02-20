import React from 'react';
import { RankingItem, ScoreData } from '../types';
import { Card } from './Card';
import { IconTrophy, IconCamera } from './Icons';

interface RankingCardProps {
  r: RankingItem;
  index: number;
  isFinished: boolean;
  onOpenScore: (id: string) => void;
  onOpenPreview: (url: string) => void;
}

export const RankingCard: React.FC<RankingCardProps> = ({ r, index, isFinished, onOpenScore, onOpenPreview }) => {
  const isTop = index === 0;
  const medalColor = isTop ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-slate-500';

  return (
    <Card className={`relative overflow-hidden transition-all ${isTop ? 'border-yellow-500/30 bg-yellow-500/5' : ''}`} onClick={() => onOpenScore(r.id)}>
      <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 w-full">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500" style={{ width: `${(r.gamesPlayed / 3) * 100}%` }} />
      </div>
      
      <div className="flex items-center gap-3 relative z-10">
        <div className={`flex flex-col items-center justify-center w-8 ${medalColor}`}>
          {isTop ? <IconTrophy /> : <span className="text-2xl font-black font-mono">{r.rank}</span>}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white truncate text-lg mr-2">{r.name}</h3>
            <div className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">Hdcp: +{r.handicap}</div>
          </div>
          
          <div className="flex flex-col gap-2 mt-2">
            {(['song1', 'song2', 'song3'] as const).map((key, i) => {
              const score = r.scores[key];
              const title = r.scores[`${key}Title` as keyof ScoreData];
              const artworkUrl = r.scores[`${key}Artwork` as keyof ScoreData];
              const evidenceUrl = r.scores[`${key}Image` as keyof ScoreData];

              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex-shrink-0 overflow-hidden shadow-inner flex items-center justify-center">
                    {artworkUrl ? (
                      <img src={artworkUrl as string} className="w-full h-full object-cover" alt="Jacket" />
                    ) : (
                      <div className="text-slate-700 text-[10px]">♪</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    {title && <div className="text-[9px] text-slate-400 truncate leading-tight mb-0.5">{title}</div>}
                    <div className={`flex items-center justify-center gap-1.5 py-0.5 rounded text-[10px] ${score ? 'bg-slate-800 text-indigo-300' : 'bg-slate-800/30 text-slate-600'}`}>
                      <span className="font-mono">{score || '-'}</span>
                      {evidenceUrl && (
                        <button onClick={(e) => { e.stopPropagation(); onOpenPreview(evidenceUrl as string); }} className="text-indigo-400 hover:text-indigo-200 transition-colors">
                          <IconCamera />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-right pl-2 flex flex-col items-end">
          <div className="flex items-center gap-1 mb-1 text-[10px] text-slate-500">
            <span>素点Avg</span><span className="text-sm font-bold text-slate-300 font-mono">{r.average.toFixed(3)}</span>
          </div>
          <div className="text-2xl font-black text-white tracking-tighter leading-none">{r.finalScore.toFixed(3)}</div>
          {isFinished && <div className="mt-1 text-[10px] text-pink-400 font-medium bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20">次回H: +{r.nextHandicap}</div>}
        </div>
      </div>
    </Card>
  );
};