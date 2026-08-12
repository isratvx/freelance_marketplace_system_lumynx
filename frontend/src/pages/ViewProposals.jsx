import { useEffect, useState } from 'react';

export default function ViewProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchProposals = async () => {
    if (!token) {
      setError('Please log in first');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch(
        'http://localhost:5000/api/proposals/client',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Failed to load proposals'
        );
      }

      setProposals(data.proposals || []);
    } catch (err) {
      console.error(
        'Received Proposals Error:',
        err
      );

      setError(err.message);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [token]);

  const updateStatus = async (
    proposalId,
    newStatus
  ) => {
    const action =
      newStatus === 'accepted'
        ? 'accept'
        : 'reject';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this proposal?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(proposalId);

      const res = await fetch(
        `http://localhost:5000/api/proposals/${proposalId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            'Failed to update proposal'
        );
      }

      alert(data.message);

      await fetchProposals();
    } catch (err) {
      console.error(
        'Update Proposal Error:',
        err
      );

      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingId(null);
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
            Loading proposals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lumynx-container">

      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.26em] text-purple-300">
          Client workspace
        </p>

        <h1 className="neon-title text-3xl font-black">
          Proposals Received
        </h1>

        <p className="mt-2 text-sm text-[#a995b8]">
          Review freelancer bids, compare details and choose
          the best match for each project.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!error && proposals.length === 0 ? (
        <div className="glass-panel p-10 text-center">

          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-2xl text-purple-300">
            P
          </div>

          <h2 className="mt-5 text-xl font-bold">
            No proposals received yet
          </h2>

          <p className="mt-2 text-[#a995b8]">
            New freelancer proposals will appear here.
          </p>

        </div>
      ) : (
        <div className="space-y-5">

          {proposals.map((proposal) => {
            const isUpdating =
              updatingId === proposal.proposal_id;

            return (
              <article
                key={proposal.proposal_id}
                className="glass-panel overflow-hidden p-6 md:p-7"
              >

                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="text-2xl font-bold text-white">
                        {proposal.job_title}
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

                    <div className="mt-4 flex items-center gap-4">

                      <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 font-black text-white shadow-[0_0_22px_rgba(168,85,247,0.25)]">
                        {proposal.freelancer_name
                          ?.trim()
                          ?.charAt(0)
                          ?.toUpperCase() || 'F'}
                      </div>

                      <div className="min-w-0">

                        <p className="font-semibold text-white">
                          {proposal.freelancer_name}
                        </p>

                        <p className="break-all text-sm text-[#a995b8]">
                          {proposal.freelancer_email}
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="grid min-w-[230px] gap-3 sm:grid-cols-3 md:grid-cols-1">

                    <div className="glass-card p-4 md:text-right">

                      <p className="text-xs font-bold uppercase tracking-widest text-[#806f8d]">
                        Freelancer bid
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

                    <div className="glass-card p-4 md:text-right">

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

                {proposal.status === 'pending' && (
                  <div className="mt-6 flex flex-wrap gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(
                          proposal.proposal_id,
                          'accepted'
                        )
                      }
                      disabled={isUpdating}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-2 font-bold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating
                        ? 'Updating...'
                        : 'Accept Proposal'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(
                          proposal.proposal_id,
                          'rejected'
                        )
                      }
                      disabled={isUpdating}
                      className="btn-danger-lumynx"
                    >
                      Reject
                    </button>

                  </div>
                )}

              </article>
            );
          })}

        </div>
      )}

    </div>
  );
}