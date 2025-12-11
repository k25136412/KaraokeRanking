import React, { useEffect, useState } from 'react';
import { Participant, ScoreData } from '../types';
import { Button } from './Button';

interface ScoreModalProps {
  participant: Participant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, scores: ScoreData) => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({ participant, isOpen, onClose, onSave }) => {
  const [scores, setScores] = useState<ScoreData>({ song1: '', song2: '', song3: '' });

  useEffect(() => {
    if (participant) {
      setScores(participant.scores);
    }
  }, [participant]);

  if (!isOpen || !participant) return null;

  const handleScoreChange = (key: keyof ScoreData, value: string) => {
    // Allow empty string or numbers only
    if (value === '' || /^\d+(\.\d{0,3})?$/.test(value)) {
      // Limit to reasonable karaoke score (0-100)
      const num = parseFloat(value);
      if (value !== '' && (num < 0 || num > 100)) return;
      
      setScores(prev => ({ ...prev, [key]: value === '' ? '' : Number(value) }));
    }
  };

  const handleSave = () => {
    onSave(participant.id, scores);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-slate-600 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <h3 className="text-xl font-bold text-white mb-1">{participant.name}</h3>
        <p className="text-sm text-slate-400 mb-6">ハンデ: +{participant.handicap}点</p>

        <div className="space-y-4">
          {(['song1', 'song2', 'song3'] as const).map((key, index) => (
            <div key={key} className="flex items-center gap-4">
              <span className="w-12 text-sm font-bold text-indigo-300">#{index + 1}</span>
              <input
                type="number"
                step="0.001"
                inputMode="decimal"
                value={scores[key]}
                onChange={(e) => handleScoreChange(key, e.target.value)}
                placeholder="点数を入力 (0-100)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-lg text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          <Button variant="secondary" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSave} className="flex-1">保存</Button>
        </div>
      </div>
    </div>
  );
};