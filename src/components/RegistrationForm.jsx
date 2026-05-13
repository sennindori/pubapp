import React, { useState, useEffect } from 'react';
import { Calendar, Tag, Hash, Clock, Plus, CheckCircle2, X, Delete, Play, Square, RotateCcw, Timer, Minus, Equal } from 'lucide-react';
import { KeypadButton } from './KeypadButton';

export function RegistrationForm({
  date, setDate, label, setLabel, labels, countInput, onKeypadPress, hours, setHours, setIsManualHours, onAdd, showSuccess, disabled
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Load timer state on mount
  useEffect(() => {
    const saved = localStorage.getItem('biz_tracker_timer');
    if (saved) {
      const { isRunning: savedRunning, startTime: savedStart, elapsed: savedElapsed } = JSON.parse(saved);
      if (savedRunning && savedStart) {
        setIsRunning(true);
        setStartTime(savedStart);
        const currentElapsed = savedElapsed + Math.floor((Date.now() - savedStart) / 1000);
        setElapsed(currentElapsed);
      } else {
        setElapsed(savedElapsed || 0);
      }
    }
  }, []);

  // Sync timer state to localStorage
  useEffect(() => {
    const timerData = { isRunning, startTime, elapsed };
    localStorage.setItem('biz_tracker_timer', JSON.stringify(timerData));
  }, [isRunning, startTime, elapsed]);

  useEffect(() => {
    let interval;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const delta = Math.floor((Date.now() - startTime) / 1000);
        setElapsed(delta);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

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

  const handleStart = () => {
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setStartTime(null);
    const calculatedHours = elapsed / 3600;
    const roundedHours = Math.max(0.1, Math.round(calculatedHours * 10) / 10);
    setHours(Math.min(8.0, roundedHours));
    setIsManualHours(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartTime(null);
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
                className={`px-2 py-3.5 text-[13px] font-bold rounded-xl border-2 transition-all transition-all truncate ${
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
              className="bg-slate-50 text-primary border-primary/10 hover:border-primary/30"
            >
              <Plus className="w-5 h-5" />
            </KeypadButton>

            {[4, 5, 6].map((num) => (
              <KeypadButton key={num} onClick={() => onKeypadPress(num.toString())}>
                {num}
              </KeypadButton>
            ))}
            <KeypadButton 
              onClick={() => onKeypadPress('-')} 
              className="bg-slate-50 text-primary border-primary/10 hover:border-primary/30"
            >
              <Minus className="w-5 h-5" />
            </KeypadButton>

            {[1, 2, 3].map((num) => (
              <KeypadButton key={num} onClick={() => onKeypadPress(num.toString())}>
                {num}
              </KeypadButton>
            ))}
            <KeypadButton 
              onClick={() => onKeypadPress('=')} 
              className="bg-primary text-white border-primary shadow-lg shadow-primary/20 hover:brightness-110"
            >
              <span className="text-2xl font-black">=</span>
            </KeypadButton>

            <KeypadButton 
              onClick={() => onKeypadPress('clear')} 
              className="bg-white text-accent border-accent/20 hover:border-accent/40"
            >
              <span className="text-sm font-black">C</span>
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
          <div className="bg-white border-2 border-primary/5 rounded-2xl p-5 mb-8 flex items-center justify-between shadow-sm group hover:border-primary/20 transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isRunning ? 'bg-amber-100' : 'bg-slate-50'}`}>
                <Clock className={`w-6 h-6 ${isRunning ? 'text-amber-500 animate-pulse' : 'text-slate-300'}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Elapsed Time</p>
                <p className="text-3xl font-mono font-black text-slate-700 tracking-tight">{formatTime(elapsed)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              {!isRunning ? (
                <button 
                  onClick={handleStart}
                  className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  title="START"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              ) : (
                <button 
                  onClick={handleStop}
                  className="w-12 h-12 flex items-center justify-center bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-200 hover:scale-105 active:scale-95 transition-all"
                  title="STOP"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
              )}
              <button 
                onClick={handleReset}
                className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all border border-slate-100"
                title="RESET"
              >
                <RotateCcw className="w-5 h-5" />
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
