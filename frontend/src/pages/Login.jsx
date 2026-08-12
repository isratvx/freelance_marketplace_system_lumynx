import { useState } from 'react';

import {
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';

import API from '../api';

export default function Login() {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const { data } = await API.post(
        '/auth/login',
        form
      );

      localStorage.setItem(
        'token',
        data.token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      );

      window.dispatchEvent(
        new Event('auth-change')
      );

      navigate(
        location.state?.from ||
          (
            data.user.role === 'admin'
              ? '/admin'
              : '/dashboard'
          ),
        {
          replace: true
        }
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to login. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-150px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md glass-panel p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-purple-300/20 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-xl font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.35)]">
            l
          </div>

          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-purple-300">
            Welcome to lumynx
          </p>

          <h1 className="neon-title text-3xl font-black">
            Welcome back
          </h1>

          <p className="mt-3 text-sm text-[#a995b8]">
            Build. Hire. Grow.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-[#ded1ea]"
              htmlFor="email"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({
                  ...form,
                  email: event.target.value
                })
              }
              placeholder="you@example.com"
              className="input-lumynx"
              required
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                className="block text-sm font-semibold text-[#ded1ea]"
                htmlFor="password"
              >
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-purple-300 transition hover:text-fuchsia-300"
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({
                  ...form,
                  password: event.target.value
                })
              }
              placeholder="Enter your password"
              className="input-lumynx"
              required
              minLength={6}
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="btn-neon w-full"
          >
            {loading
              ? 'Logging in...'
              : 'Login to lumynx'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />

          <span className="text-xs uppercase tracking-widest text-[#7f6c8d]">
            New here?
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        <p className="text-center text-sm text-[#a995b8]">
          No account yet?{' '}

          <Link
            to="/register"
            className="font-bold text-purple-300 transition hover:text-fuchsia-300"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}