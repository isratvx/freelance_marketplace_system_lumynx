import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (event) => {
    event.preventDefault();

    setError('');
    setMessage('');
    setResetToken('');
    setLoading(true);

    try {
      const { data } = await API.post(
        '/auth/forgot-password',
        { email }
      );

      setMessage(data.message);
      setResetToken(data.resetToken || '');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not request password reset.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-150px)] flex items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-md p-8 md:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-purple-300/20 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-xl font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.35)]">
            ?
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
            Account recovery
          </p>

          <h1 className="neon-title text-3xl font-black">
            Forgot password
          </h1>

          <p className="mt-3 text-sm text-[#a995b8]">
            Generate a temporary reset token for your lumynx account.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <p>{message}</p>

            {resetToken && (
              <>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Demo reset token
                </p>

                <div className="mt-2 break-all rounded-xl border border-white/10 bg-black/20 p-3 font-mono text-xs text-[#ded1ea]">
                  {resetToken}
                </div>

                <Link
                  to="/reset-password"
                  state={{ resetToken }}
                  className="mt-4 inline-flex font-semibold text-purple-300 transition hover:text-fuchsia-300"
                >
                  Continue to reset password →
                </Link>
              </>
            )}
          </div>
        )}

        <form
          onSubmit={handleRequest}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="forgot-email"
              className="mb-2 block text-sm font-semibold text-[#ded1ea]"
            >
              Registered email
            </label>

            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              className="input-lumynx"
              required
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="btn-neon w-full"
          >
            {loading
              ? 'Generating...'
              : 'Generate Reset Token'}
          </button>
        </form>

        <div className="my-6 h-px bg-white/10" />

        <p className="text-center text-sm text-[#a995b8]">
          Remember your password?{' '}
          <Link
            to="/login"
            className="font-bold text-purple-300 transition hover:text-fuchsia-300"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}