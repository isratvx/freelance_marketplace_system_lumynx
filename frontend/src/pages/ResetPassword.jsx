import { useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';
import API from '../api';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [resetToken, setResetToken] =
    useState(
      location.state?.resetToken || ''
    );

  const [newPassword, setNewPassword] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword
  ] = useState('');

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const handleReset = async (event) => {
    event.preventDefault();

    setError('');
    setMessage('');

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        'Passwords do not match.'
      );

      return;
    }

    setLoading(true);

    try {
      const { data } = await API.post(
        '/auth/reset-password',
        {
          resetToken,
          newPassword
        }
      );

      setMessage(data.message);

      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not reset password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-150px)] flex items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-md p-8 md:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-fuchsia-300/20 bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-500 text-xl font-black text-white shadow-[0_0_30px_rgba(217,70,239,0.3)]">
            R
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
            Secure your account
          </p>

          <h1 className="neon-title text-3xl font-black">
            Reset password
          </h1>

          <p className="mt-3 text-sm text-[#a995b8]">
            Enter your reset token and choose a new password.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {message}
          </div>
        )}

        <form
          onSubmit={handleReset}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="reset-token"
              className="mb-2 block text-sm font-semibold text-[#ded1ea]"
            >
              Reset token
            </label>

            <input
              id="reset-token"
              type="text"
              value={resetToken}
              onChange={(event) =>
                setResetToken(
                  event.target.value
                )
              }
              placeholder="Paste your reset token"
              className="input-lumynx font-mono text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-semibold text-[#ded1ea]"
            >
              New password
            </label>

            <input
              id="new-password"
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value
                )
              }
              placeholder="At least 6 characters"
              className="input-lumynx"
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirm-new-password"
              className="mb-2 block text-sm font-semibold text-[#ded1ea]"
            >
              Confirm new password
            </label>

            <input
              id="confirm-new-password"
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Repeat new password"
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
              ? 'Resetting...'
              : 'Reset Password'}
          </button>
        </form>

        <div className="my-6 h-px bg-white/10" />

        <p className="text-center text-sm text-[#a995b8]">
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