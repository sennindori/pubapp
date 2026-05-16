import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Check, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function DailyMemo({ memo, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(memo || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    setText(memo || '');
  }, [memo]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(text);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setText(memo || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('メモを削除しますか？')) {
      onDelete();
      setText('');
      setIsEditing(false);
    }
  };

  return (
    <div className="mt-6 bg-white rounded-[24px] border border-border shadow-sm overflow-hidden transition-all hover:border-slate-300">
      <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Daily Memo</h3>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all"
              title="編集"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {memo && (
              <button
                onClick={handleDelete}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                title="削除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="その日の出来事やメモを記入..."
                className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 leading-relaxed resize-none"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-4 h-4" />
                  保存する
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <X className="w-4 h-4" />
                  キャンセル
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="cursor-pointer group"
              onClick={() => setIsEditing(true)}
            >
              {memo ? (
                <p className="text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                  {memo}
                </p>
              ) : (
                <div className="py-2 flex flex-col items-center justify-center gap-2 text-slate-300 group-hover:text-slate-400 transition-colors">
                   <p className="text-sm font-bold italic">クリックしてメモを追加</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
