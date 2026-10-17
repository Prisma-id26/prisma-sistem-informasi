import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import api from '../../api';

export default function PasswordRecovery() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); 
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Prisma Group - Buat Password Baru";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== passwordConfirmation) {
      setMessage({ type: 'error', text: 'Password dan Konfirmasi Password tidak cocok.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal harus terdiri dari 6 karakter.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Mengirim request ke backend untuk menyimpan password baru berdasarkan token
      const response = await api.post('/reset-password', { 
        email, 
        token, 
        password, 
        password_confirmation: passwordConfirmation 
      });
      
      setMessage({ type: 'success', text: response.data.message || 'Password berhasil dipulihkan! Anda akan dialihkan ke halaman Login.' });
      
      // Alihkan ke halaman login setelah 3 detik
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      if (err.response && err.response.data.message) {
        setMessage({ type: 'error', text: err.response.data.message });
      } else {
        setMessage({ type: 'error', text: 'Gagal memulihkan password. Tautan (link) mungkin sudah tidak berlaku.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Tampilan jika link dibuka tanpa token atau email (Akses Ilegal)
  if (!email || !token) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md text-center border border-slate-200 dark:border-slate-700">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Tautan Tidak Valid</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Tautan pemulihan kata sandi tidak lengkap atau sudah usang. Silakan ajukan ulang pemulihan kata sandi.</p>
          <Link to="/forgot-password" className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors">
            Kembali ke Lupa Password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Side Visual Section - Branding PRISMA GROUP */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-white dark:bg-slate-800 flex-col justify-between p-12 overflow-hidden border-r border-slate-200 dark:border-slate-700/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:opacity-20 transition-colors" />

        <div className="relative z-10 flex items-center gap-3">
          <img src="/PRISMA.PNG" alt="Prisma Logo Light" className="h-12 w-auto object-contain drop-shadow-sm dark:hidden" />
          <img src="/PRISMA_NEGATIF.PNG" alt="Prisma Logo Dark" className="h-12 w-auto object-contain drop-shadow-sm hidden dark:block" />
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-wide">PRISMA GROUP</h1>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-500">Konsultan Teknik Konstruksi</p>
          </div>
        </div>

        <div className="relative z-10 space-y-4 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4" /> Sistem Manajemen Proyek
          </div>
          
          <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">
            Pemulihan Akses Berhasil
          </h2>
          
          <p className="text-amber-600 dark:text-amber-500 text-sm max-w-md leading-relaxed font-semibold">
            Tautan valid telah dikonfirmasi. Silakan atur kata sandi baru Anda untuk kembali mengakses sistem pengawasan Prisma Group.
          </p>
        </div>

        <div className="relative z-10 text-xs font-bold text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between">
          <span>&copy; {new Date().getFullYear()} Prisma Jasa Konsulindo</span>
          <span>Protected Enterprise System</span>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-800/60 p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-700/60 backdrop-blur-sm shadow-xl dark:shadow-2xl transition-colors relative">

          <div className="text-center space-y-2 pt-2">
            <div className="lg:hidden flex justify-center mb-4">
               <img src="/PRISMA.PNG" alt="Prisma Logo" className="h-14 w-auto object-contain drop-shadow-sm dark:hidden" />
               <img src="/PRISMA_NEGATIF.PNG" alt="Prisma Logo" className="h-14 w-auto object-contain drop-shadow-sm hidden dark:block" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Buat Password Baru</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Silakan masukkan kata sandi baru untuk akun Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {message.text && (
              <div className={`p-4 rounded-xl flex items-start gap-2 text-xs font-bold shadow-sm animate-fade-in ${
                message.type === 'error' 
                  ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400' 
                  : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}>
                {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span className="leading-relaxed">{message.text}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Akun Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" 
                  value={email} 
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-900/50 border border-transparent rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password Baru</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-11 pr-11 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors font-mono"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Konfirmasi Password Baru</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={passwordConfirmation} 
                  onChange={(e) => setPasswordConfirmation(e.target.value)} 
                  placeholder="Ketik ulang password baru"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-11 pr-11 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors font-mono"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || message.type === 'success'} 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold py-3.5 rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-xs transition-colors mt-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Pulihkan Akun</>}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}