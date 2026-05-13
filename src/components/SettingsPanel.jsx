import React from 'react';
import { Settings2, X, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function SettingsPanel({ isOpen, setIsOpen, labels, updateLabel }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-xl overflow-hidden rounded-3xl shadow-2xl relative z-10 border border-slate-200"
          >
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Settings2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-base-text">カテゴリ名称の編集</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      作業カテゴリのプリセットをカスタマイズ
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
        
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {labels.map((lbl, idx) => (
                  <div key={idx} className="relative group">
                    <input
                      type="text"
                      value={lbl}
                      onChange={(e) => updateLabel(idx, e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-sm font-bold placeholder:text-slate-300"
                      placeholder={`カテゴリ ${idx + 1}...`}
                    />
                    <Tag className="w-4 h-4 text-slate-300 group-focus-within:text-primary absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-200 group-focus-within:text-slate-300">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                >
                  閉じる
                </button>
              </div>
              
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center mt-2 opacity-60">
                編集内容はリアルタイムで保存されます
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
