import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, Settings } from 'lucide-react';
import { getLocalDate } from './lib/utils';
import { QR } from './components/QR';
import { SummaryCard } from './components/SummaryCard';
import { SettingsPanel } from './components/SettingsPanel';
import { RegistrationForm } from './components/RegistrationForm';
import { RecordCard } from './components/RecordCard';
import { DeleteModal } from './components/Modals/DeleteModal';
import { EditModal } from './components/Modals/EditModal';
import { QRModal } from './components/Modals/QRModal';

const DEFAULT_LABELS = ['開梱', '撮影', '札付け', 'パケ入れ', '付属確認', 'X線', '検品', 'その他',];

export default function App() {
  // --- State ---
  const [labels, setLabels] = useState(() => {
    const saved = localStorage.getItem('biz_tracker_labels');
    const loaded = saved ? JSON.parse(saved) : DEFAULT_LABELS;
    // Always ensure at least 8 slots are available
    if (loaded.length < 8) {
      return [...loaded, ...Array(8 - loaded.length).fill('')];
    }
    return loaded;
  });

  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('biz_tracker_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [date, setDate] = useState(getLocalDate());
  const [label, setLabel] = useState(labels[0]);
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

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('biz_tracker_labels', JSON.stringify(labels));
  }, [labels]);

  useEffect(() => {
    localStorage.setItem('biz_tracker_records', JSON.stringify(records));
  }, [records]);

  // Sync label selection
  useEffect(() => {
    if (!labels.includes(label)) {
      setLabel(labels[0]);
    }
  }, [labels, label]);

  // --- Derived ---
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const stats = useMemo(() => {
    const todayRecords = records.filter(r => r.date === today);
    const totalHours = todayRecords.reduce((sum, r) => sum + r.hours, 0);
    const totalCount = todayRecords.reduce((sum, r) => sum + r.count, 0);
    const lastReg = records.length > 0 
      ? Math.max(...records.map(r => new Date(r.registeredAt).getTime()))
      : null;
    const chartData = [
      { name: 'Completed', value: Math.min(totalHours, 8) },
      { name: 'Remaining', value: Math.max(0, 8 - totalHours) }
    ];
    return { 
      totalHours, 
      totalCount, 
      chartData, 
      isOverLimit: totalHours > 8,
      lastRegisteredAt: lastReg,
      hasTodayRecords: todayRecords.length > 0
    };
  }, [records, today]);

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
  const handleAddRecord = () => {
    if (!date || !label || count <= 0) return;
    const now = new Date().toISOString();

    setRecords(prev => {
      const existingIndex = prev.findIndex(r => r.date === date && r.label === label);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          count: updated[existingIndex].count + count,
          hours: Number((updated[existingIndex].hours + hours).toFixed(1)),
          registeredAt: now
        };
        return updated;
      }
      return [{ id: crypto.randomUUID(), date, label, count, hours, registeredAt: now }, ...prev];
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    setCountInput('0');
    setPrevCalcValue(null);
    setCalcOperator(null);
    setWaitingForOperand(false);
    setIsManualHours(false);
    setDate(getLocalDate());
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

  const updateLabel = (index, value) => {
    setLabels(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      <header className="mb-12 space-y-8">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/10">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-primary">作業メモ電卓</h1>
            </div>
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-slate-400 ml-1.5 opacity-80">
              業務の簡易計算メモが取れるツール
            </p>
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
          {...stats}
        />
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-6 space-y-8">
          <RegistrationForm 
            date={date}
            setDate={setDate}
            label={label}
            setLabel={setLabel}
            labels={labels}
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
          &copy; {new Date().getFullYear()} 作業メモ電卓
        </div>
      </footer>

      {/* Modals */}
      {qrRecord && (
        <QRModal record={qrRecord} onClose={() => setQrRecord(null)} />
      )}
      {editingRecord && (
        <EditModal 
          record={editingRecord}
          onCancel={() => setEditingRecord(null)}
          onSave={(c, h, d) => {
            setRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...r, count: c, hours: h, date: d } : r));
            setEditingRecord(null);
          }}
        />
      )}
      {recordToDelete && (
        <DeleteModal 
          record={recordToDelete}
          onCancel={() => setRecordToDelete(null)}
          onConfirm={() => {
            setRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
            setRecordToDelete(null);
          }}
        />
      )}
      <SettingsPanel 
        isOpen={isSettingsOpen}
        setIsOpen={setIsSettingsOpen}
        labels={labels}
        updateLabel={updateLabel}
      />
    </div>
  );
}
