import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toJpeg } from 'html-to-image';
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

// ▼ タイトル用の追加アイコン
const IconList = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const IconPhoto = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;

// ▼ 共通のカッコいいタイトル部品
const ScreenTitle = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <h1 className="text-xl font-black text-white flex items-center gap-2 tracking-wider">
    <span className="text-pink-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]">
      {icon}
    </span>
    {title}
  </h1>
);

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

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isEditingSession, setIsEditingSession] = useState(false);

  // ▼ 画像保存用の参照
  const captureRef = useRef<HTMLDivElement>(null);

  const COMMON_PASSWORD = "4646";

  const pastLocations = useMemo(() => Array.from(new Set(sessions.map(s => s.location).filter((l): l is string => !!l && l.trim() !== ''))), [sessions]);
  const pastMachines = useMemo(() => Array.from(new Set(['DAM', 'JOYSOUND', ...sessions.map(s => s.machineType).filter((m): m is string => !!m && m.trim() !== '')])), [sessions]);

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

  useEffect(() => {
    const unsubscribe = onSessionsChange((data) => setSessions(data));
    const fetchMasters = async () => { const masters = await getMasterList(); if (masters) setMasterList(masters); };
    fetchMasters();
    return () => unsubscribe();
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const rankings = useMemo(() => activeSession ? generateRanking(activeSession.participants) : [], [activeSession]);

  useEffect(() => setIsEditingSession(false), [activeSessionId]);

  const getLastHandicap = (name: string): number => {
    const userSessions = sessions.filter(s => s.isFinished && s.participants.some(p => p.name === name)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (userSessions.length > 0) return generateRanking(userSessions[0].participants).find(r => r.name === name)?.nextHandicap ?? 0;
    return 0;
  };

  const startNewSession = () => {
    setSetupName(`カラオケ大会 ${new Date().toLocaleDateString('ja-JP')}`);
    const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setSetupDate(now.toISOString().slice(0, 16));
    setSetupLocation(''); setSetupMachine(''); setSetupParticipants([]);
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

  // ▼ 画像として保存する処理
  const handleExportImage = async () => {
    if (!captureRef.current) return;
    try {
      // 画面の見た目そのままを高画質でJPEG化
      const dataUrl = await toJpeg(captureRef.current, {
        quality: 0.95,
        backgroundColor: '#000000',
        pixelRatio: 2, // 高画質出力
        style: { padding: '16px' } // 余白をつける
      });
      const link = document.createElement('a');
      link.download = `karaoke_ranking_${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('画像の作成に失敗しました。');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-dark flex items-center justify-center p-6">
        <Card className="w-full space-y-6 text-center border border-indigo-500/30">
          <ScreenTitle icon={<IconMic />} title="Karaoke Ranker" />
          <form onSubmit={(e) => { e.preventDefault(); if (passwordInput === COMMON_PASSWORD) setIsAuthorized(true); else setPassError(true); }} className="space-y-4 mt-4">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white text-center text-3xl tracking-widest rounded-lg py-4 focus:border-indigo-500 outline-none" placeholder="****" autoFocus />
            {passError && <p className="text-pink-500 text-sm font-bold">パスワードが違います</p>}
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
          <div className="flex items-center justify-between mb-4">
            <ScreenTitle icon={<IconList />} title="履歴一覧" />
            <button onClick={() => navigateTo('DELETED_HISTORY')} className="text-xs text-damgold px-3 py-1.5 rounded-full border border-damgold/50 shadow-[0_2px_0_#000000] bg-slate-900">ゴミ箱</button>
          </div>
          <div className="space-y-3">
            {sessions.filter(s => !s.isDeleted).map(s => (
              <Card key={s.id} onClick={() => navigateTo(s.isFinished ? 'DETAILS' : 'ACTIVE', s.id)} className="relative group pr-12 border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-colors">
                <h3 className="font-bold text-lg text-white truncate">{s.name}</h3>
                <p className="text-sm text-slate-400 mt-1 font-mono">{formatDate(s.date)} • {s.participants.length}人</p>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTargetId(s.id); }} className="absolute top-1/2 -translate-y-1/2 right-4 p-2 text-slate-500 hover:text-pink-500"><IconTrash /></button>
              </Card>
            ))}
          </div>
          <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto"><Button fullWidth onClick={startNewSession}>新規大会を作成</Button></div>
        </div>
      )}

      {/* --- 大会情報（進行中・詳細）画面 --- */}
      {(view === 'ACTIVE' || view === 'DETAILS') && activeSession && (
        <div className="space-y-6 pb-24 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"><IconChevronLeft /></button>
              <ScreenTitle icon={<IconMic />} title="大会情報" />
            </div>

            <button
              onClick={() => setIsEditingSession(!isEditingSession)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isEditingSession ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(0,229,255,0.4)]' : 'bg-slate-900 text-indigo-400 border border-indigo-500/30'}`}
            >
              {isEditingSession ? <><span>✓</span><span>完了</span></> : <><span>✎</span><span>編集</span></>}
            </button>
          </div>

          {/* ▼ この部分（captureRef）が画像化されます ▼ */}
          <div ref={captureRef} className="bg-dark pb-2 -mx-2 px-2 rounded-xl">
            <Card className="space-y-4 border-slate-800">
              {isEditingSession ? (
                <div className="space-y-4 animate-fade-in">
                  <Input label="大会名" value={activeSession.name} onChange={(e) => saveSession({ ...activeSession, name: e.target.value })} />
                  <Input label="日時" type="datetime-local" value={activeSession.date ? new Date(new Date(activeSession.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => { if (e.target.value) { saveSession({ ...activeSession, date: new Date(e.target.value).toISOString() }); } }} />
                  <Input label="場所" list="location-list" value={activeSession.location || ''} onChange={(e) => saveSession({ ...activeSession, location: e.target.value })} placeholder="例: ラウンドワン" />
                  <datalist id="location-list">{pastLocations.map(loc => <option key={loc} value={loc} />)}</datalist>
                  <Input label="機種" list="machine-list" value={activeSession.machineType || ''} onChange={(e) => saveSession({ ...activeSession, machineType: e.target.value })} placeholder="例: DAM" />
                  <datalist id="machine-list">{pastMachines.map(mac => <option key={mac} value={mac} />)}</datalist>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="col-span-2">
                    <div className="text-xs text-indigo-400 font-bold ml-1 mb-1">大会名</div>
                    <div className="text-white font-bold bg-[#1a1a1a] rounded-lg px-4 py-2.5 border border-[#333333]">{activeSession.name}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-indigo-400 font-bold ml-1 mb-1">日時</div>
                    <div className="text-white bg-[#1a1a1a] rounded-lg px-4 py-2.5 border border-[#333333] font-mono">{formatDate(activeSession.date)}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="text-xs text-indigo-400 font-bold ml-1 mb-1">場所</div>
                    <div className="text-white bg-[#1a1a1a] rounded-lg px-4 py-2.5 border border-[#333333] truncate">{activeSession.location || '-'}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="text-xs text-indigo-400 font-bold ml-1 mb-1">機種</div>
                    <div className="text-white bg-[#1a1a1a] rounded-lg px-4 py-2.5 border border-[#333333] truncate">{activeSession.machineType || '-'}</div>
                  </div>
                </div>
              )}
            </Card>

            <div className="space-y-3 mt-6">
              {rankings.map((r, i) => (
                <RankingCard key={r.id} r={r} index={i} isFinished={activeSession.isFinished} onOpenScore={openScoreModal} onOpenPreview={openPreview} />
              ))}
            </div>
          </div>
          {/* ▲ ここまでが画像化の対象範囲 ▲ */}

          {/* ▼ 画像書き出しボタン ▼ */}
          <div className="flex justify-end mt-4 mb-8">
            <button onClick={handleExportImage} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/20 text-indigo-300 rounded-xl text-sm font-bold border border-indigo-500/50 hover:bg-indigo-600/40 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.15)]">
              <IconPhoto /> 画像で保存してシェア
            </button>
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
          <div className="flex items-center gap-1 mb-4">
            <button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400"><IconChevronLeft /></button>
            <ScreenTitle icon={<IconPlus />} title="新規大会の作成" />
          </div>

          <Card className="space-y-4 border-slate-800">
            <Input label="大会名" value={setupName} onChange={(e) => setSetupName(e.target.value)} />
            <Input label="日時" type="datetime-local" value={setupDate} onChange={(e) => setSetupDate(e.target.value)} />
            <Input label="場所" value={setupLocation} onChange={(e) => setSetupLocation(e.target.value)} list="location-list" placeholder="例: ラウンドワン" />
            <datalist id="location-list">{pastLocations.map(loc => <option key={loc} value={loc} />)}</datalist>
            <Input label="機種" value={setupMachine} onChange={(e) => setSetupMachine(e.target.value)} list="machine-list" placeholder="例: DAM" />
            <datalist id="machine-list">{pastMachines.map(mac => <option key={mac} value={mac} />)}</datalist>
          </Card>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {masterList.map(name => (
              <button key={name} onClick={() => {
                if (setupParticipants.some(p => p.name === name)) setSetupParticipants(setupParticipants.filter(p => p.name !== name));
                else setSetupParticipants([...setupParticipants, { name, handicap: getLastHandicap(name) }]);
              }} className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border ${setupParticipants.some(p => p.name === name) ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_10px_rgba(0,229,255,0.2)]' : 'bg-[#1a1a1a] text-slate-400 border-[#333333]'}`}>{name}</button>
            ))}
          </div>

          {setupParticipants.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold text-indigo-400 ml-1">参加者とハンデキャップ</h3>
              <div className="space-y-2">
                {setupParticipants.map((p) => (
                  <div key={p.name} className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl border border-[#333333]">
                    <span className="font-bold text-white text-lg">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">Hdcp: +</span>
                      <input
                        type="number" step="1" value={p.handicap}
                        onChange={(e) => {
                          const newHandicap = parseFloat(e.target.value) || 0;
                          setSetupParticipants(prev => prev.map(sp => sp.name === p.name ? { ...sp, handicap: newHandicap } : sp));
                        }}
                        className="w-20 bg-dark border border-[#333333] text-white rounded-lg px-3 py-2 text-right focus:border-indigo-500 outline-none font-mono text-lg font-bold"
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
          <div className="flex items-center gap-1 mb-4">
            <button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-400"><IconChevronLeft /></button>
            <ScreenTitle icon={<IconTrash />} title="ゴミ箱" />
          </div>
          {sessions.filter(s => s.isDeleted).map(s => (
            <Card key={s.id} className="opacity-70 flex justify-between items-center border-[#333333]">
              <div><h3 className="font-bold text-slate-400 line-through">{s.name}</h3><p className="text-xs text-slate-500 font-mono">{formatDate(s.date)}</p></div>
              <button onClick={() => saveSession({ ...s, isDeleted: false })} className="text-damgold font-bold px-3 py-1.5 rounded bg-slate-900 border border-damgold/30 text-sm"><IconRestore /> 復元</button>
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