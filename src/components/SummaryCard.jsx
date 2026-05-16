import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Box, Check, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getYearDisplay, getMonthDayDisplay } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function SummaryCard({ 
  date, 
  totalHours, 
  totalCount, 
  chartData, 
  isOverLimit, 
  hoursGoal,
  onUpdateGoal,
  lastRegisteredAt 
}) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editValue, setEditValue] = useState(hoursGoal.toString());

  useEffect(() => {
    setEditValue(hoursGoal.toString());
  }, [hoursGoal]);

  const handleSave = () => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0 && val <= 24) {
      onUpdateGoal(val);
      setIsEditingGoal(false);
    }
  };

  return (
    <div className="bg-surface p-7 rounded-[32px] border border-border shadow-md shadow-slate-100 flex flex-col md:flex-row md:items-center gap-8 min-w-[280px]">
      <div className="flex-1 space-y-5">
        <div className="flex items-center gap-4 border-b border-border/80 pb-5">
          <div className="p-2.5 bg-white rounded-xl border border-border shadow-sm">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{getYearDisplay(date)}</p>
            <p className="text-2xl font-black text-primary tracking-tight leading-none">{getMonthDayDisplay(date)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              所要時間
            </div>
            <p className="text-3xl font-black text-primary leading-none">
              {totalHours.toFixed(1)}<small className="text-xs font-bold opacity-40 ml-1">h</small>
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Box className="w-3 h-3" />
              実績点数
            </div>
            <p className="text-3xl font-black text-primary leading-none">
              {totalCount}<small className="text-xs font-bold opacity-40 ml-1">点</small>
            </p>
          </div>
          {lastRegisteredAt && (
            <div className="col-span-2 pt-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">前回登録</span>
              <span className="text-[11px] font-black text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-border/50">
                {new Date(lastRegisteredAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div 
        className="w-32 h-32 relative flex-shrink-0 cursor-pointer group"
        onClick={() => !isEditingGoal && setIsEditingGoal(true)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={38}
              outerRadius={50}
              paddingAngle={0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={isOverLimit ? "#FF7F50" : "#00A99D"} />
              <Cell fill="#E2E8F0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {isEditingGoal ? (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center bg-white/90 backdrop-blur-sm inset-0 absolute rounded-full justify-center z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-12 text-center text-sm font-black text-primary border-b-2 border-primary outline-none bg-transparent"
                  autoFocus
                  onBlur={handleSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') setIsEditingGoal(false);
                  }}
                />
                <div className="flex gap-1 mt-1">
                  <button onClick={handleSave} className="p-1 text-primary hover:bg-slate-100 rounded">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setIsEditingGoal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center pointer-events-none group-hover:scale-105 transition-transform"
              >
                <span className={`text-[10px] font-bold tracking-widest uppercase ${isOverLimit ? 'text-accent' : 'text-slate-400'}`}>
                  {isOverLimit ? 'Over' : 'Goal'}
                </span>
                <div className="relative">
                   <span className={`text-sm font-black ${isOverLimit ? 'text-accent' : 'text-primary'}`}>
                    {hoursGoal}h
                  </span>
                  <div className="absolute -right-4 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
