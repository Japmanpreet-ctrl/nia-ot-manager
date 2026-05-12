import { Eye, EyeOff, Mail, LockKeyhole } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { useUiStore } from '../../store/uiStore';
import campusImage from '../../assets/nia-campus-official.jpg';
import logo from '../../assets/logo.png';

export const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const showToast = useUiStore((state) => state.showToast);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === '1') {
      setNotice('Email verified. You can sign in now.');
    }
  }, []);

  const toggleMode = () => {
    setIsSignUp((current) => !current);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setNotice('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user, verificationActionSettings());
        await auth.signOut();
        setNotice('Verification link sent. Please check your email before logging in.');
        showToast('success', 'Verification link sent to email');
        setIsSignUp(false);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await sendEmailVerification(userCredential.user, verificationActionSettings());
          await auth.signOut();
          setNotice('Your email is not verified yet. I sent a fresh verification link.');
          showToast('success', 'Fresh verification link sent');
          return;
        }
        navigate('/dashboard');
      }
    } catch (err) {
      const message = getAuthErrorMessage(err, isSignUp ? 'Sign up' : 'Login');
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <img src={campusImage} alt="National Institute of Ayurveda Jaipur campus" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-slate-950/20" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/50 via-slate-950/5 to-teal-950/20" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950/55 to-transparent" />

      <div className="relative z-10 flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center gap-4 text-white">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-white/30 sm:h-28 sm:w-28">
            <img src={logo} alt="NIA logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-teal-100">NIA Jaipur</p>
            <p className="text-xl font-bold leading-tight text-white sm:text-2xl">National Institute of Ayurveda</p>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-8">
          <section className="w-full max-w-md">
            <form onSubmit={submit} className="w-full rounded-3xl border border-white/50 bg-white/70 p-7 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
              <h2 className="text-3xl font-bold text-slate-900">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {isSignUp ? 'Register to access Shalyatantra OT Manager' : 'Sign in to Shalyatantra OT Manager'}
              </p>

              <div className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Email</span>
                  <span className="relative block">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12 w-full rounded-xl border border-white/55 bg-white/45 pl-10 pr-4 outline-none transition focus:border-teal-500 focus:bg-white/90 focus:ring-4 focus:ring-teal-100" />
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">Password</span>
                  <span className="relative block">
                    <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} className="h-12 w-full rounded-xl border border-white/55 bg-white/45 pl-10 pr-12 outline-none transition focus:border-teal-500 focus:bg-white/90 focus:ring-4 focus:ring-teal-100" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </span>
                </label>
              </div>

              {notice && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{notice}</p>}
              {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

              <button type="submit" disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 transition">
                {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>

              <div className="mt-5 text-center text-sm text-slate-500">
                {isSignUp ? 'Already have an account?' : 'Need an account?'}
                <button 
                  type="button" 
                  onClick={toggleMode}
                  className="ml-2 font-semibold text-teal-700 hover:underline"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </form>
          </section>
        </main>

        <div className="pb-3 text-center text-xs font-bold uppercase tracking-wide text-white/80 sm:text-left">Shalyatantra OT Department</div>
      </div>
    </div>
  );
};

const verificationActionSettings = () => ({
  url: `${window.location.origin}/login?verified=1`,
  handleCodeInApp: false
});

const getAuthErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : `${fallback} failed`;
  }

  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'This email already has an account. Please sign in.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account exists for this email.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Please check internet and try again.'
  };

  return messages[error.code] || error.message || `${fallback} failed`;
};
