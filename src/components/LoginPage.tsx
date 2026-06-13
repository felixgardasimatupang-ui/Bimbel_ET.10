import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGoogleClientId } from '../config';
import {
  GraduationCap,
  Users,
  BookOpen,
  ShieldCheck,
  BarChart3,
  Bell,
  ArrowRight,
  Mail,
  Lock,
  Loader2,
} from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          cancel: () => void;
          prompt: () => void;
        };
      };
    };
  }
}

const features = [
  { icon: Users, label: 'Manajemen Siswa', desc: 'Data akademik & absensi terpusat' },
  { icon: GraduationCap, label: 'Kelola Pengajar', desc: 'Jadwal & evaluasi kinerja' },
  { icon: BarChart3, label: 'SPP & Keuangan', desc: 'Tracking pembayaran real-time' },
  { icon: BookOpen, label: 'Materi Belajar', desc: 'Modul & quiz interaktif' },
  { icon: ShieldCheck, label: 'Hak Akses', desc: 'Role-based control (RBAC)' },
  { icon: Bell, label: 'Notifikasi', desc: 'Pengingat otomatis SPP & ujian' },
];

function GoogleLogo() {
  return (
    <svg
      className="w-[18px] h-[18px]"
      viewBox="0 0 18 18"
      fill="none"
      data-testid="google-logo"
    >
      <path d="M17.64 9.2c0-.637-.057-1.251-.163-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    if (!getGoogleClientId()) return;

    const start = () => {
      if (!window.google) return;
      try {
        window.google.accounts.id.initialize({
          client_id: getGoogleClientId()!,
          callback: async (response) => {
            setGoogleLoading(true);
            setError('');
            const result = await googleLogin(response.credential);
            setGoogleLoading(false);
            if (!result.success) {
              setError(result.error || 'Gagal login dengan Google');
            }
          },
          cancel_on_tap_outside: false,
        });
        setGoogleReady(true);
      } catch (e) {
        console.error('Google init failed:', e);
        setError('Gagal memuat Google Sign-In. Coba refresh halaman.');
      }
    };

    if (window.google) {
      start();
    } else {
      const id = setInterval(() => {
        if (window.google) {
          clearInterval(id);
          start();
        }
      }, 100);
      const timeout = setTimeout(() => {
        clearInterval(id);
        setError('Google Sign-In tidak tersedia. Periksa koneksi atau coba browser lain.');
      }, 10000);
      return () => { clearInterval(id); clearTimeout(timeout); };
    }
  }, [googleLogin]);

  const handleGoogleClick = useCallback(() => {
    if (!window.google?.accounts || !googleReady) {
      setError('Google Sign-In belum siap. Muat ulang halaman.');
      return;
    }
    setGoogleLoading(true);
    setError('');
    window.google.accounts.id.prompt();
  }, [googleReady]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Login gagal');
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />

      {/* Geometric pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating gradient orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative w-full flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* ===== LEFT: Brand & Features ===== */}
          <div className="hidden lg:block space-y-10">
            {/* Logo & tagline */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <span className="text-white font-bold text-lg">EB</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">EduAdmin</h1>
                  <p className="text-sm text-slate-400">Bimbel Management System</p>
                </div>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed max-w-md">
                Platform manajemen bimbel terpadu untuk mengelola siswa, pengajar, keuangan, dan materi belajar dalam satu ekosistem.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="group flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <f.icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{f.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust indicator */}
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Aman & Terenkripsi</span>
              </div>
              <div className="w-px h-3 bg-slate-700" />
              <span className="text-slate-500">© 2026 EduAdmin</span>
            </div>
          </div>

          {/* ===== RIGHT: Login Card ===== */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="relative">
              {/* Card glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl" />

              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-slate-200/80">
                {/* Mobile logo (visible only on small screens) */}
                <div className="lg:hidden flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <span className="text-white font-bold">EB</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">EduAdmin Bimbel</h2>
                    <p className="text-xs text-slate-400">Sistem Manajemen Terpadu</p>
                  </div>
                </div>

                {/* Form header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Selamat Datang</h2>
                  <p className="text-sm text-slate-500 mt-1">Masuk ke dashboard manajemen Anda</p>
                </div>

                {/* Error alert */}
                {error && (
                  <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3.5" role="alert">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Login form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:shadow-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        Masuk
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Google Sign-In */}
                {getGoogleClientId() && googleReady && (
                  <div className="mt-6">
                    <div className="relative mb-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-slate-400 font-medium">atau masuk dengan</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleClick}
                      disabled={googleLoading}
                      className="w-full flex items-center justify-center gap-3 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 transition-all duration-200"
                    >
                      {googleLoading ? (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      ) : (
                        <GoogleLogo />
                      )}
                      {googleLoading ? 'Memproses...' : 'Lanjutkan dengan Google'}
                    </button>
                  </div>
                )}

                {/* Footer */}
                <p className="mt-6 text-[10px] text-slate-400 text-center leading-relaxed">
                  Dengan masuk, Anda menyetujui{' '}
                  <span className="text-slate-500 underline underline-offset-2 cursor-pointer hover:text-slate-700 transition-colors">Ketentuan Layanan</span>{' '}
                  dan{' '}
                  <span className="text-slate-500 underline underline-offset-2 cursor-pointer hover:text-slate-700 transition-colors">Kebijakan Privasi</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
