import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams
} from 'react-router-dom';

export default function SubmitProposal() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    cover_letter: '',
    bid_amount: '',
    delivery_time: ''
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchJob = async () => {
      try {
        setLoadingJob(true);
        setError('');

     const res = await fetch(
  `http://localhost:5000/api/jobs/${jobId}?t=${Date.now()}`,
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  }
);

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message ||
              'Failed to load job'
          );
        }

        setJob(data.job);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
  }, [jobId, token, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(
        'http://localhost:5000/api/proposals',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            job_id: Number(jobId),
            cover_letter:
              form.cover_letter.trim(),
            bid_amount: Number(
              form.bid_amount
            ),
            delivery_time: Number(
              form.delivery_time
            )
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.message ||
            'Failed to submit proposal'
        );
        return;
      }

      alert(
        'Proposal submitted successfully'
      );

      navigate('/my-proposals');
    } catch (err) {
      console.error(
        'Submit Proposal Error:',
        err
      );

      alert(
        'Server error. Make sure the backend is running.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-purple-400/30 border-t-fuchsia-400" />

          <p className="text-[#a995b8]">
            Loading job...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lumynx-container">
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="lumynx-container">

      {/* PAGE HEADER */}
      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.26em] text-purple-300">
          Freelancer proposal
        </p>

        <h1 className="neon-title text-3xl font-black">
          Submit Your Proposal
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a995b8]">
          Review the project details and send your best offer to the client.
        </p>
      </div>

      {/* PROJECT DETAILS */}
      <section className="glass-panel mb-7 overflow-hidden p-6 md:p-7">

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

          <div className="min-w-0">

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">
              Project details
            </p>

            <h2 className="text-2xl font-bold text-white">
              {job?.title}
            </h2>

            {/* CLIENT EMAIL */}
            <p className="mt-2 text-sm text-[#a995b8]">
              Client Email:{' '}
              <span className="font-semibold text-purple-200">
                {job?.client_email ||
                  'Not available'}
              </span>
            </p>

            <div className="mt-4 flex flex-wrap gap-3">

              <span className="status-lumynx border-purple-400/20 bg-purple-500/10 text-purple-200">
                {job?.category_name ||
                  'Uncategorized'}
              </span>

              <span className="status-lumynx border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                Budget: $
                {Number(
                  job?.budget || 0
                ).toFixed(2)}
              </span>

              <span className="status-lumynx border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
                {job?.status
                  ? job.status
                      .replace('_', ' ')
                      .replace(
                        /\b\w/g,
                        (letter) =>
                          letter.toUpperCase()
                      )
                  : 'Unknown'}
              </span>

            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="glass-card mt-6 p-5">

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
            Description
          </p>

          <p className="mt-3 whitespace-pre-wrap leading-7 text-[#bba9c7]">
            {job?.description ||
              'No description provided.'}
          </p>

        </div>

      </section>

      {/* PROPOSAL FORM */}
      <section className="glass-panel p-6 md:p-7">

        <div className="mb-6">

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">
            Your offer
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Proposal Details
          </h2>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* COVER LETTER */}
          <div>

            <label
              htmlFor="cover_letter"
              className="mb-2 block text-sm font-semibold text-[#ded1ea]"
            >
              Cover Letter
            </label>

            <textarea
              id="cover_letter"
              name="cover_letter"
              rows="6"
              placeholder="Explain your experience, how you will complete the work, and why you are a good fit."
              value={form.cover_letter}
              onChange={handleChange}
              required
              minLength={20}
              className="input-lumynx min-h-[170px] resize-y"
            />

            <p className="mt-2 text-xs text-[#806f8d]">
              Minimum 20 characters
            </p>

          </div>

          {/* BID + DELIVERY */}
          <div className="grid gap-5 md:grid-cols-2">

            <div>

              <label
                htmlFor="bid_amount"
                className="mb-2 block text-sm font-semibold text-[#ded1ea]"
              >
                Bid Amount ($)
              </label>

              <div className="relative">

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-purple-300">
                  $
                </span>

                <input
                  id="bid_amount"
                  type="number"
                  name="bid_amount"
                  step="0.01"
                  min="1"
                  placeholder="Enter your bid"
                  value={form.bid_amount}
                  onChange={handleChange}
                  required
                  className="input-lumynx pl-9"
                />

              </div>
            </div>

            <div>

              <label
                htmlFor="delivery_time"
                className="mb-2 block text-sm font-semibold text-[#ded1ea]"
              >
                Delivery Time
              </label>

              <div className="relative">

                <input
                  id="delivery_time"
                  type="number"
                  name="delivery_time"
                  min="1"
                  step="1"
                  placeholder="Number of days"
                  value={form.delivery_time}
                  onChange={handleChange}
                  required
                  className="input-lumynx pr-16"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#806f8d]">
                  days
                </span>

              </div>
            </div>

          </div>

          {/* INFO */}
          <div className="rounded-xl border border-purple-400/15 bg-purple-500/[0.06] p-4">

            <p className="text-sm leading-6 text-[#a995b8]">
              Make sure your bid and delivery estimate are realistic before sending the proposal.
            </p>

          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={
              submitting ||
              job?.status !== 'open'
            }
            className="btn-neon w-full"
          >
            {submitting
              ? 'Sending Proposal...'
              : job?.status !== 'open'
                ? 'Job No Longer Open'
                : 'Send Proposal'}
          </button>

        </form>
      </section>

    </div>
  );
}