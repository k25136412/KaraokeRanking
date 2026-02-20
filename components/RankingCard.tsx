import React from 'react';
import { RankingItem, ScoreData } from '../types';
import { Card } from './Card';
import { IconTrophy, IconCamera } from './Icons';

// 王冠アイコン（より見やすく調整）
const IconCrown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-damgold drop-shadow-[0_0_8px_rgba(255,183,0,1)]">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007zm-4.48 14.714a.75.75 0 001.139.983L12 16.33l4.553 2.578a.75.75 0 001.139-.983l-1.257-5.273 4.117-3.527c.773-.663.362-1.882-.652-1.963l-5.404-.433L12.48 2.606a.75.75 0 00-1.375 0L9.022 7.73l-5.404.433c-1.014.081-1.425 1.3-.652 1.963l4.117 3.527-1.257 5.273z" clipRule="evenodd" />
  </svg>
);

interface RankingCardProps {
  r: RankingItem;
  index: number;
  isFinished: boolean;
  highestRawScore: number | null; // 数値型に変更
  onOpenScore: (id: string) => void;
  onOpenPreview: (url: string) => void;
}

export const RankingCard: React.FC<RankingCardProps> = ({ r, index, isFinished, highestRawScore, onOpenScore, onOpenPreview }) => {
  const isTop = index === 0;
  const medalColor = isTop ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-slate-500';

  return (
    <Card className={`relative overflow-visible transition-all ${isTop ? 'border-yellow-500/30 bg-yellow-500/5' : ''}`} onClick={() => onOpenScore(r.id)}>
      <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 w-full">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500" style={{ width: `${(r.gamesPlayed / 3) * 100}%` }} />
      </div>

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
          <h3 className="font-bold text-white text-xl truncate pr-2">{r.name}</h3>
          <div className="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded-md shadow-inner flex-shrink-0">
            Hdcp: +{r.handicap}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex flex-col items-center justify-center w-8 ${medalColor}`}>
            {isTop ? <IconTrophy /> : <span className="text-3xl font-black font-mono">{r.rank}</span>}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3">
              {(['song1', 'song2', 'song3'] as const).map((key, i) => {
                const score = r.scores[key];
                const title = r.scores[`${key}Title` as keyof ScoreData];
                const artwork = r.scores[`${key}Artwork` as keyof ScoreData];
                const evidenceUrl = r.scores[`${key}Image` as keyof ScoreData];

                // ▼ 修正: 数字として比較する
                const scoreNum = score ? parseFloat(score) : null;
                const isHighest = scoreNum !== null && highestRawScore !== null && scoreNum === highestRawScore;

                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex-shrink-0 overflow-hidden shadow-inner flex items-center justify-center">
                      {artwork ? (
                        <img src={artwork as string} className="w-full h-full object-cover" alt="Jacket" />
                      ) : (
                        <div className="text-slate-700 text-xs">♪</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      {title && <div className="text-xs text-slate-300 truncate leading-tight mb-1">{title}</div>}

                      <div className={`flex items-center justify-center gap-3 py-1.5 rounded text-sm relative ${isHighest ? 'bg-damgold/20 text-damgold border border-damgold/50 shadow-[0_0_15px_rgba(255,183,0,0.4)]' : (score ? 'bg-slate-800 text-indigo-300' : 'bg-slate-800/30 text-slate-600')}`}>
                        {/* 王冠の位置を調整 */}
                        {isHighest && <div className="absolute -top-3 -left-2 z-20"><IconCrown /></div>}
                        <span className={`font-mono font-black ${isHighest ? 'text-lg scale-110' : 'font-bold'}`}>{score || '-'}</span>
                        {evidenceUrl && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenPreview(evidenceUrl as string); }}
                            className={`transition-colors p-0.5 [&>svg]:w-5 [&>svg]:h-5 ${isHighest ? 'text-damgold hover:text-yellow-200' : 'text-indigo-400 hover:text-indigo-200'}`}
                          >
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
            <div className="text-3xl font-black text-white tracking-tighter leading-none">{r.finalScore.toFixed(3)}</div>
            {isFinished && (
              <div className="mt-2 text-[10px] text-pink-400 font-medium bg-pink-500/10 px-2 py-1 rounded border border-pink-500/20">
                次回H: +{r.nextHandicap}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};