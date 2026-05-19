import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, Settings, Loader2 } from 'lucide-react';
import { getLocalDate } from './lib/utils';
import { QR } from './components/QR';
import { SummaryCard } from './components/SummaryCard';
import { DailyMemo } from './components/DailyMemo';
import { SettingsPanel } from './components/SettingsPanel';
import { RegistrationForm } from './components/RegistrationForm';
import { RecordCard } from './components/RecordCard';
import { DeleteModal } from './components/Modals/DeleteModal';
import { EditModal } from './components/Modals/EditModal';
import { QRModal } from './components/Modals/QRModal';
import { AuthModal } from './components/Auth/AuthModal';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  increment
} from 'firebase/firestore';

const DEFAULT_LABELS = ['開梱', '撮影', '札付け', 'パケ入れ', '付属確認', 'X線', '検品', 'その他'];

export default function App() {
  // --- Auth State ---
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- App State ---
  const [labels, setLabels] = useState(DEFAULT_LABELS);
  const [hoursGoal, setHoursGoal] = useState(8);
  const [records, setRecords] = useState([]);
  const [memo, setMemo] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const [date, setDate] = useState(getLocalDate());
  const [label, setLabel] = useState(labels[0]);
  const [subLabel, setSubLabel] = useState('');
  const [countInput, setCountInput] = useState('0');
  const [prevCalcValue, setPrevCalcValue] = useState(null);
  const [calcOperator, setCalcOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [hours, setHours] = useState(1.0);
  const [isManualHours, setIsManualHours] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Modal States
  const [qrRecord, setQrRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const count = parseInt(countInput) || 0;
  const today = getLocalDate();

  // --- Auth & Data Lifecycle ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setLabels(DEFAULT_LABELS);
      return;
    }

    // Check if user needs email verification (password provider)
    const isPasswordUser = user.providerData.some(p => p.providerId === 'password');
    if (isPasswordUser && !user.emailVerified) {
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);

    // 1. Fetch/Sync Labels (UserProfile)
    const userRef = doc(db, 'users', user.uid);
    const fetchUserProfile = async () => {
      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setLabels(data.labels || DEFAULT_LABELS);
          setHoursGoal(data.hoursGoal || 8);
        } else {
          // Initialize profile with defaults
          await setDoc(userRef, {
            labels: DEFAULT_LABELS,
            hoursGoal: 8,
            updatedAt: serverTimestamp()
          });
          setLabels(DEFAULT_LABELS);
          setHoursGoal(8);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    };
    fetchUserProfile();

    // 2. Sync Records
    const recordsRef = collection(db, 'users', user.uid, 'records');
    const q = query(recordsRef, orderBy('registeredAt', 'desc'));
    
    const unsubscribeRecords = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(docs);
      setIsDataLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/records`);
    });

    // 3. Sync Daily Memo
    const memoRef = doc(db, 'users', user.uid, 'memos', today);
    const unsubscribeMemo = onSnapshot(memoRef, (snapshot) => {
      if (snapshot.exists()) {
        setMemo(snapshot.data().text);
      } else {
        setMemo(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/memos/${today}`);
    });

    return () => {
      unsubscribeRecords();
      unsubscribeMemo();
    };
  }, [user, today]);

  // Sync label selection when labels change
  useEffect(() => {
    if (!labels.includes(label)) {
      setLabel(labels[0] || '');
    }
  }, [labels, label]);

  // --- Derived ---
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''));
  }, [records]);

  const stats = useMemo(() => {
    const todayRecords = records.filter(r => r.date === today);
    const totalHours = todayRecords.reduce((sum, r) => sum + r.hours, 0);
    const totalCount = todayRecords.reduce((sum, r) => sum + r.count, 0);
    const lastReg = records.length > 0 
      ? Math.max(...records.map(r => new Date(r.registeredAt).getTime()))
      : null;
    const chartData = [
      { name: 'Completed', value: Math.min(totalHours, hoursGoal) },
      { name: 'Remaining', value: Math.max(0, hoursGoal - totalHours) }
    ];

    const subStats = todayRecords.reduce((acc, r) => {
      const sl = r.subLabel || '未設定';
      if (!acc[sl]) acc[sl] = { hours: 0, count: 0 };
      acc[sl].hours += r.hours;
      acc[sl].count += r.count;
      return acc;
    }, {});

    return { 
      totalHours, 
      totalCount, 
      chartData, 
      subStats,
      isOverLimit: totalHours > hoursGoal,
      hoursGoal,
      lastRegisteredAt: lastReg,
      hasTodayRecords: todayRecords.length > 0
    };
  }, [records, today, hoursGoal]);

  // Suggested hours logic
  useEffect(() => {
    if (!isManualHours) {
      if (!stats.hasTodayRecords) {
        setHours(1.0);
      } else if (stats.lastRegisteredAt) {
        const diffHrs = (Date.now() - stats.lastRegisteredAt) / (1000 * 60 * 60);
        let suggested = 0.5;
        if (diffHrs > 0 && diffHrs <= 12) {
          suggested = Math.max(0.5, Math.min(8.0, Math.round(diffHrs * 2) / 2));
        } else if (diffHrs > 12) {
          suggested = 1.0;
        }
        setHours(suggested);
      }
    }
  }, [stats.lastRegisteredAt, stats.hasTodayRecords, isManualHours, records.length]);

  // --- Handlers ---
  const handleAddRecord = async () => {
    if (!user || !date || !label || count <= 0) return;
    const now = new Date().toISOString();

    try {
      // Find matching record by date, label, AND subLabel
      const existing = records.find(r => r.date === date && r.label === label && (r.subLabel || '') === (subLabel || ''));
      
      let docRef;
      if (existing) {
        docRef = doc(db, 'users', user.uid, 'records', existing.id);
      } else {
        const safeLabel = label.replace(/\//g, '_');
        const safeSubLabel = (subLabel || 'none').replace(/\//g, '_');
        const deterministicId = `rec_${date}_${safeLabel}_${safeSubLabel}`;
        docRef = doc(db, 'users', user.uid, 'records', deterministicId);
      }

      await setDoc(docRef, {
        date,
        label,
        subLabel: subLabel || '',
        count: increment(count),
        hours: increment(hours),
        registeredAt: now
      }, { merge: true });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setCountInput('0');
      setSubLabel('');
      setPrevCalcValue(null);
      setCalcOperator(null);
      setWaitingForOperand(false);
      setIsManualHours(false);
      setDate(getLocalDate());
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/records`);
    }
  };

  const handleKeypadPress = (key) => {
    const performCalc = (prev, current, op) => {
      const p = parseInt(prev) || 0;
      const c = parseInt(current) || 0;
      if (op === '+') return (p + c).toString();
      if (op === '-') return Math.max(0, p - c).toString();
      return current;
    };

    if (key === 'clear') {
      setCountInput('0');
      setPrevCalcValue(null);
      setCalcOperator(null);
      setWaitingForOperand(false);
      return;
    }

    if (key === 'back') {
      setCountInput(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
      return;
    }

    if (key === '+' || key === '-') {
      if (calcOperator && !waitingForOperand) {
        const result = performCalc(prevCalcValue, countInput, calcOperator);
        setCountInput(result);
        setPrevCalcValue(result);
      } else {
        setPrevCalcValue(countInput);
      }
      setCalcOperator(key);
      setWaitingForOperand(true);
      return;
    }

    if (key === '=') {
      if (calcOperator && prevCalcValue !== null) {
        const result = performCalc(prevCalcValue, countInput, calcOperator);
        setCountInput(result);
        setPrevCalcValue(null);
        setCalcOperator(null);
        setWaitingForOperand(false);
      }
      return;
    }

    // Number keys
    setCountInput(prev => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return key;
      }
      if (prev === '0') return key;
      return prev.length >= 6 ? prev : prev + key;
    });
  };

  const updateLabel = async (index, value) => {
    if (!user) return;
    const nextLabels = [...labels];
    nextLabels[index] = value;
    
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        labels: nextLabels,
        updatedAt: serverTimestamp()
      });
      setLabels(nextLabels);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleSaveMemo = async (text) => {
    if (!user) return;
    try {
      const memoRef = doc(db, 'users', user.uid, 'memos', today);
      await setDoc(memoRef, {
        text,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/memos/${today}`);
    }
  };

  const handleDeleteMemo = async () => {
    if (!user) return;
    try {
      const memoRef = doc(db, 'users', user.uid, 'memos', today);
      await deleteDoc(memoRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/memos/${today}`);
    }
  };

  const updateHoursGoal = async (newGoal) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        hoursGoal: newGoal,
        updatedAt: serverTimestamp()
      });
      setHoursGoal(newGoal);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin opacity-50" />
      </div>
    );
  }

  if (!user || (!user.emailVerified && user.providerData.some(p => p.providerId === 'password'))) {
    return <AuthModal unverifiedUser={user} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      <header className="mb-12 space-y-8">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/10">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-primary">メモハック</h1>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-slate-400 ml-1.5 opacity-80">
                業務の簡易計算メモが取れるツール
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-4 rounded-2xl transition-all ${
              isSettingsOpen 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                : 'bg-surface text-slate-400 hover:text-primary border border-border shadow-sm'
            }`}
          >
            <Settings className={`w-6 h-6 ${isSettingsOpen ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>
        
        <SummaryCard 
          date={today}
          onUpdateGoal={updateHoursGoal}
          {...stats}
        />
        <DailyMemo 
          memo={memo}
          onSave={handleSaveMemo}
          onDelete={handleDeleteMemo}
        />

        {Object.keys(stats.subStats).filter(k => k !== '未設定').length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(stats.subStats).filter(([k]) => k !== '未設定').map(([sLabel, data]) => (
              <div key={sLabel} className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{sLabel}</span>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black text-slate-700 leading-none">{data.hours.toFixed(1)}<small className="text-[10px] opacity-40 ml-0.5">h</small></span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">{data.count}点</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      {isDataLoading && records.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest italic">データを同期中...</p>
        </div>
      ) : (
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 space-y-8">
            <RegistrationForm 
              date={date}
              setDate={setDate}
              label={label}
              setLabel={setLabel}
              labels={labels}
              subLabel={subLabel}
              setSubLabel={setSubLabel}
              countInput={countInput}
              onKeypadPress={handleKeypadPress}
              hours={hours}
              setHours={setHours}
              setIsManualHours={setIsManualHours}
              onAdd={handleAddRecord}
              showSuccess={showSuccess}
              disabled={count === 0}
            />
          </div>

          <div className="lg:col-span-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-base-text flex items-center gap-3">
                <Calendar className="w-6 h-6 text-primary" />
                実績ログ一覧
              </h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{records.length} 点のデータ</span>
            </div>

            <div className="space-y-6">
              {sortedRecords.length > 0 ? (
                sortedRecords.map((record) => (
                  <RecordCard 
                    key={record.id}
                    record={record}
                    onEdit={() => setEditingRecord(record)}
                    onShowQR={() => setQrRecord(record)}
                    onDelete={() => setRecordToDelete(record)}
                  />
                ))
              ) : (
                <div className="py-24 text-center bg-surface rounded-3xl border-2 border-dashed border-border shadow-inner">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
                    <TrendingUp className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-500 font-bold italic">データはまだ登録されていません</p>
                  <p className="text-slate-400 text-sm mt-2">日々の業務実績を上のフォームから登録しましょう</p>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      <footer className="mt-20 mb-12 flex flex-col items-center gap-8">
        <div className="bg-surface p-6 rounded-3xl border border-border shadow-lg flex flex-col items-center gap-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Mobile Access</p>
          <div className="bg-white p-3 rounded-2xl border border-border shadow-inner">
            <QR value={window.location.origin} size={140} />
          </div>
          <p className="text-[11px] font-mono text-slate-400 max-w-[200px] break-all text-center leading-relaxed">
            {window.location.origin}
          </p>
        </div>
        <div className="text-center text-slate-400 text-xs font-bold tracking-widest uppercase opacity-60">
          &copy; {new Date().getFullYear()} メモハック
        </div>
      </footer>

      {qrRecord && (
        <QRModal record={qrRecord} onClose={() => setQrRecord(null)} />
      )}
      {editingRecord && (
        <EditModal 
          record={editingRecord}
          onCancel={() => setEditingRecord(null)}
          onSave={async (c, h, d, sl) => {
            try {
              const docRef = doc(db, 'users', user.uid, 'records', editingRecord.id);
              await updateDoc(docRef, {
                count: c,
                hours: h,
                date: d,
                subLabel: sl
              });
              setEditingRecord(null);
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/records/${editingRecord.id}`);
            }
          }}
        />
      )}
      {recordToDelete && (
        <DeleteModal 
          record={recordToDelete}
          onCancel={() => setRecordToDelete(null)}
          onConfirm={async () => {
            try {
              const docRef = doc(db, 'users', user.uid, 'records', recordToDelete.id);
              await deleteDoc(docRef);
              setRecordToDelete(null);
            } catch (error) {
              handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/records/${recordToDelete.id}`);
            }
          }}
        />
      )}
      <SettingsPanel 
        isOpen={isSettingsOpen}
        setIsOpen={setIsSettingsOpen}
        labels={labels}
        updateLabel={updateLabel}
        user={user}
        onLogout={handleLogout}
      />
    </div>
  );
}
