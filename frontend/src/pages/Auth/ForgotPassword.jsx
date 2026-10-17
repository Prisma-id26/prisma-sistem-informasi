import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '../../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); 
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Prisma Group - Lupa Password";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/forgot-password', { email });
      setMessage({ type: 'success', text: response.data.message || 'Link reset password telah dikirim ke email Anda.' });
    } catch (err) {
      if (err.response && err.response.data.message) {
        setMessage({ type: 'error', text: err.response.data.message });
      } else {
        setMessage({ type: 'error', text: 'Gagal terhubung ke server. Silakan coba lagi nanti.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Side Visual Section - Branding PRISMA GROUP */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-white dark:bg-slate-800 flex-col justify-between p-12 overflow-hidden border-r border-slate-200 dark:border-slate-700/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:opacity-20 transition-colors" />

        <div className="relative z-10 flex items-center gap-3">
          {/* LOGO: Switch otomatis berdasarkan Dark Mode */}
          <img 
            src="/PRISMA.PNG" 
            alt="Prisma Group Logo Light" 
            className="h-12 w-auto object-contain drop-shadow-sm dark:hidden" 
          />
          <img 
            src="/PRISMA_NEGATIF.PNG" 
            alt="Prisma Group Logo Dark" 
            className="h-12 w-auto object-contain drop-shadow-sm hidden dark:block" 
          />
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-wide">PRISMA GROUP</h1>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-500">Konsultan Teknik Konstruksi</p>
          </div>
        </div>

        <div className="relative z-10 space-y-4 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4" /> Sistem Manajemen Proyek Terpadu
          </div>
          
          <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">
            Pemulihan Akses Keamanan Akun
          </h2>
          
          <p className="text-amber-600 dark:text-amber-500 text-sm max-w-md leading-relaxed font-semibold">
            Privasi dan keamanan data Anda adalah prioritas utama. Gunakan email yang terdaftar untuk mengatur ulang kata sandi Anda dengan aman.
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

          <button 
            onClick={() => navigate('/login')} 
            className="absolute top-6 left-6 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
            title="Kembali ke Login"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center space-y-2 pt-6">
            <div className="lg:hidden flex justify-center mb-4">
               {/* LOGO MOBILE: Switch otomatis berdasarkan Dark Mode */}
               <img src="/PRISMA.PNG" alt="Prisma Group Logo Light" className="h-14 w-auto object-contain drop-shadow-sm dark:hidden" />
               <img src="/PRISMA_NEGATIF.PNG" alt="Prisma Group Logo Dark" className="h-14 w-auto object-contain drop-shadow-sm hidden dark:block" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Lupa Password?</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Masukkan alamat email Anda untuk menerima tautan reset kata sandi.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Terdaftar</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="email@perusahaan.com"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-11 pr-4 py-3 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold py-3.5 rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-xs transition-colors mt-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" /> : 'Kirim Link Reset'}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}