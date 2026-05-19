import React, { useState, useEffect } from 'react';
import { Calendar, Tag, Hash, Clock, Plus, CheckCircle2, Delete, Play, Pause, Download, Timer } from 'lucide-react';
import { KeypadButton } from './KeypadButton';

export function RegistrationForm({
  date, setDate, label, setLabel, labels, subLabel, setSubLabel, countInput, onKeypadPress, hours, setHours, setIsManualHours, onAdd, showSuccess, disabled
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const SUB_LABELS = ['-', 'NBJ', 'BJ', 'ルース', '時計', 'バッグ'];

  // Load timer state on mount
  useEffect(() => {
    const saved = localStorage.getItem('biz_tracker_timer');
    if (saved) {
      const { isRunning: savedRunning, accumulatedMs: savedAcc, startTime: savedStart } = JSON.parse(saved);
      
      if (savedRunning && savedStart) {
        setIsRunning(true);
        setStartTime(savedStart);
        setAccumulatedMs(savedAcc || 0);
        // Instant sync for display
        const total = (savedAcc || 0) + (Date.now() - savedStart);
        setElapsed(Math.floor(total / 1000));
      } else {
        setAccumulatedMs(savedAcc || 0);
        setElapsed(Math.floor((savedAcc || 0) / 1000));
      }
    }
  }, []);

  // Sync timer state to localStorage
  useEffect(() => {
    const timerData = { isRunning, accumulatedMs, startTime };
    localStorage.setItem('biz_tracker_timer', JSON.stringify(timerData));
  }, [isRunning, accumulatedMs, startTime]);

  // Heartbeat to update display
  useEffect(() => {
    let interval;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const total = accumulatedMs + (Date.now() - startTime);
        setElapsed(Math.floor(total / 1000));
      }, 500); 
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime, accumulatedMs]);

  useEffect(() => {
    if (showSuccess) {
      handleReset();
    }
  }, [showSuccess]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (isRunning) {
      // Pause: Save current period to accumulated
      const delta = Date.now() - startTime;
      setAccumulatedMs(prev => prev + delta);
      setStartTime(null);
      setIsRunning(false);
    } else {
      // Start/Resume: Set new start point
      setStartTime(Date.now());
      setIsRunning(true);
    }
  };

  const handleStop = () => {
    let finalElapsedMs = accumulatedMs;
    if (isRunning && startTime) {
      finalElapsedMs += (Date.now() - startTime);
    }
    
    const finalSeconds = Math.floor(finalElapsedMs / 1000);
    const calculatedHours = finalSeconds / 3600;
    const roundedHours = Math.max(0.1, Math.round(calculatedHours * 10) / 10);
    
    setHours(Math.min(8.0, roundedHours));
    setIsManualHours(true);
    
    // Clear timer
    setIsRunning(false);
    setStartTime(null);
    setAccumulatedMs(0);
    setElapsed(0);
    localStorage.removeItem('biz_tracker_timer');
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartTime(null);
    setAccumulatedMs(0);
    setElapsed(0);
    localStorage.removeItem('biz_tracker_timer');
  };

  return (
    <section className="bg-surface p-8 rounded-[32px] border border-border shadow-md shadow-slate-100 space-y-8">
      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-base-text mb-2.5">
            <Calendar className="w-4 h-4 text-primary" />
            対象の作業日
          </label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-4 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-base-text mb-3">
            <Tag className="w-4 h-4 text-primary" />
            業務カテゴリ選択
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {labels.map((l, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLabel(l)}
                className={`px-2 py-3.5 text-[13px] font-bold rounded-xl border-2 transition-all truncate ${
                  label === l && l !== ''
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                    : 'bg-white border-border text-slate-500 hover:border-primary/40 hover:text-primary active:scale-95'
                }`}
                title={l || `未設定 ${idx + 1}`}
              >
                {l || <span className="opacity-30">---</span>}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-base-text mb-3">
            <Tag className="w-4 h-4 text-primary opacity-60" />
            サブカテゴリ選択
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {SUB_LABELS.map(sl => (
              <button
                key={sl}
                type="button"
                onClick={() => setSubLabel(sl === '-' ? '' : sl)}
                className={`px-1 py-3 text-[11px] font-black rounded-xl border-2 transition-all ${
                  (sl === '-' && subLabel === '') || subLabel === sl
                    ? 'bg-primary border-primary text-white shadow-md' 
                    : 'bg-white border-border text-slate-400 hover:border-slate-200 active:scale-95'
                }`}
              >
                {sl}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-base-text mb-2.5">
            <Hash className="w-4 h-4 text-primary" />
            処理点数
          </label>
          
          <div className="w-full p-5 mb-5 bg-white border border-border rounded-2xl flex items-center justify-between shadow-inner">
            <span className="text-slate-400 text-[11px] font-bold font-mono tracking-widest uppercase">Input Points</span>
            <span className="text-4xl font-black text-primary font-mono">{countInput}</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {[7, 8, 9].map((num) => (
              <KeypadButton key={num} onClick={() => onKeypadPress(num.toString())}>
                {num}
              </KeypadButton>
            ))}
            <KeypadButton 
              onClick={() => onKeypadPress('+')} 
              className="bg-slate-50 text-primary border border-primary/10"
            >
              <span className="text-2xl font-bold">+</span>
            </KeypadButton>

            {[4, 5, 6].map((num) => (
              <KeypadButton key={num} onClick={() => onKeypadPress(num.toString())}>
                {num}
              </KeypadButton>
            ))}
            <KeypadButton 
              onClick={() => onKeypadPress('-')} 
              className="bg-slate-50 text-primary border border-primary/10"
            >
              <span className="text-2xl font-bold">-</span>
            </KeypadButton>

            {[1, 2, 3].map((num) => (
              <KeypadButton key={num} onClick={() => onKeypadPress(num.toString())}>
                {num}
              </KeypadButton>
            ))}
            <KeypadButton 
              onClick={() => onKeypadPress('=')} 
              className="bg-primary text-white border-primary"
            >
              <span className="text-2xl font-black leading-none">=</span>
            </KeypadButton>

            <KeypadButton 
              onClick={() => onKeypadPress('clear')} 
              className="bg-white text-accent border-accent/20 hover:border-accent/40"
            >
              <span className="text-xl font-black">C</span>
            </KeypadButton>
            <KeypadButton onClick={() => onKeypadPress('0')}>
              0
            </KeypadButton>
            <KeypadButton 
              onClick={() => onKeypadPress('back')} 
              className="bg-white text-slate-400 border-slate-200 hover:border-slate-400 col-span-2"
            >
              <div className="flex items-center gap-2">
                <Delete className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Del</span>
              </div>
            </KeypadButton>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-base-text mb-4">
            <Clock className="w-4 h-4 text-primary" />
            タイムトラッカー
          </label>
          <div className="bg-white border-2 border-primary/5 rounded-2xl p-3 sm:p-4 mb-8 flex items-center justify-between shadow-sm group hover:border-primary/20 transition-all">
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-colors ${isRunning ? 'bg-amber-100' : 'bg-slate-50'}`}>
                <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${isRunning ? 'text-amber-500 animate-pulse' : 'text-slate-300'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-0.5 sm:mb-1">Elapsed Time</p>
                <p className="text-2xl sm:text-3xl font-mono font-black text-slate-700 tracking-tight leading-none">{formatTime(elapsed)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleToggle}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl shadow-lg transition-all active:scale-95 ${
                  isRunning 
                  ? 'bg-amber-500 text-white shadow-amber-200' 
                  : 'bg-primary text-white shadow-primary/20'
                }`}
                title={isRunning ? "PAUSE" : "START"}
              >
                {isRunning ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
              
              <button 
                onClick={handleStop}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl shadow-lg transition-all active:scale-95 ${
                  elapsed > 0 
                  ? 'bg-slate-700 text-white shadow-slate-200' 
                  : 'bg-slate-100 text-slate-300 pointer-events-none'
                }`}
                title="APPLY TO HOURS"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <label className="flex items-center gap-2 text-sm font-bold text-base-text">
              <Timer className="w-4 h-4 text-primary" />
              所要時間 (Hour)
            </label>
            <span className="px-4 py-1.5 bg-white text-primary font-black rounded-lg text-xl ring-1 ring-border shadow-sm">
              {hours.toFixed(1)}h
            </span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="8" 
            step="0.5" 
            value={hours}
            onChange={(e) => {
              setHours(parseFloat(e.target.value));
              setIsManualHours(true);
            }}
            className="w-full h-6 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between mt-3 px-1 text-[11px] uppercase tracking-wider font-bold text-slate-400">
            <span>0h</span>
            <span>2h</span>
            <span>4h</span>
            <span>6h</span>
            <span>8h</span>
          </div>
        </div>
      </div>

      <div className="relative pt-4">
        <button 
          onClick={onAdd}
          disabled={disabled}
          className={`w-full py-5 font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
            showSuccess 
            ? 'bg-emerald-600 text-white shadow-emerald-200' 
            : 'bg-primary hover:brightness-105 disabled:opacity-30 disabled:grayscale text-white shadow-primary/20'
          }`}
        >
          {showSuccess ? (
            <>
              <CheckCircle2 className="w-6 h-6 animate-bounce" />
              記録が完了しました
            </>
          ) : (
            <>
              <Plus className="w-6 h-6" />
              業務実績を登録する
            </>
          )}
        </button>
      </div>
    </section>
  );
}
