import { useState } from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import API from '../api';

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client'
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');
    setError('');

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role
      };

      const { data } = await API.post(
        '/auth/register',
        payload
      );

      setMessage(data.message);

      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Registration failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-150px)] flex items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="glass-panel w-full max-w-lg p-8 md:p-10"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-fuchsia-300/20 bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-500 text-xl font-black text-white shadow-[0_0_30px_rgba(217,70,239,0.3)]">
            l
          </div>

          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-purple-300">
            Join lumynx
          </p>

          <h1 className="neon-title text-3xl font-black">
            Create your account
          </h1>

          <p className="mt-3 text-sm text-[#a995b8]">
            Connect with talent, projects and new opportunities.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-[#ded1ea]"
              htmlFor="full_name"
            >
              Full name
            </label>

            <input
              id="full_name"
              name="full_name"
              value={form.full_name}
              onChange={(event) =>
                setForm({
                  ...form,
                  full_name:
                    event.target.value
                })
              }
              placeholder="Enter your full name"
              required
              className="input-lumynx"
            />
          </div>

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
              required
              className="input-lumynx"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-[#ded1ea]"
                htmlFor="password"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                minLength={6}
                value={form.password}
                onChange={(event) =>
                  setForm({
                    ...form,
                    password:
                      event.target.value
                  })
                }
                placeholder="At least 6 characters"
                required
                className="input-lumynx"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-semibold text-[#ded1ea]"
                htmlFor="confirmPassword"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                minLength={6}
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm({
                    ...form,
                    confirmPassword:
                      event.target.value
                  })
                }
                placeholder="Repeat password"
                required
                className="input-lumynx"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#ded1ea]">
              Account type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    role: 'client'
                  })
                }
                className={`rounded-xl border p-4 text-left transition ${
                  form.role === 'client'
                    ? 'border-purple-400/60 bg-purple-500/15 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-purple-400/30'
                }`}
              >
                <p className="font-bold text-white">
                  Client
                </p>

                <p className="mt-1 text-xs text-[#a995b8]">
                  Hire freelancers and manage projects
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    role: 'freelancer'
                  })
                }
                className={`rounded-xl border p-4 text-left transition ${
                  form.role === 'freelancer'
                    ? 'border-fuchsia-400/60 bg-fuchsia-500/15 shadow-[0_0_20px_rgba(217,70,239,0.15)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-fuchsia-400/30'
                }`}
              >
                <p className="font-bold text-white">
                  Freelancer
                </p>

                <p className="mt-1 text-xs text-[#a995b8]">
                  Find projects and grow your career
                </p>
              </button>
            </div>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="btn-neon mt-7 w-full"
        >
          {loading
            ? 'Creating account...'
            : 'Create lumynx account'}
        </button>

        <p className="mt-6 text-center text-sm text-[#a995b8]">
          Already registered?{' '}

          <Link
            to="/login"
            className="font-bold text-purple-300 transition hover:text-fuchsia-300"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}