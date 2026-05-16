import React, { useState } from 'react';
import { Settings2, X, Tag, ChevronRight, ChevronLeft, User, Key, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function SettingsPanel({ isOpen, setIsOpen, labels, updateLabel, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'account'
  const [page, setPage] = useState(0); // 0 or 1 for categories
  const itemsPerPage = 4;
  const currentItems = labels.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwStatus, setPwStatus] = useState({ type: null, message: '' }); // { type: 'success' | 'error', message: string }
  const [isChangingPw, setIsChangingPw] = useState(false);

  const togglePage = () => setPage(prev => (prev === 0 ? 1 : 0));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPwStatus({ type: 'error', message: '新しいパスワードは6文字以上で入力してください。' });
      return;
    }

    setIsChangingPw(true);
    setPwStatus({ type: null, message: '' });

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, newPassword);
      
      setPwStatus({ type: 'success', message: 'パスワードを更新しました。' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/wrong-password') {
        setPwStatus({ type: 'error', message: '現在のパスワードが正しくありません。' });
      } else {
        setPwStatus({ type: 'error', message: 'パスワードの更新に失敗しました。' });
      }
    } finally {
      setIsChangingPw(false);
    }
  };

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
            className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl relative z-10 border border-slate-200 flex flex-col md:flex-row h-auto max-h-[92vh] md:min-h-[500px] overflow-hidden"
          >
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-slate-50 p-5 md:p-8 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
              <div className="flex items-center gap-3 mb-6 md:mb-8 px-2">
                <div className="p-2 bg-primary rounded-xl">
                  <Settings2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-slate-800 tracking-tight">設定メニュー</h3>
              </div>

              <button
                onClick={() => setActiveTab('categories')}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === 'categories' 
                    ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>カテゴリ編集</span>
              </button>

              <button
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === 'account' 
                    ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>アカウント</span>
              </button>

              <div className="mt-auto pt-6 border-t border-slate-200/60 hidden md:block">
                <button
                  onClick={onLogout}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm text-red-400 hover:text-red-500 hover:bg-red-50 transition-all w-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ログアウト</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h4 className="text-xl font-bold text-slate-800 capitalize">
                  {activeTab === 'categories' ? 'カテゴリ名称の編集' : 'アカウント設定'}
                </h4>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1">
                {activeTab === 'categories' ? (
                  <div className="space-y-6">
                    <p className="text-sm text-slate-400 font-bold leading-relaxed">
                      業務記録で使用するカテゴリ名をカスタマイズできます。変更は即座に反映されます。
                    </p>
                    
                    <div className="space-y-3">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={page}
                          initial={{ opacity: 0, x: page === 0 ? -10 : 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: page === 0 ? 10 : -10 }}
                          transition={{ duration: 0.2 }}
                          className="grid grid-cols-1 gap-3"
                        >
                          {currentItems.map((lbl, i) => {
                            const idx = page * itemsPerPage + i;
                            return (
                              <div key={idx} className="relative group">
                                <input
                                  type="text"
                                  value={lbl}
                                  onChange={(e) => updateLabel(idx, e.target.value)}
                                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm font-bold placeholder:text-slate-300"
                                  placeholder={`カテゴリ ${idx + 1}...`}
                                />
                                <Tag className="w-4 h-4 text-slate-300 group-focus-within:text-primary absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-200 group-focus-within:text-slate-300">
                                  #{idx + 1}
                                </div>
                              </div>
                            );
                          })}
                        </motion.div>
                      </AnimatePresence>

                      <div className="flex items-center justify-between pt-4">
                        <div className="flex gap-1.5 ml-1">
                          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${page === 0 ? 'bg-primary w-4' : 'bg-slate-200'}`} />
                          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${page === 1 ? 'bg-primary w-4' : 'bg-slate-200'}`} />
                        </div>
                        
                        <button
                          onClick={togglePage}
                          className="flex items-center gap-2 text-xs font-bold text-primary px-5 py-2.5 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all"
                        >
                          {page === 0 ? (
                            <>
                              <span>次の4件</span>
                              <ChevronRight className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              <ChevronLeft className="w-4 h-4" />
                              <span>前の4件</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* User Info */}
                    <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">ログイン中のアカウント</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="font-bold text-slate-700">{user?.email}</span>
                      </div>
                    </div>

                    {/* Change Password Form */}
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        パスワードの変更
                      </h5>
                      <div className="space-y-3">
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="現在のパスワード"
                          autoComplete="current-password"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold"
                        />
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="新しいパスワード (6文字以上)"
                          autoComplete="new-password"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold"
                        />
                      </div>

                      {pwStatus.message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                          pwStatus.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {pwStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          <span>{pwStatus.message}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isChangingPw}
                        className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all text-sm disabled:opacity-50"
                      >
                        {isChangingPw ? '更新中...' : 'パスワードを更新する'}
                      </button>
                    </form>

                    <div className="md:hidden pt-4 border-t border-slate-100">
                      <button
                        onClick={onLogout}
                        className="w-full py-4 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-100 transition-all text-sm flex items-center justify-center gap-2"
                      >
                       <LogOut className="w-4 h-4" />
                       ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 md:mt-auto pt-8 flex justify-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-4 bg-primary/5 text-primary font-bold rounded-2xl hover:bg-primary/10 transition-all text-sm uppercase tracking-widest"
                >
                  閉じる
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

