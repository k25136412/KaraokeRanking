import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Session, ViewState, ScoreData, RankingItem } from './types';
import { generateRanking, formatDate } from './utils/calculations';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Card } from './components/Card';
import { ScoreModal } from './components/ScoreModal';
import { ConfirmModal } from './components/ConfirmModal';
import { onSessionsChange, saveSession, getMasterList, saveMasterList as saveMasterListToDB } from './services/firebaseService';
import { IconMic, IconChevronLeft, IconTrash, IconMapPin, IconRestore } from './components/Icons';
import { RankingCard } from './components/RankingCard';

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [masterList, setMasterList] = useState<string[]>([]);
  const [view, setView] = useState<ViewState>('HISTORY');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const [setupName, setSetupName] = useState('');
  const [setupDate, setSetupDate] = useState('');
  const [setupLocation, setSetupLocation] = useState('');
  const [setupMachine, setSetupMachine] = useState('');
  const [setupParticipants, setSetupParticipants] = useState<{ name: string; handicap: number }[]>([]);
  const [newMasterName, setNewMasterName] = useState('');

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const COMMON_PASSWORD = "4646";

  const pastLocations = useMemo(() => {
    // 過去の大会データから場所だけを取り出し、空欄のものを除外
    const locs = sessions.map(s => s.location).filter((l): l is string => !!l && l.trim() !== '');
    // 重複をなくす
    return Array.from(new Set(locs));
  }, [sessions]);

  const pastMachines = useMemo(() => {
    // 過去の大会データから機種だけを取り出し、空欄のものを除外
    const machines = sessions.map(s => s.machineType).filter((m): m is string => !!m && m.trim() !== '');
    // デフォルトの 'DAM' と 'JOYSOUND' を先頭に入れつつ、重複をなくす
    return Array.from(new Set(['DAM', 'JOYSOUND', ...machines]));
  }, [sessions]);

  // --- ナビゲーション管理 ---
  const navigateTo = useCallback((nextView: ViewState, id: string | null = null) => {
    setView(nextView);
    if (id !== undefined) setActiveSessionId(id);
    window.history.pushState({ view: nextView, sessionId: id }, '');
  }, []);

  useEffect(() => {
    if (!window.history.state) window.history.replaceState({ view: 'HISTORY', sessionId: null }, '');
    const handlePopState = (event: PopStateEvent) => {
      if (previewImageUrl) { setPreviewImageUrl(null); return; }
      if (scoreModalOpen) { setScoreModalOpen(false); return; }
      const state = event.state;
      if (state && state.view) { setView(state.view); setActiveSessionId(state.sessionId || null); }
      else { setView('HISTORY'); setActiveSessionId(null); }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [previewImageUrl, scoreModalOpen]);

  // Firebase接続
  useEffect(() => {
    const unsubscribe = onSessionsChange((data) => setSessions(data));
    const fetchMasters = async () => {
      const masters = await getMasterList();
      if (masters) setMasterList(masters);
    };
    fetchMasters();
    return () => unsubscribe();
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const rankings = useMemo(() => activeSession ? generateRanking(activeSession.participants) : [], [activeSession]);

  const getLastHandicap = (name: string): number => {
    const userSessions = sessions.filter(s => s.isFinished && s.participants.some(p => p.name === name))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (userSessions.length > 0) return generateRanking(userSessions[0].participants).find(r => r.name === name)?.nextHandicap ?? 0;
    return 0;
  };

  const startNewSession = () => {
    setSetupName(`カラオケ大会 ${new Date().toLocaleDateString('ja-JP')}`);
    const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setSetupDate(now.toISOString().slice(0, 16));
    setSetupLocation('');
    setSetupMachine('');
    setSetupParticipants([]);
    navigateTo('SETUP');
  };

  const createSession = () => {
    if (setupParticipants.length === 0) return;
    const newSession: Session = {
      id: uuidv4(), date: setupDate ? new Date(setupDate).toISOString() : new Date().toISOString(),
      name: setupName, location: setupLocation, machineType: setupMachine,
      participants: setupParticipants.map(p => ({ id: uuidv4(), name: p.name, handicap: p.handicap, scores: { song1: '', song2: '', song3: '' } })),
      isFinished: false
    };
    saveSession(newSession);
    navigateTo('ACTIVE', newSession.id);
  };

  const openScoreModal = (id: string) => { setSelectedParticipantId(id); setScoreModalOpen(true); window.history.pushState({ modal: true }, ''); };
  const openPreview = (url: string) => { setPreviewImageUrl(url); window.history.pushState({ preview: true }, ''); };

  // --- Views ---
  if (!isAuthorized) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-dark flex items-center justify-center p-6">
        <Card className="w-full space-y-6 text-center">
          <h2 className="text-2xl font-bold text-white">カラオケランキング</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (passwordInput === COMMON_PASSWORD) setIsAuthorized(true); else setPassError(true); }} className="space-y-4">
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
      
      {/* --- 履歴一覧画面 --- */}
      {view === 'HISTORY' && (
        <div className="space-y-6 pb-20 animate-fade-in">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">履歴一覧</h1>
            <button onClick={() => navigateTo('DELETED_HISTORY')} className="text-xs text-slate-400 px-3 py-1.5 rounded-full border border-slate-700">ゴミ箱</button>
          </div>
          <div className="space-y-3">
            {sessions.filter(s => !s.isDeleted).map(s => (
              <Card key={s.id} onClick={() => navigateTo(s.isFinished ? 'DETAILS' : 'ACTIVE', s.id)} className="relative group pr-12">
                <h3 className="font-bold text-lg text-white">{s.name}</h3>
                <p className="text-sm text-slate-400">{formatDate(s.date)} • {s.participants.length}人</p>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTargetId(s.id); }} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400"><IconTrash /></button>
              </Card>
            ))}
          </div>
          <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto"><Button fullWidth onClick={startNewSession}>+ 新規大会を作成</Button></div>
        </div>
      )}

      {/* --- 大会情報（進行中・詳細）画面 --- */}
      {(view === 'ACTIVE' || view === 'DETAILS') && activeSession && (
        <div className="space-y-6 pb-24 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400"><IconChevronLeft /></button>
            <h2 className="text-lg font-bold text-white truncate">大会情報</h2>
          </div>
          
          <Card className="space-y-4">
            <Input 
              label="大会名" 
              value={activeSession.name} 
              onChange={(e) => saveSession({ ...activeSession, name: e.target.value })} 
            />
            <Input 
              label="日時" 
              type="datetime-local" 
              value={activeSession.date ? new Date(new Date(activeSession.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
              onChange={(e) => {
                if (e.target.value) {
                  saveSession({ ...activeSession, date: new Date(e.target.value).toISOString() });
                }
              }} 
            />
            <Input 
              label="場所" 
              list="location-list" 
              value={activeSession.location || ''} 
              onChange={(e) => saveSession({ ...activeSession, location: e.target.value })} 
              placeholder="例: ラウンドワン" 
            />
            <datalist id="location-list">{pastLocations.map(loc => <option key={loc} value={loc} />)}</datalist>

            <Input 
              label="機種" 
              list="machine-list" 
              value={activeSession.machineType || ''} 
              onChange={(e) => saveSession({ ...activeSession, machineType: e.target.value })} 
              placeholder="例: DAM" 
            />
            <datalist id="machine-list">{pastMachines.map(mac => <option key={mac} value={mac} />)}</datalist>
          </Card>

          <div className="space-y-3 mt-6">
            {rankings.map((r, i) => (
              <RankingCard key={r.id} r={r} index={i} isFinished={activeSession.isFinished} onOpenScore={openScoreModal} onOpenPreview={openPreview} />
            ))}
          </div>

          {view === 'ACTIVE' && (
            <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto">
              <Button fullWidth onClick={() => { saveSession({ ...activeSession, isFinished: true }); navigateTo('HISTORY'); }}>大会を終了する</Button>
            </div>
          )}
        </div>
      )}

      {/* --- 新規大会作成（SETUP）画面 --- */}
      {view === 'SETUP' && (
        <div className="space-y-6 pb-24 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400"><IconChevronLeft /></button>
            <h2 className="text-xl font-bold text-white">新規大会の作成</h2>
          </div>

          <Card className="space-y-4">
            <Input label="大会名" value={setupName} onChange={(e) => setSetupName(e.target.value)} />
            <Input label="日時" type="datetime-local" value={setupDate} onChange={(e) => setSetupDate(e.target.value)} />
            <Input label="場所" value={setupLocation} onChange={(e) => setSetupLocation(e.target.value)} list="location-list" placeholder="例: ラウンドワン" />
            <datalist id="location-list">{pastLocations.map(loc => <option key={loc} value={loc} />)}</datalist>
            <Input label="機種" value={setupMachine} onChange={(e) => setSetupMachine(e.target.value)} list="machine-list" placeholder="例: DAM" />
            <datalist id="machine-list">{pastMachines.map(mac => <option key={mac} value={mac} />)}</datalist>
          </Card>

          <div className="grid grid-cols-2 gap-2 mt-6">
            {masterList.map(name => (
              <button key={name} onClick={() => {
                if (setupParticipants.some(p => p.name === name)) setSetupParticipants(setupParticipants.filter(p => p.name !== name));
                else setSetupParticipants([...setupParticipants, { name, handicap: getLastHandicap(name) }]);
              }} className={`px-3 py-2 rounded-lg text-sm ${setupParticipants.some(p => p.name === name) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{name}</button>
            ))}
          </div>

          {setupParticipants.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-400">参加者とハンデキャップ</h3>
              <div className="space-y-2">
                {setupParticipants.map((p) => (
                  <div key={p.name} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <span className="font-bold text-white">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Hdcp: +</span>
                      <input
                        type="number" step="1" value={p.handicap}
                        onChange={(e) => {
                          const newHandicap = parseFloat(e.target.value) || 0;
                          setSetupParticipants(prev => prev.map(sp => sp.name === p.name ? { ...sp, handicap: newHandicap } : sp));
                        }}
                        className="w-20 bg-slate-900 border border-slate-600 text-white rounded px-2 py-1 text-right focus:border-indigo-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto"><Button fullWidth onClick={createSession}>大会を開始</Button></div>
        </div>
      )}

      {/* --- ゴミ箱（削除済み履歴）画面 --- */}
      {view === 'DELETED_HISTORY' && (
        <div className="space-y-6 pb-20 animate-fade-in">
          <div className="flex items-center gap-2 mb-4"><button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400"><IconChevronLeft /></button><h2 className="text-xl font-bold text-white">ゴミ箱</h2></div>
          {sessions.filter(s => s.isDeleted).map(s => (
            <Card key={s.id} className="opacity-60 flex justify-between items-center">
              <div><h3 className="font-bold text-white line-through">{s.name}</h3><p className="text-xs text-slate-500">{formatDate(s.date)}</p></div>
              <button onClick={() => saveSession({ ...s, isDeleted: false })} className="text-indigo-400 text-xs">復元</button>
            </Card>
          ))}
        </div>
      )}

      {/* --- モーダル（ポップアップ）群 --- */}
      <ScoreModal isOpen={scoreModalOpen} participant={activeSession ? activeSession.participants.find(p => p.id === selectedParticipantId) || null : null} onClose={() => window.history.back()} onSave={(id, scores) => {
        if (activeSession) saveSession({ ...activeSession, participants: activeSession.participants.map(p => p.id === id ? { ...p, scores } : p) });
      }} />

      {previewImageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4" onClick={() => window.history.back()}>
          <img src={previewImageUrl} alt="Evidence" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <ConfirmModal isOpen={!!deleteTargetId} title="履歴の削除" message="ゴミ箱に移動しますか？" onConfirm={() => { if (deleteTargetId) saveSession({ ...sessions.find(s => s.id === deleteTargetId)!, isDeleted: true }); setDeleteTargetId(null); }} onCancel={() => setDeleteTargetId(null)} />
    </div>
  );
}