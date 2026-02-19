import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Session, ViewState, Participant, ScoreData, RankingItem } from './types';
import { calculateStats, generateRanking, formatDate } from './utils/calculations';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Card } from './components/Card';
import { ScoreModal } from './components/ScoreModal';
import { ConfirmModal } from './components/ConfirmModal';
import { onSessionsChange, saveSession, deleteSession as deleteSessionFromDB, getMasterList, saveMasterList as saveMasterListToDB } from './services/firebaseService';
import { seedDatabase } from './services/seed';

// --- Icons (SVG) ---
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

const LOCAL_STORAGE_KEY = 'karaoke_app_data_v1';
const MASTER_STORAGE_KEY = 'karaoke_app_master_v1';

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [masterList, setMasterList] = useState<string[]>();
  const [view, setView] = useState<ViewState>('HISTORY');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Setup State
  const [setupName, setSetupName] = useState('');
  const [setupDate, setSetupDate] = useState('');
  const [setupLocation, setSetupLocation] = useState('');
  const [setupMachine, setSetupMachine] = useState('');
  
  const [setupParticipants, setSetupParticipants] = useState<{ name: string; handicap: number }[]>([]);
  const [newMasterName, setNewMasterName] = useState('');

  // Active/Details State
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passError, setPassError] = useState(false);

  const COMMON_PASSWORD = "4646"; // ★ここに好きな4桁の番号を設定してください

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Firebaseからデータをリアルタイムに読み込む
  useEffect(() => {
    // 大会データの購読
    const unsubscribeSessions = onSessionsChange((data) => {
      setSessions(data);
    });

    // 参加者マスターの読み込み
    const fetchMasters = async () => {
      const masters = await getMasterList();
      if (masters && masters.length > 0) {
        setMasterList(masters);
      }
    };
    fetchMasters();

    // クリーンアップ関数（画面を閉じるときに接続を切る）
    return () => {
      unsubscribeSessions();
    };
  }, []);

  // Derived state
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const rankings: RankingItem[] = activeSession ? generateRanking(activeSession.participants) : [];

  // Calculate global max song score for highlighting
  const globalMaxSongScore = React.useMemo(() => {
    if (!activeSession) return 0;
    let max = 0;
    activeSession.participants.forEach(p => {
      [p.scores.song1, p.scores.song2, p.scores.song3].forEach(s => {
        if (typeof s === 'number' && s > max) max = s;
      });
    });
    return max;
  }, [activeSession]);

  // --- Helpers ---
  const getLastHandicap = (name: string): number => {
    // Find the latest finished session where this user participated
    const userSessions = sessions
      .filter(s => s.isFinished && s.participants.some(p => p.name === name))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (userSessions.length > 0) {
      const lastSession = userSessions[0];
      const rankings = generateRanking(lastSession.participants);
      const userRank = rankings.find(r => r.name === name);
      return userRank?.nextHandicap ?? 0;
    }
    return 0;
  };

  // --- Actions ---

  const startNewSession = () => {
    setSetupName(`カラオケ大会 ${new Date().toLocaleDateString('ja-JP')}`);
    
    // Default to current time for datetime-local (requires yyyy-MM-ddThh:mm)
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setSetupDate(now.toISOString().slice(0, 16));
    
    setSetupLocation('');
    setSetupMachine('');
    setSetupParticipants([]);
    setView('SETUP');
  };

  const toggleParticipantInSetup = (name: string) => {
    if (setupParticipants.some(p => p.name === name)) {
      setSetupParticipants(prev => prev.filter(p => p.name !== name));
    } else {
      // Auto-set handicap to the last calculated nextHandicap
      const initialHandicap = getLastHandicap(name);
      setSetupParticipants(prev => [...prev, { name, handicap: initialHandicap }]);
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
    
    // Parse the local datetime string to ISO
    const sessionDate = setupDate ? new Date(setupDate).toISOString() : new Date().toISOString();

    const newSession: Session = {
      id: uuidv4(),
      date: sessionDate,
      name: setupName,
      location: setupLocation,
      machineType: setupMachine,
      participants: setupParticipants.map(p => ({
        id: uuidv4(),
        name: p.name,
        handicap: p.handicap,
        scores: { song1: '', song2: '', song3: '' }
      })),
      isFinished: false
    };
    saveSession(newSession);
    setActiveSessionId(newSession.id);
    setView('ACTIVE');
  };

  const updateScore = (participantId: string, scores: ScoreData) => {
    if (!activeSession) return;
    const updatedSession = {
      ...activeSession,
      participants: activeSession.participants.map(p => 
        p.id === participantId ? { ...p, scores } : p
      )
    };
    saveSession(updatedSession);
  };

  const openScoreModal = (participantId: string) => {
    setSelectedParticipantId(participantId);
    setScoreModalOpen(true);
  };

  const finishSession = () => {
    if (!activeSession) return;
    const updatedSession = { ...activeSession, isFinished: true };
    saveSession(updatedSession);
    setView('DETAILS');
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteTargetId(id);
  };

  const executeDelete = () => {
    if (deleteTargetId) {
      deleteSessionFromDB(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const fillTestData = () => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      return {
        ...s,
        participants: s.participants.map(p => {
          return {
            ...p,
            scores: {
              song1: parseFloat((Math.random() * 20 + 80).toFixed(3)), // 80.000 - 100.000
              song2: parseFloat((Math.random() * 20 + 80).toFixed(3)),
              song3: parseFloat((Math.random() * 20 + 80).toFixed(3)),
            }
          };
        })
      };
    }));
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === COMMON_PASSWORD) {
      setIsAuthorized(true);
      setPassError(false);
    } else {
      setPassError(true);
      setPasswordInput('');
    }
  };

  // --- Views ---

  const renderHistory = () => (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
          履歴一覧
        </h1>
        <div className="text-sm text-slate-400">{sessions.length} 件</div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="mb-4 inline-block p-4 bg-slate-800 rounded-full">
            <IconMic />
          </div>
          <p>まだ履歴がありません</p>
          <p className="text-sm mt-2">「新規作成」から始めましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <Card 
              key={session.id} 
              onClick={() => {
                setActiveSessionId(session.id);
                setView(session.isFinished ? 'DETAILS' : 'ACTIVE');
              }}
              className="relative group pr-12"
            >
              <div className="flex flex-col gap-1">
                 <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white">{session.name}</h3>
                 </div>
                 
                 <div className="flex flex-col gap-1 mt-1 text-sm text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>{formatDate(session.date)}</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                      <span>{session.participants.length}人</span>
                    </div>
                    {session.location && (
                       <div className="flex items-center gap-1 text-xs text-slate-500">
                          <IconMapPin />
                          <span>{session.location}</span>
                       </div>
                    )}
                 </div>

                 {session.isFinished && (
                   <div className="absolute top-4 right-14">
                      <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded font-medium border border-indigo-500/20">
                        完了
                      </span>
                   </div>
                 )}
              </div>

              <button 
                type="button"
                onClick={(e) => deleteSession(e, session.id)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 bg-slate-800 rounded-full transition-colors z-20 border border-slate-700 shadow-sm"
                aria-label="削除"
              >
                <div className="pointer-events-none">
                  <IconTrash />
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}

      <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto">
        <Button fullWidth onClick={startNewSession} className="shadow-2xl shadow-indigo-500/30">
          + 新規大会を作成
        </Button>
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setView('HISTORY')} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <IconChevronLeft />
        </button>
        <h2 className="text-xl font-bold text-white">新規セットアップ</h2>
      </div>

      <Card className="space-y-4">
        <Input 
          label="大会名"
          value={setupName}
          onChange={(e) => setSetupName(e.target.value)}
          placeholder="例: 〇〇忘年会"
        />
        <Input 
          label="日時"
          type="datetime-local"
          value={setupDate}
          onChange={(e) => setSetupDate(e.target.value)}
        />
        <Input 
          label="場所"
          value={setupLocation}
          onChange={(e) => setSetupLocation(e.target.value)}
          placeholder="例: カラオケ館 新宿店"
        />
        <Input 
          label="カラオケ機種"
          value={setupMachine}
          onChange={(e) => setSetupMachine(e.target.value)}
          placeholder="例: JOYSOUND X1, DAM Ai"
        />
      </Card>

      <div className="space-y-2">
        <div className="flex justify-between items-end mb-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">参加メンバー選択</h3>
        </div>
        
        {/* Master List Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {masterList.map(name => {
            const isSelected = setupParticipants.some(p => p.name === name);
            return (
              <button
                key={name}
                onClick={() => toggleParticipantInSetup(name)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                  isSelected 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}{name}
              </button>
            );
          })}
        </div>
        
        {/* Add New Master */}
        <div className="flex gap-2 mb-6">
          <Input 
            placeholder="新しいメンバー名" 
            value={newMasterName}
            onChange={(e) => setNewMasterName(e.target.value)}
            className="text-sm py-2"
          />
          <Button variant="secondary" onClick={addNewMaster} disabled={!newMasterName} className="py-2">
            追加
          </Button>
        </div>

        {/* Selected Participants List with Handicap Input */}
        {setupParticipants.length > 0 && (
          <div className="space-y-3">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1 mt-6">
               ハンデ設定 ({setupParticipants.length}名)
             </h3>
             <div className="space-y-2">
              {setupParticipants.map((p, idx) => {
                const recentHandicap = getLastHandicap(p.name);
                return (
                <div key={idx} className="flex items-center gap-3 bg-surface px-4 py-3 rounded-xl border border-slate-700/50">
                  <span className="font-bold text-white flex-1">{p.name}</span>
                  
                  {/* Recent Handicap Label */}
                  <div className="flex flex-col items-end mr-2 px-2 py-1 bg-slate-800 rounded border border-slate-700">
                     <span className="text-[9px] text-slate-400 leading-none mb-0.5">前回</span>
                     <span className="text-xs font-mono text-pink-300 font-bold leading-none">+{recentHandicap}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">今回H</span>
                    <input 
                      type="number"
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white focus:border-indigo-500 outline-none"
                      placeholder="0"
                      value={p.handicap}
                      onChange={(e) => updateSetupHandicap(p.name, e.target.value)}
                    />
                  </div>
                </div>
              );})}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto">
        <Button 
          fullWidth 
          onClick={createSession}
          disabled={setupParticipants.length === 0 || !setupName}
        >
          大会を開始する
        </Button>
      </div>
    </div>
  );

  const renderActive = (readonly: boolean = false) => {
    if (!activeSession) return null;

    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        <div className="flex items-center gap-2">
          <button onClick={() => setView('HISTORY')} className="p-2 -ml-2 text-slate-400 hover:text-white">
            <IconChevronLeft />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white leading-tight">{activeSession.name}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
               <span className="text-xs text-slate-400">
                 {formatDate(activeSession.date)}
               </span>
               {activeSession.location && (
                 <span className="text-xs text-slate-400 flex items-center gap-1">
                   <IconMapPin />
                   {activeSession.location}
                 </span>
               )}
               {activeSession.machineType && (
                 <span className="text-xs text-slate-400 flex items-center gap-1">
                   <IconMusicNote />
                   {activeSession.machineType}
                 </span>
               )}
            </div>
          </div>
        </div>
        
        {/* Handicap Rule Label (Only in Results View) */}
        {readonly && (
          <div className="text-right text-[10px] text-slate-400 px-2 -mb-1">
            ※次回ハンデ＝最高得点ー自分の得点 または 最大15
          </div>
        )}

        <div className="space-y-3">
          {rankings.map((r, index) => {
            const isTop = index === 0;
            const medalColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-slate-500';
            
            return (
              <Card 
                key={r.id} 
                className={`relative overflow-hidden transition-all ${isTop ? 'border-yellow-500/30 bg-yellow-500/5' : ''}`}
                // ENABLE EDITING: Always allow click to edit score, even if finished
                onClick={() => openScoreModal(r.id)}
              >
                {/* Progress bar background for songs played */}
                <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 w-full">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500" 
                    style={{ width: `${(r.gamesPlayed / 3) * 100}%` }}
                  />
                </div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className={`flex flex-col items-center justify-center w-8 ${medalColor}`}>
                    {isTop ? <IconTrophy /> : <span className="text-2xl font-black font-mono">{r.rank}</span>}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white truncate text-lg mr-2">{r.name}</h3>
                      <div className="text-xs text-slate-400 font-mono whitespace-nowrap bg-slate-800 px-2 py-0.5 rounded">
                        Hdcp: +{r.handicap}
                      </div>
                    </div>
                    
                    {/* Song Scores */}
                    <div className="flex gap-2 text-sm text-slate-500 font-mono">
                      {[r.scores.song1, r.scores.song2, r.scores.song3].map((s, i) => {
                        // Highlight if this song is the global max
                        const isMax = typeof s === 'number' && s > 0 && s === globalMaxSongScore;
                        return (
                          <div 
                            key={i} 
                            className={`flex-1 text-center py-1 rounded relative ${
                              s ? (isMax ? 'bg-red-500/20 text-red-400 font-black border border-red-500/50' : 'bg-slate-800 text-indigo-300') : 'bg-slate-800/30 text-slate-600'
                            }`}
                          >
                            {s || '-'}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="text-right pl-2 flex flex-col items-end">
                     {/* Pre-handicap Score (Average) */}
                     <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] text-slate-500">素点Avg</span>
                        <span className="text-sm font-bold text-slate-300 font-mono">{r.average.toFixed(3)}</span>
                     </div>
                     
                     {/* Final Score */}
                    <div className="text-2xl font-black text-white tracking-tighter leading-none">
                      {r.finalScore.toFixed(3)}
                    </div>

                    {/* Next Handicap (Only when finished) */}
                    {activeSession.isFinished && (
                      <div className="mt-1 text-[10px] text-pink-400 font-medium bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20">
                        次回H: +{r.nextHandicap}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        
        {!readonly && (
          <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto space-y-3">
             {/* Test Data Button */}
             <Button fullWidth onClick={fillTestData} variant="secondary" className="opacity-80">
              ⚡ テストデータ入力
            </Button>

            <Button fullWidth onClick={finishSession} variant="primary">
              大会を終了して結果を確定
            </Button>
          </div>
        )}
      </div>
    );
  };

  // 認証されていない場合に表示する画面
  if (!isAuthorized) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-dark flex items-center justify-center p-6 font-sans">
        <Card className="w-full space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">カラオケランキング</h2>
            <p className="text-sm text-slate-400">4桁のパスワードを入力してください</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className={`w-full bg-slate-900 border ${passError ? 'border-red-500' : 'border-slate-700'} text-white text-center text-3xl tracking-widest rounded-lg py-4 focus:outline-none focus:border-indigo-500`}
              placeholder="****"
              autoFocus
            />
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
      {view === 'SETUP' && renderSetup()}
      {view === 'ACTIVE' && renderActive(false)}
      {view === 'DETAILS' && renderActive(true)}

      <ScoreModal 
        isOpen={scoreModalOpen}
        participant={activeSession ? activeSession.participants.find(p => p.id === selectedParticipantId) || null : null}
        onClose={() => setScoreModalOpen(false)}
        onSave={updateScore}
      />

      <ConfirmModal 
        isOpen={!!deleteTargetId}
        title="履歴の削除"
        message="この履歴を削除してもよろしいですか？この操作は取り消せません。"
        onConfirm={executeDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}