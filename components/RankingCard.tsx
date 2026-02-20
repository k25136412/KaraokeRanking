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
      {/* 下部のプログレスバー */}
      <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 w-full">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500" style={{ width: `${(r.gamesPlayed / 3) * 100}%` }} />
      </div>

      {/* ▼ 全体を縦に並べるコンテナ ▼ */}
      <div className="relative z-10 flex flex-col gap-3">

        {/* ＝＝＝ 1段目：名前とハンデキャップ（横幅をフルに使う） ＝＝＝ */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
          {/* text-xlで名前を少し強調し、横幅いっぱい使えるようにしました */}
          <h3 className="font-bold text-white text-xl truncate pr-2">{r.name}</h3>
          <div className="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded-md shadow-inner flex-shrink-0">
            Hdcp: +{r.handicap}
          </div>
        </div>

        {/* ＝＝＝ 2段目：順位、曲リスト、合計スコア ＝＝＝ */}
        <div className="flex items-center gap-3">

          {/* 左側：順位 */}
          <div className={`flex flex-col items-center justify-center w-8 ${medalColor}`}>
            {isTop ? <IconTrophy /> : <span className="text-3xl font-black font-mono">{r.rank}</span>}
          </div>

          {/* 中央：曲リスト（前回の拡大サイズを維持） */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3">
              {(['song1', 'song2', 'song3'] as const).map((key, i) => {
                const score = r.scores[key];
                const title = r.scores[`${key}Title` as keyof ScoreData];
                const artworkUrl = r.scores[`${key}Artwork` as keyof ScoreData];
                const evidenceUrl = r.scores[`${key}Image` as keyof ScoreData];

                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex-shrink-0 overflow-hidden shadow-inner flex items-center justify-center">
                      {artworkUrl ? (
                        <img src={artworkUrl as string} className="w-full h-full object-cover" alt="Jacket" />
                      ) : (
                        <div className="text-slate-700 text-xs">♪</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      {title && <div className="text-xs text-slate-300 truncate leading-tight mb-1">{title}</div>}
                      <div className={`flex items-center justify-center gap-3 py-1.5 rounded text-sm ${score ? 'bg-slate-800 text-indigo-300' : 'bg-slate-800/30 text-slate-600'}`}>
                        <span className="font-mono font-bold">{score || '-'}</span>
                        {evidenceUrl && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenPreview(evidenceUrl as string); }}
                            className="text-indigo-400 hover:text-indigo-200 transition-colors p-0.5 [&>svg]:w-5 [&>svg]:h-5"
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

          {/* 右側：最終スコア */}
          <div className="text-right pl-2 flex flex-col items-end">
            <div className="flex items-center gap-1 mb-1 text-[10px] text-slate-500">
              <span>素点Avg</span><span className="text-sm font-bold text-slate-300 font-mono">{r.average.toFixed(3)}</span>
            </div>
            {/* 順位の数字とバランスを取るために、ここのスコアも少し大きく(text-3xl)しました */}
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