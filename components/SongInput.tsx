import React, { useState, useEffect, useRef } from 'react';
import { searchSongs, iTunesSong } from '../services/itunesService';

interface SongInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SongInput: React.FC<SongInputProps> = ({ value, onChange, placeholder }) => {
  const [suggestions, setSuggestions] = useState<iTunesSong[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 入力が変わるたびに検索（デバウンス処理）
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length > 0) {
        const results = await searchSongs(value);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } else {
        setSuggestions([]);
      }
    }, 500); // 0.5秒入力が止まったら検索
    return () => clearTimeout(timer);
  }, [value]);

  // 外側をクリックしたら候補を閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
      />
      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 bg-surface border border-slate-600 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
          {suggestions.map((song, i) => (
            <li
              key={i}
              onClick={() => {
                onChange(`${song.trackName} / ${song.artistName}`);
                setIsOpen(false);
              }}
              className="px-4 py-2 text-xs hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-none"
            >
              <div className="font-bold text-slate-200">{song.trackName}</div>
              <div className="text-slate-400">{song.artistName}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};