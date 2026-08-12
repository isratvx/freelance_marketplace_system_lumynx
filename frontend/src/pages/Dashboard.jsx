import {
  useEffect,
  useState
} from 'react';

import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser =
      localStorage.getItem('user');

    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      setUser(
        JSON.parse(storedUser)
      );
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      navigate('/login');
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-purple-400/30 border-t-fuchsia-400" />

          <p className="text-[#a995b8]">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  const roleLabel =
    user.role === 'freelancer'
      ? 'Freelancer'
      : user.role === 'admin'
        ? 'Administrator'
        : 'Client';

  const quickActions = {
    client: [
      {
        title: 'Post a Job',
        description:
          'Share your project requirements and start hiring.',
        route: '/post-job',
        symbol: '+',
        accent:
          'from-violet-600 to-purple-500'
      },

      {
        title: 'My Jobs',
        description:
          'Manage your active, completed and open projects.',
        route: '/my-jobs',
        symbol: 'J',
        accent:
          'from-purple-600 to-fuchsia-500'
      },

      {
        title: 'Received Proposals',
        description:
          'Compare bids and select the right freelancer.',
        route: '/received-proposals',
        symbol: 'P',
        accent:
          'from-fuchsia-600 to-pink-500'
      }
    ],

    freelancer: [
      {
        title: 'Browse Jobs',
        description:
          'Discover available freelance opportunities.',
        route: '/jobs',
        symbol: 'B',
        accent:
          'from-violet-600 to-purple-500'
      },

      {
        title: 'My Proposals',
        description:
          'Track your submitted proposals and their status.',
        route: '/my-proposals',
        symbol: 'P',
        accent:
          'from-purple-600 to-fuchsia-500'
      },

      {
        title: 'My Profile',
        description:
          'View and update your profile information.',
        route: '/profile',
        symbol: 'U',
        accent:
          'from-fuchsia-600 to-pink-500'
      }
    ],

    admin: [
      {
        title: 'Admin Panel',
        description:
          'View users, jobs and system information.',
        route: '/admin',
        symbol: 'A',
        accent:
          'from-rose-600 to-fuchsia-500'
      },

      {
        title: 'My Profile',
        description:
          'View administrator account information.',
        route: '/profile',
        symbol: 'U',
        accent:
          'from-purple-600 to-violet-500'
      }
    ]
  };

  const actions =
    quickActions[user.role] || [];

  const gridClass =
    actions.length === 3
      ? 'md:grid-cols-3'
      : actions.length === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-2 xl:grid-cols-3';

  return (
    <div className="lumynx-container">

      {/* WELCOME SECTION */}
      <section className="glass-panel relative overflow-hidden p-7 md:p-10">

        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.2em] text-purple-300">
                lumynx
              </p>

              <h1 className="neon-title text-3xl font-black md:text-4xl">
                Welcome back,{' '}
                {user.full_name || 'User'}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a995b8] md:text-base">
                Manage your account and access the main
                features of the freelance marketplace.
              </p>
            </div>

            {/* ACCOUNT INFORMATION */}
            <div className="glass-card min-w-[230px] p-4">

              <p className="text-xs font-bold uppercase tracking-widest text-[#8f7a9e]">
                Account Details
              </p>

              <p className="mt-3 truncate font-semibold text-white">
                {user.email}
              </p>

              <div className="mt-3">
                <span className="status-lumynx border-purple-400/20 bg-purple-500/10 text-purple-200">
                  {roleLabel}
                </span>
              </div>

            </div>

          </div>
        </div>
      </section>


      {/* DASHBOARD OPTIONS */}
      <section className="mt-8">

        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia-300">
            Quick Access
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Dashboard Options
          </h2>
        </div>


        <div
          className={`grid grid-cols-1 gap-5 ${gridClass}`}
        >
          {actions.map((action) => (
            <button
              key={action.route}
              type="button"
              onClick={() =>
                navigate(action.route)
              }
              className="glass-card group flex min-h-[190px] flex-col p-5 text-left"
            >

              <div
                className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${action.accent} font-black text-white shadow-[0_0_24px_rgba(168,85,247,0.2)] transition group-hover:scale-105`}
              >
                {action.symbol}
              </div>

              <div className="flex items-center justify-between gap-4">

                <h3 className="text-lg font-bold text-white">
                  {action.title}
                </h3>

                <span className="text-xl text-purple-300 transition group-hover:translate-x-1 group-hover:text-fuchsia-300">
                  →
                </span>

              </div>

              <p className="mt-2 text-sm leading-6 text-[#a995b8]">
                {action.description}
              </p>

            </button>
          ))}
        </div>

      </section>

    </div>
  );
}