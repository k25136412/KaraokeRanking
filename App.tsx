import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Session, ViewState, Participant, ScoreData, RankingItem } from './types';
import { calculateStats, generateRanking, formatDate } from './utils/calculations';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Card } from './components/Card';
import { ScoreModal } from './components/ScoreModal';
import { ConfirmModal } from './components/ConfirmModal';
import { onSessionsChange, saveSession, deleteSession as deleteSessionFromDB, getMasterList, saveMasterList as saveMasterListToDB } from './services/firebaseService';
import { seedDatabase } from './services/seed'; // 維持

// --- Icons (SVG) --- 全10種、すべて維持
const IconTrophy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-yellow-400">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);
const IconHistory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconMic = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);
const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const IconMapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
const IconMusicNote = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
  </svg>
);
const IconRestore = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);
const IconCamera = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M10 8a3 3 0 100 6 3 3 0 000-6z" />
    <path fillRule="evenodd" d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-1.581a.5.5 0 01-.447-.276l-.856-1.712a1.5 1.5 0 00-1.342-.832H8.226a1.5 1.5 0 00-1.342.832l-.856 1.712a.5.5 0 01-.447.276H5zM3 7a4 4 0 014-4h6a4 4 0 014 4v8a4 4 0 01-4 4H7a4 4 0 01-4-4V7z" clipRule="evenodd" />
  </svg>
);

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [masterList, setMasterList] = useState<string[]>([]);
  const [view, setView] = useState<ViewState>('HISTORY');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // セットアップ状態
  const [setupName, setSetupName] = useState('');
  const [setupDate, setSetupDate] = useState('');
  const [setupLocation, setSetupLocation] = useState('');
  const [setupMachine, setSetupMachine] = useState('');
  const [setupParticipants, setSetupParticipants] = useState<{ name: string; handicap: number }[]>([]);
  const [newMasterName, setNewMasterName] = useState('');

  // Active/Details 状態
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const COMMON_PASSWORD = "4646";

  // 削除状態
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [hardDeleteTargetId, setHardDeleteTargetId] = useState<string | null>(null);

  // --- ★ ブラウザ履歴同期ロジック (スマホChrome戻るボタン対応) ---
  const navigateTo = useCallback((nextView: ViewState, id: string | null = null) => {
    setView(nextView);
    if (id !== undefined) setActiveSessionId(id);
    window.history.pushState({ view: nextView, sessionId: id }, '');
  }, []);

  useEffect(() => {
    // ページロード時に履歴の1番目を固定（スマホ対策）
    if (!window.history.state) {
      window.history.replaceState({ view: 'HISTORY', sessionId: null }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (previewImageUrl) {
        setPreviewImageUrl(null);
        return;
      }
      if (scoreModalOpen) {
        setScoreModalOpen(false);
        return;
      }
      const state = event.state;
      if (state && state.view) {
        setView(state.view);
        setActiveSessionId(state.sessionId || null);
      } else {
        setView('HISTORY');
        setActiveSessionId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [previewImageUrl, scoreModalOpen]);

  // Firebase リアルタイム購読
  useEffect(() => {
    const unsubscribeSessions = onSessionsChange((data) => setSessions(data));
    const fetchMasters = async () => {
      const masters = await getMasterList();
      if (masters && masters.length > 0) setMasterList(masters);
    };
    fetchMasters();
    return () => unsubscribeSessions();
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const rankings: RankingItem[] = useMemo(() => activeSession ? generateRanking(activeSession.participants) : [], [activeSession]);

  const globalMaxSongScore = useMemo(() => {
    if (!activeSession) return 0;
    let max = 0;
    activeSession.participants.forEach(p => {
      [p.scores.song1, p.scores.song2, p.scores.song3].forEach(s => {
        if (typeof s === 'number' && s > max) max = s;
      });
    });
    return max;
  }, [activeSession]);

  // --- Helpers & Actions (ロジック維持) ---
  const getLastHandicap = (name: string): number => {
    const userSessions = sessions
      .filter(s => s.isFinished && s.participants.some(p => p.name === name))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (userSessions.length > 0) {
      const r = generateRanking(userSessions[0].participants);
      return r.find(rank => rank.name === name)?.nextHandicap ?? 0;
    }
    return 0;
  };

  const startNewSession = () => {
    setSetupName(`カラオケ大会 ${new Date().toLocaleDateString('ja-JP')}`);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setSetupDate(now.toISOString().slice(0, 16));
    setSetupLocation(''); setSetupMachine('');
    setSetupParticipants([]);
    navigateTo('SETUP');
  };

  const toggleParticipantInSetup = (name: string) => {
    if (setupParticipants.some(p => p.name === name)) {
      setSetupParticipants(prev => prev.filter(p => p.name !== name));
    } else {
      setSetupParticipants(prev => [...prev, { name, handicap: getLastHandicap(name) }]);
    }
  };

  const updateSetupHandicap = (name: string, handicapStr: string) => {
    const handicap = handicapStr === '' ? 0 : parseFloat(handicapStr);
    setSetupParticipants(prev => prev.map(p => p.name === name ? { ...p, handicap } : p));
  };

  const addNewMaster = () => {
    if (newMasterName && !masterList.includes(newMasterName)) {
      const newList = [...masterList, newMasterName];
      setMasterList(newList);
      saveMasterListToDB(newList);
      setNewMasterName('');
    }
  };

  const createSession = () => {
    if (setupParticipants.length === 0) return;
    const sessionDate = setupDate ? new Date(setupDate).toISOString() : new Date().toISOString();
    const newSession: Session = {
      id: uuidv4(), date: sessionDate, name: setupName, location: setupLocation, machineType: setupMachine,
      participants: setupParticipants.map(p => ({
        id: uuidv4(), name: p.name, handicap: p.handicap, scores: { song1: '', song2: '', song3: '' }
      })),
      isFinished: false
    };
    saveSession(newSession);
    navigateTo('ACTIVE', newSession.id);
  };

  const updateScore = (participantId: string, scores: ScoreData) => {
    if (!activeSession) return;
    saveSession({
      ...activeSession,
      participants: activeSession.participants.map(p => p.id === participantId ? { ...p, scores } : p)
    });
  };

  const openScoreModal = (participantId: string) => {
    setSelectedParticipantId(participantId);
    setScoreModalOpen(true);
    window.history.pushState({ modal: 'score' }, '');
  };

  const finishSession = () => {
    if (!activeSession) return;
    saveSession({ ...activeSession, isFinished: true });
    navigateTo('DETAILS', activeSession.id);
  };

  const executeDelete = () => {
    if (deleteTargetId) {
      setSessions(prev => prev.map(s => s.id === deleteTargetId ? { ...s, isDeleted: true } : s));
      setDeleteTargetId(null);
    }
  };

  const executeHardDelete = () => {
    if (hardDeleteTargetId) {
      setSessions(prev => prev.filter(s => s.id !== hardDeleteTargetId));
      setHardDeleteTargetId(null);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === COMMON_PASSWORD) setIsAuthorized(true);
    else { setPassError(true); setPasswordInput(''); }
  };

  // --- Views ---

  const renderHistory = () => {
    const activeSessions = sessions.filter(s => !s.isDeleted);
    return (
      <div className="space-y-6 pb-20 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">履歴一覧</h1>
          <button onClick={() => navigateTo('DELETED_HISTORY')} className="text-xs text-slate-400 flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700"><IconTrash /> ゴミ箱</button>
        </div>
        <div className="space-y-3">
          {activeSessions.map(session => (
            <Card key={session.id} onClick={() => navigateTo(session.isFinished ? 'DETAILS' : 'ACTIVE', session.id)} className="relative group pr-12">
              <h3 className="font-bold text-lg text-white">{session.name}</h3>
              <div className="text-sm text-slate-400 mt-1 flex items-center gap-3">
                <span>{formatDate(session.date)}</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>{session.participants.length}人</span>
              </div>
              {session.isFinished && <div className="absolute top-4 right-14"><span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded border border-indigo-500/20">完了</span></div>}
              <button onClick={(e) => { e.stopPropagation(); setDeleteTargetId(session.id); }} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 bg-slate-800 rounded-full border border-slate-700 shadow-sm"><IconTrash /></button>
            </Card>
          ))}
        </div>
        <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto"><Button fullWidth onClick={startNewSession} className="shadow-2xl shadow-indigo-500/30">+ 新規大会を作成</Button></div>
      </div>
    );
  };

  const renderActive = (readonly: boolean = false) => {
    if (!activeSession) return null;
    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400 hover:text-white"><IconChevronLeft /></button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white leading-tight truncate">{activeSession.name}</h2>
            <div className="flex flex-wrap gap-x-3 text-xs text-slate-400 mt-1">
              <span>{formatDate(activeSession.date)}</span>
              {activeSession.location && <span className="flex items-center gap-1"><IconMapPin />{activeSession.location}</span>}
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {rankings.map((r, index) => {
            const isTop = index === 0;
            const medalColor = isTop ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-slate-500';
            return (
              <Card key={r.id} className={`relative overflow-hidden ${isTop ? 'border-yellow-500/30 bg-yellow-500/5' : ''}`} onClick={() => openScoreModal(r.id)}>
                <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 w-full">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500" style={{ width: `${(r.gamesPlayed / 3) * 100}%` }} />
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`flex flex-col items-center justify-center w-8 ${medalColor}`}>{isTop ? <IconTrophy /> : <span className="text-2xl font-black font-mono">{r.rank}</span>}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white truncate text-lg mr-2">{r.name}</h3>
                      <div className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">Hdcp: +{r.handicap}</div>
                    </div>
                    
                    {/* ★重要：ジャケ写＋点数表示（省略なし） */}
                    <div className="flex flex-col gap-2 mt-2">
                      {(['song1', 'song2', 'song3'] as const).map((key, i) => {
                        const score = r.scores[key];
                        const title = r.scores[`${key}Title` as keyof ScoreData];
                        const artworkUrl = r.scores[`${key}Artwork` as keyof ScoreData]; // iTunesのURLを取得
                        const evidenceUrl = r.scores[`${key}Image` as keyof ScoreData]; // Firebaseの写真を撮る

                        return (
                          <div key={i} className="flex items-center gap-2">
                            {/* ジャケット写真表示エリア */}
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
                                  <button onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(evidenceUrl as string); window.history.pushState({preview: true}, ''); }} className="text-indigo-400 hover:text-indigo-200 transition-colors">
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
                  <div className="text-right pl-2">
                    <div className="text-[10px] text-slate-500 mb-1">素点Avg <span className="text-sm font-bold text-slate-300 font-mono">{r.average.toFixed(3)}</span></div>
                    <div className="text-2xl font-black text-white tracking-tighter">{r.finalScore.toFixed(3)}</div>
                    {activeSession.isFinished && <div className="mt-1 text-[10px] text-pink-400 font-medium bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20">次回H: +{r.nextHandicap}</div>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        {!readonly && <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto"><Button fullWidth onClick={finishSession} variant="primary">大会を終了して結果を確定</Button></div>}
      </div>
    );
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-dark flex items-center justify-center p-6">
        <Card className="w-full space-y-6 text-center">
          <h2 className="text-2xl font-bold text-white">カラオケランキング</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white text-center text-3xl tracking-widest rounded-lg py-4 focus:border-indigo-500 outline-none" placeholder="****" autoFocus />
            {passError && <p className="text-red-400 text-xs">パスワードが違います</p>}
            <Button fullWidth type="submit">ログイン</Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-dark p-6 font-sans">
      {view === 'HISTORY' && renderHistory()}
      {view === 'SETUP' && (
        <div className="space-y-6 pb-20 animate-fade-in">
          <div className="flex items-center gap-2 mb-4"><button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400 hover:text-white"><IconChevronLeft /></button><h2 className="text-xl font-bold text-white">新規セットアップ</h2></div>
          <Card className="space-y-4">
            <Input label="大会名" value={setupName} onChange={(e) => setSetupName(e.target.value)} />
            <Input label="日時" type="datetime-local" value={setupDate} onChange={(e) => setSetupDate(e.target.value)} />
            <Input label="場所" value={setupLocation} onChange={(e) => setSetupLocation(e.target.value)} placeholder="カラオケ館など" />
          </Card>
          <div className="space-y-4 mt-6">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">参加メンバー</h3>
             <div className="grid grid-cols-2 gap-2">
               {masterList.map(name => (
                 <button key={name} onClick={() => toggleParticipantInSetup(name)} className={`px-3 py-2 rounded-lg text-sm transition-all text-left ${setupParticipants.some(p => p.name === name) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                   {setupParticipants.some(p => p.name === name) ? '✓ ' : '+ '}{name}
                 </button>
               ))}
             </div>
          </div>
          <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto"><Button fullWidth onClick={createSession}>大会を開始する</Button></div>
        </div>
      )}
      {view === 'ACTIVE' && renderActive(false)}
      {view === 'DETAILS' && renderActive(true)}
      {view === 'DELETED_HISTORY' && (
        <div className="space-y-6 pb-20 animate-fade-in">
          <div className="flex items-center gap-2 mb-4"><button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400 hover:text-white"><IconChevronLeft /></button><h2 className="text-xl font-bold text-white">ゴミ箱</h2></div>
          {sessions.filter(s => s.isDeleted).map(s => (
            <Card key={s.id} className="opacity-60 flex justify-between items-center">
              <div><h3 className="font-bold text-white line-through">{s.name}</h3><p className="text-xs text-slate-500">{formatDate(s.date)}</p></div>
              <button onClick={() => { setSessions(prev => prev.map(item => item.id === s.id ? {...item, isDeleted: false} : item)); }} className="text-indigo-400 text-xs">復元</button>
            </Card>
          ))}
        </div>
      )}

      <ScoreModal isOpen={scoreModalOpen} participant={activeSession ? activeSession.participants.find(p => p.id === selectedParticipantId) || null : null} onClose={() => window.history.back()} onSave={updateScore} />
      
      {previewImageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4" onClick={() => window.history.back()}>
          <img src={previewImageUrl} alt="Evidence" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <ConfirmModal isOpen={!!deleteTargetId} title="履歴の削除" message="ゴミ箱に移動しますか？" onConfirm={executeDelete} onCancel={() => setDeleteTargetId(null)} />
    </div>
  );
}