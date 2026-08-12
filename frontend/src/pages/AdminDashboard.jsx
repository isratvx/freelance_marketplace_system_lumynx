import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [proposals, setProposals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');

  const endpoints = {
    stats: '/api/admin/stats',
    users: '/api/admin/users',
    jobs: '/api/admin/jobs',
    proposals: '/api/admin/proposals'
  };

  const loadData = async (tab) => {
    if (!token) {
      setError('Please log in as an administrator');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch(
        `http://localhost:5000${endpoints[tab]}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Failed to load admin data'
        );
      }

      if (tab === 'stats') {
        setStats(data.stats);
      }

      if (tab === 'users') {
        setUsers(data.users || []);
      }

      if (tab === 'jobs') {
        setJobs(data.jobs || []);
      }

      if (tab === 'proposals') {
        setProposals(data.proposals || []);
      }
    } catch (err) {
      console.error('Admin Data Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, token]);

  const toggleSuspend = async (
    userId,
    currentStatus
  ) => {
    const action = currentStatus
      ? 'unsuspend'
      : 'suspend';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this user?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(userId);

      const res = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/suspend`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            is_suspended: !Boolean(currentStatus)
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Failed to update user'
        );
      }

      alert(data.message);

      await loadData('users');
    } catch (err) {
      console.error('Suspension Error:', err);
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const deleteJob = async (jobId) => {
    const confirmed = window.confirm(
      'Permanently delete this job? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(jobId);

      const res = await fetch(
        `http://localhost:5000/api/admin/jobs/${jobId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Failed to delete job'
        );
      }

      alert(data.message);

      await loadData('jobs');
    } catch (err) {
      console.error('Delete Job Error:', err);
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const formatStatus = (status) => {
    if (!status) {
      return 'Unknown';
    }

    return status
      .replace('_', ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getStatusClasses = (status) => {
    if (
      status === 'accepted' ||
      status === 'completed' ||
      status === 'active'
    ) {
      return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200';
    }

    if (
      status === 'rejected' ||
      status === 'closed' ||
      status === 'suspended'
    ) {
      return 'border-rose-400/25 bg-rose-500/10 text-rose-200';
    }

    if (status === 'in_progress') {
      return 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200';
    }

    return 'border-amber-400/25 bg-amber-500/10 text-amber-200';
  };

  const statCards = stats
    ? [
        {
          label: 'Total Users',
          value: stats.total_users,
          symbol: 'U',
          accent:
            'from-violet-600 to-purple-500'
        },
        {
          label: 'Freelancers',
          value: stats.total_freelancers,
          symbol: 'F',
          accent:
            'from-purple-600 to-fuchsia-500'
        },
        {
          label: 'Clients',
          value: stats.total_clients,
          symbol: 'C',
          accent:
            'from-indigo-600 to-violet-500'
        },
        {
          label: 'Suspended Users',
          value: stats.suspended_users,
          symbol: 'S',
          accent:
            'from-rose-600 to-pink-500'
        },
        {
          label: 'Total Jobs',
          value: stats.total_jobs,
          symbol: 'J',
          accent:
            'from-cyan-600 to-violet-500'
        },
        {
          label: 'Open Jobs',
          value: stats.open_jobs,
          symbol: 'O',
          accent:
            'from-emerald-600 to-cyan-500'
        },
        {
          label: 'Jobs in Progress',
          value: stats.in_progress_jobs,
          symbol: 'I',
          accent:
            'from-blue-600 to-cyan-500'
        },
        
        {
           label: 'Completed Jobs',
          value: stats.completed_jobs,
          symbol: '✓',
          accent:
            'from-emerald-600 to-green-500'
          }, 
        {
          label: 'Total Proposals',
          value: stats.total_proposals,
          symbol: 'P',
          accent:
            'from-fuchsia-600 to-purple-500'
        },
        {
          label: 'Pending Proposals',
          value: stats.pending_proposals,
          symbol: '…',
          accent:
            'from-amber-500 to-orange-500'
        },
        {
          label: 'Accepted Proposals',
          value: stats.accepted_proposals,
          symbol: 'A',
          accent:
            'from-emerald-600 to-cyan-500'
        },
        
      ]
    : [];

  const tabs = [
    ['stats', 'Statistics'],
    ['users', 'Users'],
    ['jobs', 'Jobs'],
    ['proposals', 'Proposals']
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-purple-400/30 border-t-fuchsia-400" />

          <p className="text-[#a995b8]">
            Loading admin data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lumynx-container">
      <section className="glass-panel relative mb-7 overflow-hidden p-7 md:p-9">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.26em] text-purple-300">
            Administration
          </p>

          <h1 className="neon-title text-3xl font-black md:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a995b8]">
            Manage users, jobs, proposals and marketplace
            activity from one central control panel.
          </p>
        </div>
      </section>

      <div className="mb-7 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-2">
        {tabs.map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
              activeTab === tab
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-[0_0_24px_rgba(168,85,247,0.2)]'
                : 'text-[#a995b8] hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {statCards.map((card) => (
            <article
              key={card.label}
              className="glass-card group p-5"
            >
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${card.accent} font-black text-white shadow-[0_0_24px_rgba(168,85,247,0.18)] transition group-hover:scale-105`}
              >
                {card.symbol}
              </div>

              <p className="mt-5 text-sm font-semibold text-[#a995b8]">
                {card.label}
              </p>

              <p className="mt-2 text-3xl font-black text-white">
                {card.value || 0}
              </p>
            </article>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <section className="glass-panel overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
              Account management
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Users
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[#a995b8]">
                No users found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse">
                <thead>
                  <tr className="bg-white/[0.04]">
                    <th className="border-b border-white/10 p-4 text-left text-xs font-bold uppercase tracking-wider text-[#806f8d]">
                      Name
                    </th>

                    <th className="border-b border-white/10 p-4 text-left text-xs font-bold uppercase tracking-wider text-[#806f8d]">
                      Email
                    </th>

                    <th className="border-b border-white/10 p-4 text-left text-xs font-bold uppercase tracking-wider text-[#806f8d]">
                      Role
                    </th>

                    <th className="border-b border-white/10 p-4 text-left text-xs font-bold uppercase tracking-wider text-[#806f8d]">
                      Joined
                    </th>

                    <th className="border-b border-white/10 p-4 text-left text-xs font-bold uppercase tracking-wider text-[#806f8d]">
                      Status
                    </th>

                    <th className="border-b border-white/10 p-4 text-left text-xs font-bold uppercase tracking-wider text-[#806f8d]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.user_id}
                      className="transition hover:bg-white/[0.035]"
                    >
                      <td className="border-b border-white/[0.07] p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 font-black text-white">
                            {user.full_name
                              ?.trim()
                              ?.charAt(0)
                              ?.toUpperCase() || 'U'}
                          </div>

                          <span className="font-semibold text-white">
                            {user.full_name}
                          </span>
                        </div>
                      </td>

                      <td className="border-b border-white/[0.07] p-4 text-sm text-[#bba9c7]">
                        {user.email}
                      </td>

                      <td className="border-b border-white/[0.07] p-4">
                        <span className="status-lumynx border-purple-400/20 bg-purple-500/10 capitalize text-purple-200">
                          {user.role}
                        </span>
                      </td>

                      <td className="border-b border-white/[0.07] p-4 text-sm text-[#bba9c7]">
                        {new Date(
                          user.created_at
                        ).toLocaleDateString()}
                      </td>

                      <td className="border-b border-white/[0.07] p-4">
                        <span
                          className={`status-lumynx ${getStatusClasses(
                            user.is_suspended
                              ? 'suspended'
                              : 'active'
                          )}`}
                        >
                          {user.is_suspended
                            ? 'Suspended'
                            : 'Active'}
                        </span>
                      </td>

                      <td className="border-b border-white/[0.07] p-4">
                        {user.role === 'admin' ? (
                          <span className="text-sm text-[#806f8d]">
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              toggleSuspend(
                                user.user_id,
                                Boolean(
                                  user.is_suspended
                                )
                              )
                            }
                            disabled={
                              actionId === user.user_id
                            }
                            className={
                              user.is_suspended
                                ? 'inline-flex min-h-[38px] items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50'
                                : 'btn-danger-lumynx min-h-[38px] px-4 py-2 text-sm'
                            }
                          >
                            {actionId === user.user_id
                              ? 'Updating...'
                              : user.is_suspended
                                ? 'Unsuspend'
                                : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'jobs' && (
        <section className="glass-panel overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">
              Marketplace activity
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Jobs
            </h2>
          </div>

          {jobs.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[#a995b8]">
                No jobs found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse">
                <thead>
                  <tr className="bg-white/[0.04]">
                    {[
                      'Job',
                      'Client',
                      'Category',
                      'Budget',
                      'Proposals',
                      'Status',
                      'Action'
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="border-b border-white/10 p-4 text-left text-xs font-bold uppercase tracking-wider text-[#806f8d]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job.job_id}
                      className="transition hover:bg-white/[0.035]"
                    >
                      <td className="border-b border-white/[0.07] p-4">
                        <p className="max-w-[260px] font-semibold text-white">
                          {job.title}
                        </p>
                      </td>

                      <td className="border-b border-white/[0.07] p-4">
                        <p className="font-medium text-[#eadff1]">
                          {job.client_name}
                        </p>

                        <p className="mt-1 text-xs text-[#806f8d]">
                          {job.client_email}
                        </p>
                      </td>

                      <td className="border-b border-white/[0.07] p-4 text-sm text-[#bba9c7]">
                        {job.category_name ||
                          'Uncategorized'}
                      </td>

                      <td className="border-b border-white/[0.07] p-4 font-bold text-white">
                        $
                        {Number(
                          job.budget || 0
                        ).toFixed(2)}
                      </td>

                      <td className="border-b border-white/[0.07] p-4 text-[#bba9c7]">
                        {job.total_proposals || 0}
                      </td>

                      <td className="border-b border-white/[0.07] p-4">
                        <span
                          className={`status-lumynx ${getStatusClasses(
                            job.status
                          )}`}
                        >
                          {formatStatus(job.status)}
                        </span>
                      </td>

                      <td className="border-b border-white/[0.07] p-4">
                        <button
                          type="button"
                          onClick={() =>
                            deleteJob(job.job_id)
                          }
                          disabled={
                            actionId === job.job_id
                          }
                          className="btn-danger-lumynx min-h-[38px] px-4 py-2 text-sm"
                        >
                          {actionId === job.job_id
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'proposals' && (
        <section className="glass-panel overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Proposal activity
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Proposals
            </h2>
          </div>

          {proposals.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[#a995b8]">
                No proposals found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] border-collapse">
                <thead>
                  <tr className="bg-white/[0.04]">
                    {[
                      'Job',
                      'Client',
                      'Freelancer',
                      'Bid',
                      'Delivery',
                      'Status'
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="border-b border-white/10 p-4 text-left text-xs font-bold uppercase tracking-wider text-[#806f8d]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {proposals.map((proposal) => (
                    <tr
                      key={proposal.proposal_id}
                      className="transition hover:bg-white/[0.035]"
                    >
                      <td className="border-b border-white/[0.07] p-4 font-semibold text-white">
                        {proposal.job_title}
                      </td>

                      <td className="border-b border-white/[0.07] p-4 text-[#bba9c7]">
                        {proposal.client_name}
                      </td>

                      <td className="border-b border-white/[0.07] p-4">
                        <p className="font-medium text-[#eadff1]">
                          {proposal.freelancer_name}
                        </p>

                        <p className="mt-1 text-xs text-[#806f8d]">
                          {proposal.freelancer_email}
                        </p>
                      </td>

                      <td className="border-b border-white/[0.07] p-4 font-bold text-white">
                        $
                        {Number(
                          proposal.bid_amount || 0
                        ).toFixed(2)}
                      </td>

                      <td className="border-b border-white/[0.07] p-4 text-[#bba9c7]">
                        {proposal.delivery_time} days
                      </td>

                      <td className="border-b border-white/[0.07] p-4">
                        <span
                          className={`status-lumynx ${getStatusClasses(
                            proposal.status
                          )}`}
                        >
                          {formatStatus(
                            proposal.status
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}