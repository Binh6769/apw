import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate inputs
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Sign in with Supabase
    const { error: authError } = await login(email, password);

    if (authError) {
      setError(authError);
      setIsLoading(false);
    } else {
      // Redirect to home page
      navigate('/');
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Logging in with ${provider}`);
    // TODO: Implement social login with Supabase (OAuth)
  };

  return (
    <div className="min-h-screen bg-anime-bg/80 fixed inset-0 flex items-center justify-center z-[1000] backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-anime-surface rounded-[32px] w-full max-w-[484px] p-8 md:p-14 text-center relative shadow-2xl animate-in zoom-in-95 duration-200 my-auto border border-anime-border">

        {/* Pinterest Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto select-none" />
        </div>

        <h1 className="text-3xl font-semibold mb-2 text-[var(--ui-accent-strong)]">Welcome back</h1>
        <p className="text-[var(--ui-accent-strong)] opacity-80 mb-8">Sign in to continue to Pinterest</p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="text-left">
            <label htmlFor="email" className="ml-2 text-sm font-medium text-[var(--ui-accent-strong)]">Email</label>
            <input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-anime-bg text-anime-text border border-anime-border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-anime-primary focus:outline-none transition-shadow placeholder:text-gray-400"
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <div className="text-left">
            <label htmlFor="password" className="ml-2 text-sm font-medium text-[var(--ui-accent-strong)]">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-anime-bg text-anime-text border border-anime-border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-anime-primary focus:outline-none transition-shadow placeholder:text-gray-400"
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Link to="/forgot-password" className="text-xs font-semibold text-[var(--ui-accent-strong)] hover:underline self-start ml-2">
            Forgot your password?
          </Link>

          <button
            type="submit"
            className="w-full bg-anime-primary text-white font-bold rounded-full py-3 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-anime-border"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-anime-surface text-[var(--ui-accent-strong)] opacity-80">OR</span></div>
        </div>

        {/* Social Login Buttons */}
        <button
          type="button"
          onClick={() => handleSocialLogin('Facebook')}
          className="w-full bg-anime-bg border border-anime-border rounded-full py-3 font-semibold text-[var(--ui-accent-strong)] transition-colors mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
          disabled={isLoading}
        >
          <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
          Continue with Facebook
        </button>

        <button
          type="button"
          onClick={() => handleSocialLogin('Google')}
          className="w-full bg-anime-bg border border-anime-border rounded-full py-3 font-semibold text-[var(--ui-accent-strong)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
          Continue with Google
        </button>

        {/* Terms and Privacy */}
        <p className="text-xs text-[var(--ui-accent-strong)] opacity-80 mt-6 px-4">
          By continuing, you agree to Pinterest's <Link to="/terms" className="font-semibold hover:underline">Terms of Service</Link> and acknowledge you've read our <Link to="/privacy" className="font-semibold hover:underline">Privacy Policy</Link>.
        </p>

        {/* Sign Up Link */}
        <div className="mt-6 text-sm text-[var(--ui-accent-strong)]">
          <span className="opacity-80">Don't have an account? </span>
          <Link to="/signup" className="font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
