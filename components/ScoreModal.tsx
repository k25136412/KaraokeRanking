import React, { useEffect, useState } from 'react';
import { Participant, ScoreData } from '../types';
import { Button } from './Button';
import { SongInput } from './SongInput';
import { analyzeScoreImage } from '../services/geminiOcrService';
import { uploadScoreImage } from '../services/firebase';

/**
 * ★追加機能: 画像をリサイズ・圧縮してデータ容量を削減する
 * 長辺を1000pxに制限し、JPEG形式(画質0.6)で書き出します。
 */
const compressImage = async (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 1000; // OCRに必要な十分な解像度
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // 容量を劇的に減らすため、JPEG形式で0.6の圧縮率を適用
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
  });
};

interface ScoreModalProps {
  participant: Participant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, scores: ScoreData) => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({ participant, isOpen, onClose, onSave }) => {
  const [scores, setScores] = useState<ScoreData>({
    song1: '', song1Title: '',
    song2: '', song2Title: '',
    song3: '', song3Title: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState<number | null>(null);

  useEffect(() => {
    if (participant) setScores(participant.scores);
  }, [participant]);

  if (!isOpen || !participant) return null;

  const fetchArtwork = async (query: string): Promise<string> => {
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1&country=jp`);
      const data = await response.json();
      return data.results[0]?.artworkUrl100 || "";
    } catch {
      return "";
    }
  };

  const handleScoreChange = (key: keyof ScoreData, value: string) => {
    if (value === '' || /^\d+(\.\d{0,3})?$/.test(value)) {
      const num = parseFloat(value);
      if (value !== '' && (num < 0 || num > 100)) return;
      setScores(prev => ({ ...prev, [key]: value === '' ? '' : value }));
    }
  };

  const handleTitleChange = async (index: number, value: string) => {
    const titleKey = `song${index + 1}Title` as keyof ScoreData;
    const artworkKey = `song${index + 1}Artwork` as keyof ScoreData;
    setScores(prev => ({ ...prev, [titleKey]: value }));

    if (value.length > 1) {
      const artwork = await fetchArtwork(value);
      setScores(prev => ({ ...prev, [artworkKey]: artwork }));
    }
  };

  const handleImageChange = async (index: number, file: File | null) => {
    if (!file) return;

    setIsAnalyzing(index);
    const reader = new FileReader();
    reader.onload = async () => {
      const originalBase64 = reader.result as string;

      // ★修正: 解析・アップロード前に画像を圧縮してダイエット
      const compressedBase64 = await compressImage(originalBase64);

      // 圧縮後のデータを使用して解析とアップロードを行う
      const ocrResult = await analyzeScoreImage(compressedBase64);
      const imageUrl = await uploadScoreImage(participant.id, index, compressedBase64);

      let artwork = "";
      if (ocrResult?.songTitle) {
        artwork = await fetchArtwork(ocrResult.songTitle);
      }

      const songKey = `song${index + 1}` as keyof ScoreData;
      const titleKey = `song${index + 1}Title` as keyof ScoreData;
      const imageKey = `song${index + 1}Image` as keyof ScoreData;
      const artworkKey = `song${index + 1}Artwork` as keyof ScoreData;

      setScores(prev => ({
        ...prev,
        [songKey]: ocrResult ? ocrResult.score : prev[songKey],
        [titleKey]: ocrResult ? ocrResult.songTitle || (prev[titleKey] as string) : (prev[titleKey] as string),
        [imageKey]: imageUrl || (prev[imageKey] as string),
        [artworkKey]: artwork || (prev[artworkKey] as string)
      }));
      setIsAnalyzing(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-slate-600 w-full max-w-md rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <h3 className="text-xl font-bold text-white mb-1">{participant.name}</h3>
        <p className="text-sm text-slate-400 mb-6">ハンデ: +{participant.handicap}点</p>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
          {([0, 1, 2]).map((index) => {
            const songKey = `song${index + 1}` as keyof ScoreData;
            const titleKey = `song${index + 1}Title` as keyof ScoreData;
            const imageKey = `song${index + 1}Image` as keyof ScoreData;
            const artworkKey = `song${index + 1}Artwork` as keyof ScoreData;
            const imgUrl = scores[imageKey] as string;
            const artworkUrl = scores[artworkKey] as string;

            return (
              <div key={index} className="space-y-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{index + 1} 曲目</span>

                  <div className="flex gap-2">
                    {isAnalyzing === index ? (
                      <span className="text-[10px] font-bold text-indigo-300 animate-pulse bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/30">AI解析中...</span>
                    ) : (
                      <>
                        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 text-white transition-all shadow-lg active:scale-95">
                          <span className="text-[10px] font-bold">📷 撮る</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => { handleImageChange(index, e.target.files?.[0] || null); e.target.value = ''; }}
                            disabled={isAnalyzing !== null}
                          />
                        </label>
                        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 border border-slate-500 text-slate-200 transition-all shadow-lg active:scale-95">
                          <span className="text-[10px] font-bold">🖼️ 選ぶ</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => { handleImageChange(index, e.target.files?.[0] || null); e.target.value = ''; }}
                            disabled={isAnalyzing !== null}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex-shrink-0 border border-slate-700 overflow-hidden shadow-inner flex items-center justify-center">
                    {artworkUrl ? <img src={artworkUrl} className="w-full h-full object-cover" alt="Jacket" /> : <div className="text-slate-700 text-xs">♪</div>}
                  </div>
                  <div className="flex-1">
                    <SongInput
                      value={scores[titleKey] as string || ''}
                      onChange={(val) => handleTitleChange(index, val)}
                      placeholder="曲名 / アーティスト名"
                    />
                  </div>
                </div>

                <input
                  type="number"
                  step="0.001"
                  inputMode="decimal"
                  value={scores[songKey]}
                  onChange={(e) => handleScoreChange(songKey, e.target.value)}
                  placeholder="00.000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-lg font-mono text-white focus:border-indigo-500 outline-none"
                />

                {imgUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-black/30 rounded-lg border border-slate-700/50">
                    <img src={imgUrl} alt="Score" className="w-12 h-12 object-cover rounded border border-slate-600" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">✓ 保存済み</span>
                      <a href={imgUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-300 underline mt-0.5">採点画像を確認</a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-8 pt-4 border-t border-slate-700">
          <Button variant="secondary" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={() => { onSave(participant.id, scores); onClose(); }} className="flex-1">保存</Button>
        </div>
      </div>
    </div>
  );
};