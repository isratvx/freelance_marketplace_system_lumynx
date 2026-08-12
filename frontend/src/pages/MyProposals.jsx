import { useEffect, useState } from 'react';

export default function MyProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('Please log in first');
      setLoading(false);
      return;
    }

    const fetchProposals = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(
          'http://localhost:5000/api/proposals/my',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message ||
              'Failed to load proposals'
          );
        }

        setProposals(data.proposals || []);
      } catch (err) {
        setError(
          `Failed to load proposals: ${err.message}`
        );

        setProposals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [token]);

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
    if (status === 'accepted') {
      return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200';
    }

    if (status === 'rejected') {
      return 'border-rose-400/25 bg-rose-500/10 text-rose-200';
    }

    return 'border-amber-400/25 bg-amber-500/10 text-amber-200';
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-purple-400/30 border-t-fuchsia-400" />

          <p className="text-[#a995b8]">
            Loading your proposals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lumynx-container">
      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.26em] text-purple-300">
          Freelancer workspace
        </p>

        <h1 className="neon-title text-3xl font-black">
          My Submitted Proposals
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a995b8]">
          Track your submitted bids, delivery estimates and
          proposal status in one place.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!error && proposals.length === 0 ? (
        <div className="glass-panel p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-2xl font-black text-purple-300">
            P
          </div>

          <h2 className="mt-5 text-xl font-bold">
            No proposals submitted yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-[#a995b8]">
            Your submitted job proposals will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {proposals.map((proposal) => (
            <article
              key={proposal.proposal_id}
              className="glass-panel overflow-hidden p-6 md:p-7"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">
                      {proposal.title}
                    </h2>

                    <span
                      className={`status-lumynx ${getStatusClasses(
                        proposal.status
                      )}`}
                    >
                      {formatStatus(
                        proposal.status
                      )}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-[#a995b8]">
                    Category:{' '}
                    <span className="text-[#ded1ea]">
                      {proposal.category_name ||
                        'Uncategorized'}
                    </span>
                  </p>
                </div>

                <div className="grid min-w-[240px] gap-3 sm:grid-cols-2 md:grid-cols-1">
                  <div className="glass-card p-4 md:text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#806f8d]">
                      Your bid
                    </p>

                    <p className="mt-2 text-xl font-black text-white">
                      $
                      {Number(
                        proposal.bid_amount || 0
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="glass-card p-4 md:text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#806f8d]">
                      Delivery
                    </p>

                    <p className="mt-2 font-bold text-white">
                      {proposal.delivery_time} days
                    </p>
                  </div>

                  <div className="glass-card p-4 sm:col-span-2 md:col-span-1 md:text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#806f8d]">
                      Job budget
                    </p>

                    <p className="mt-2 font-bold text-white">
                      $
                      {Number(
                        proposal.job_budget || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card mt-6 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
                  Cover Letter
                </p>

                <p className="mt-3 whitespace-pre-wrap leading-7 text-[#bba9c7]">
                  {proposal.cover_letter ||
                    'No cover letter provided.'}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {proposal.status === 'pending' && (
                  <span className="text-sm text-amber-200">
                    Your proposal is waiting for the client’s
                    decision.
                  </span>
                )}

                {proposal.status === 'accepted' && (
                  <span className="text-sm text-emerald-200">
                    Your proposal was accepted.
                  </span>
                )}

                {proposal.status === 'rejected' && (
                  <span className="text-sm text-rose-200">
                    This proposal was not selected.
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}