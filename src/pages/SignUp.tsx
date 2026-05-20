import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const TOPIC_OPTIONS = [
    { id: 'anime', label: 'Anime' },
    { id: 'shonen', label: 'Shonen' },
    { id: 'romance', label: 'Romance' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'slice of life', label: 'Slice of Life' },
    { id: 'mecha', label: 'Mecha' },
    { id: 'cyberpunk', label: 'Cyberpunk' },
  ];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    category: 'anime',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [agreed, setAgreed] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else {
      const age = parseInt(formData.age, 10);
      if (isNaN(age)) {
        newErrors.age = 'Please enter a valid age';
      } else if (age < 13 || age > 150) {
        newErrors.age = 'You must be at least 13 years old';
      }
    }
    if (!agreed) {
      newErrors.agreed = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors(prev => ({ ...prev, submit: '' }));

    const result = await signup(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      formData.category
    );

    if (result.error) {
      setErrors({ submit: result.error });
      setIsLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleSocialSignUp = (provider: string) => {
    console.log(`Signing up with ${provider}`);
    // TODO: Implement social signup with Supabase (OAuth)
  };

  return (
    <div className="min-h-screen bg-anime-bg/80 fixed inset-0 flex items-center justify-center z-[1000] backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-anime-surface rounded-[32px] w-full max-w-[484px] p-8 md:p-14 text-center relative shadow-2xl animate-in zoom-in-95 duration-200 my-auto border border-anime-border">

        {/* Pinterest Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto select-none" />
        </div>

        <h1 className="text-3xl font-semibold mb-2 text-[var(--ui-accent-strong)]">Sign up to get started</h1>
        <p className="text-[var(--ui-accent-strong)] opacity-80 mb-8">Find new ideas to try</p>

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm" role="alert">
            {errors.submit}
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          {/* First Name */}
          <div className="text-left">
            <label htmlFor="firstName" className="ml-2 text-sm font-medium text-[var(--ui-accent-strong)]">First name</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full bg-anime-bg text-anime-text border rounded-2xl px-4 py-3 focus:outline-none transition-shadow placeholder:text-gray-400 ${errors.firstName ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-anime-border focus:ring-2 focus:ring-anime-primary'
                }`}
              disabled={isLoading}
            />
            {errors.firstName && (
              <div className="flex items-center gap-1 mt-1 ml-2 text-red-600 text-xs" role="alert">
                <AlertCircle size={14} />
                {errors.firstName}
              </div>
            )}
          </div>

          {/* Last Name */}
          <div className="text-left">
            <label htmlFor="lastName" className="ml-2 text-sm font-medium text-[var(--ui-accent-strong)]">Last name</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full bg-anime-bg text-anime-text border rounded-2xl px-4 py-3 focus:outline-none transition-shadow placeholder:text-gray-400 ${errors.lastName ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-anime-border focus:ring-2 focus:ring-anime-primary'
                }`}
              disabled={isLoading}
            />
            {errors.lastName && (
              <div className="flex items-center gap-1 mt-1 ml-2 text-red-600 text-xs" role="alert">
                <AlertCircle size={14} />
                {errors.lastName}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="text-left">
            <label htmlFor="email" className="ml-2 text-sm font-medium text-[var(--ui-accent-strong)]">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className={`w-full bg-anime-bg text-anime-text border rounded-2xl px-4 py-3 focus:outline-none transition-shadow placeholder:text-gray-400 ${errors.email ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-anime-border focus:ring-2 focus:ring-anime-primary'
                }`}
              disabled={isLoading}
            />
            {errors.email && (
              <div className="flex items-center gap-1 mt-1 ml-2 text-red-600 text-xs" role="alert">
                <AlertCircle size={14} />
                {errors.email}
              </div>
            )}
          </div>

          {/* Age */}
          <div className="text-left">
            <label htmlFor="age" className="ml-2 text-sm font-medium text-[var(--ui-accent-strong)]">Age</label>
            <input
              id="age"
              type="number"
              name="age"
              placeholder="18"
              value={formData.age}
              onChange={handleChange}
              className={`w-full bg-anime-bg text-anime-text border rounded-2xl px-4 py-3 focus:outline-none transition-shadow placeholder:text-gray-400 ${errors.age ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-anime-border focus:ring-2 focus:ring-anime-primary'
                }`}
              disabled={isLoading}
              min="18"
              max="150"
            />
            {errors.age && (
              <div className="flex items-center gap-1 mt-1 ml-2 text-red-600 text-xs" role="alert">
                <AlertCircle size={14} />
                {errors.age}
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div className="text-left">
            <label htmlFor="category" className="ml-2 text-sm font-medium text-[var(--ui-accent-strong)]">Favorite Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-anime-bg text-anime-text border border-anime-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-anime-primary transition-shadow"
              disabled={isLoading}
            >
              {TOPIC_OPTIONS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.label}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div className="text-left">
            <label htmlFor="password" className="ml-2 text-sm font-medium text-[var(--ui-accent-strong)]">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                className={`w-full bg-anime-bg text-anime-text border rounded-2xl px-4 py-3 focus:outline-none transition-shadow placeholder:text-gray-400 ${errors.password ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-anime-border focus:ring-2 focus:ring-anime-primary'
                  }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 rounded"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <div className="flex items-center gap-1 mt-1 ml-2 text-red-600 text-xs" role="alert">
                <AlertCircle size={14} />
                {errors.password}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="text-left">
            <label htmlFor="confirmPassword" className="ml-2 text-sm font-medium text-[var(--ui-accent-strong)]">Confirm password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className={`w-full bg-anime-bg text-anime-text border rounded-2xl px-4 py-3 focus:outline-none transition-shadow placeholder:text-gray-400 ${errors.confirmPassword ? 'border-red-500 focus:ring-2 focus:ring-red-500' : 'border-anime-border focus:ring-2 focus:ring-anime-primary'
                  }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 rounded"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="flex items-center gap-1 mt-1 ml-2 text-red-600 text-xs" role="alert">
                <AlertCircle size={14} />
                {errors.confirmPassword}
              </div>
            )}
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-2 mt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (e.target.checked && errors.agreed) {
                  setErrors(prev => ({
                    ...prev,
                    agreed: ''
                  }));
                }
              }}
              className="mt-1 cursor-pointer"
              disabled={isLoading}
            />
            <label htmlFor="terms" className="text-xs text-[var(--ui-accent-strong)] opacity-80 cursor-pointer">
              I agree to Pinterest's <Link to="/terms" className="font-semibold hover:underline">Terms of Service</Link> and acknowledge that I've read the <Link to="/privacy" className="font-semibold hover:underline">Privacy Policy</Link>
            </label>
          </div>
          {errors.agreed && (
            <div className="flex items-center gap-1 ml-2 text-red-600 text-xs" role="alert">
              <AlertCircle size={14} />
              {errors.agreed}
            </div>
          )}

          {/* Sign Up Button */}
          <button
            type="submit"
            className="w-full bg-anime-primary text-white font-bold rounded-full py-3 transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-anime-border"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-anime-surface text-[var(--ui-accent-strong)] opacity-80">OR</span></div>
        </div>

        {/* Social Sign Up Buttons */}
        <button
          type="button"
          onClick={() => handleSocialSignUp('Facebook')}
          className="w-full bg-anime-bg border border-anime-border rounded-full py-3 font-semibold text-[var(--ui-accent-strong)] transition-colors mb-3 flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-anime-primary"
          disabled={isLoading}
        >
          <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
          Sign up with Facebook
        </button>

        <button
          type="button"
          onClick={() => handleSocialSignUp('Google')}
          className="w-full bg-anime-bg border border-anime-border rounded-full py-3 font-semibold text-[var(--ui-accent-strong)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-anime-primary"
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
          Sign up with Google
        </button>

        {/* Sign In Link */}
        <div className="mt-6 text-sm text-[var(--ui-accent-strong)]">
          <span className="opacity-80">Already a member? </span>
          <Link to="/login" className="font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
