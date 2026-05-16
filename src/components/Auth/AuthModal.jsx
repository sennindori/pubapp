import React, { useState } from 'react';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { Mail, Lock, UserPlus, LogIn, TrendingUp, ShieldAlert, RotateCw, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export function AuthModal({ unverifiedUser = null }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSendVerification = async () => {
    if (!unverifiedUser) return;
    setLoading(true);
    setError('');
    try {
      await sendEmailVerification(unverifiedUser);
      setVerificationSent(true);
    } catch (err) {
      console.error('Verification Error:', err);
      setError('認証メールの送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // 新規登録時に即座に確認メールを送信
        await sendEmailVerification(userCredential.user);
        setVerificationSent(true);
      }
    } catch (err) {
      console.error('Auth Error:', err);
      let message = 'エラーが発生しました。';
      if (err.code === 'auth/invalid-credential') {
        message = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'このメールアドレスは既に登録されています。';
      } else if (err.code === 'auth/weak-password') {
        message = 'パスワードは6文字以上で入力してください。';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'この認証方式は現在有効になっていません。Firebaseコンソールで確認してください。';
      } else {
        message += ` (${err.code || 'unknown-error'})`;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (unverifiedUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="p-8 md:p-10 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <ShieldAlert className="w-9 h-9 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">メール認証が必要です</h2>
            <p className="text-slate-500 text-sm font-bold leading-relaxed mb-8">
              {unverifiedUser.email} 宛に認証メールを送信しています。<br />
              メール内のリンクをクリックして、アカウントを有効にしてください。
            </p>

            <div className="space-y-4">
              {verificationSent ? (
                <div className="py-4 px-6 bg-green-50 text-green-600 rounded-2xl font-bold text-sm border border-green-100 italic">
                  認証メールを再送信しました。
                </div>
              ) : (
                <button
                  onClick={handleSendVerification}
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? <RotateCw className="w-5 h-5 animate-spin" /> : '認証メールを再送信する'}
                </button>
              )}

              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all hover:bg-slate-200 active:scale-[0.98]"
              >
                認証が完了したのでページを更新する
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-4 bg-white border-2 border-slate-100 text-slate-400 font-bold rounded-2xl transition-all hover:border-slate-200 hover:text-slate-600 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                別の本人情報でログインする
              </button>
            </div>

            {error && (
              <p className="mt-6 text-red-500 text-xs font-bold italic">
                {error}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="p-8 md:p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-primary rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">メモハック</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">Business Record Tracker</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="メールアドレス"
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-sm"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              </div>

              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード (6文字以上)"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-sm"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold bg-red-50 p-4 rounded-xl border border-red-100 italic text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110'}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  <span>{isLogin ? 'ログイン' : '新規登録'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
            >
              {isLogin ? '新しいアカウントを作成する' : '既にアカウントをお持ちの方はこちら'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
