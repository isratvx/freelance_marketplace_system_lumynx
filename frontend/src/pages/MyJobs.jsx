import { useEffect, useState } from 'react';

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [acceptedProposals, setAcceptedProposals] =
    useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingJobId, setEditingJobId] =
    useState(null);
  const [saving, setSaving] = useState(false);
  const [completingJobId, setCompletingJobId] =
    useState(null);


  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    budget: '',
    category_id: '',
    status: 'open'
  });


  const token = localStorage.getItem('token');

  const fetchMyJobs = async () => {
    try {
      const res = await fetch(
        'http://localhost:5000/api/jobs/my-jobs',
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
            'Failed to load jobs'
        );
      }

      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message);
      setJobs([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(
        'http://localhost:5000/api/jobs/categories',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (res.ok) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(
        'Category loading error:',
        err
      );
    }
  };

  const fetchAcceptedProposals = async () => {
    try {
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
          data.message ||
            'Failed to load accepted proposals'
        );
      }

      const acceptedMap = {};

      (data.proposals || []).forEach(
        (proposal) => {
          if (proposal.status === 'accepted') {
            acceptedMap[proposal.job_id] =
              proposal;
          }
        }
      );

      setAcceptedProposals(acceptedMap);
    } catch (err) {
      console.error(
        'Accepted proposals loading error:',
        err
      );

      setAcceptedProposals({});
    }
  };


  const loadPageData = async () => {
    try {
      setLoading(true);
      setError('');

      await Promise.all([
        fetchMyJobs(),
        fetchCategories(),
        fetchAcceptedProposals()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError('Please log in first');
      setLoading(false);
      return;
    }

    loadPageData();
  }, [token]);

  const startEditing = (job) => {
    setEditingJobId(job.job_id);

    setEditForm({
      title: job.title || '',
      description: job.description || '',
      budget: job.budget || '',
      category_id: job.category_id || '',
      status: job.status || 'open'
    });
  };

  const cancelEditing = () => {
    setEditingJobId(null);

    setEditForm({
      title: '',
      description: '',
      budget: '',
      category_id: '',
      status: 'open'
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previousForm) => ({
      ...previousForm,
      [name]: value
    }));
  };

  const handleUpdate = async (jobId) => {
    try {
      setSaving(true);

      const res = await fetch(
        `http://localhost:5000/api/jobs/${jobId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: editForm.title,
            description: editForm.description,
            budget: Number(editForm.budget),
            category_id: Number(
              editForm.category_id
            ),
            status: editForm.status
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            'Failed to update job'
        );
      }

      alert('Job updated successfully');

      cancelEditing();
      await fetchMyJobs();
    } catch (err) {
      console.error('Update error:', err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async (job) => {
    const confirmed = window.confirm(
      'Are you sure this job has been completed?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setCompletingJobId(job.job_id);

      const res = await fetch(
        `http://localhost:5000/api/jobs/${job.job_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: job.title,
            description: job.description,
            budget: Number(job.budget),
            category_id: Number(
              job.category_id
            ),
            status: 'completed'
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            'Failed to complete job'
        );
      }

      alert('Job marked as completed');

      await fetchMyJobs();
    } catch (err) {
      console.error(
        'Complete Job Error:',
        err
      );

      alert(err.message);
    } finally {
      setCompletingJobId(null);
    }
  };


  const handleDelete = async (jobId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this job?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/jobs/${jobId}`,
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
          data.message ||
            'Failed to delete job'
        );
      }

      alert('Job deleted successfully');

      setJobs((previousJobs) =>
        previousJobs.filter(
          (job) => job.job_id !== jobId
        )
      );
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.message);
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
    if (status === 'completed') {
      return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200';
    }

    if (status === 'in_progress') {
      return 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200';
    }

    if (status === 'closed') {
      return 'border-rose-400/25 bg-rose-500/10 text-rose-200';
    }

    return 'border-purple-400/25 bg-purple-500/10 text-purple-200';
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-purple-400/30 border-t-fuchsia-400" />

          <p className="text-[#a995b8]">
            Loading your jobs...
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
          My Posted Jobs
        </h1>

        <p className="mt-2 text-sm text-[#a995b8]">
          Edit projects, track proposals and complete jobs.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="glass-panel p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-purple-500/10 text-2xl text-purple-300">
            +
          </div>

          <h2 className="mt-5 text-xl font-bold">
            No jobs posted yet
          </h2>

          <p className="mt-2 text-[#a995b8]">
            Your posted projects will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {jobs.map((job) => {
            const acceptedProposal =
              acceptedProposals[job.job_id];


            return (
              <article
                key={job.job_id}
                className="glass-panel overflow-hidden p-6 md:p-7"
              >
                {editingJobId ===
                job.job_id ? (
                  <div>
                    <div className="mb-6">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                        Editing project
                      </p>

                      <h2 className="mt-2 text-2xl font-bold">
                        Edit Job
                      </h2>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#ded1ea]">
                          Job Title
                        </label>

                        <input
                          type="text"
                          name="title"
                          value={editForm.title}
                          onChange={
                            handleEditChange
                          }
                          placeholder="Job title"
                          className="input-lumynx"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#ded1ea]">
                          Description
                        </label>

                        <textarea
                          name="description"
                          value={
                            editForm.description
                          }
                          onChange={
                            handleEditChange
                          }
                          placeholder="Job description"
                          rows={5}
                          className="input-lumynx min-h-[150px] resize-y"
                        />
                      </div>

                      <div className="grid gap-5 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#ded1ea]">
                            Budget
                          </label>

                          <input
                            type="number"
                            name="budget"
                            value={
                              editForm.budget
                            }
                            onChange={
                              handleEditChange
                            }
                            min="1"
                            step="0.01"
                            placeholder="Budget"
                            className="input-lumynx"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#ded1ea]">
                            Category
                          </label>

                          <select
                            name="category_id"
                            value={
                              editForm.category_id
                            }
                            onChange={
                              handleEditChange
                            }
                            className="input-lumynx"
                          >
                            <option value="">
                              Select category
                            </option>

                            {categories.map(
                              (category) => (
                                <option
                                  key={
                                    category.category_id
                                  }
                                  value={
                                    category.category_id
                                  }
                                >
                                  {category.name}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[#ded1ea]">
                            Status
                          </label>

                          <select
                            name="status"
                            value={
                              editForm.status
                            }
                            onChange={
                              handleEditChange
                            }
                            className="input-lumynx"
                          >
                            <option value="open">
                              Open
                            </option>

                            <option value="in_progress">
                              In Progress
                            </option>

                            <option value="completed">
                              Completed
                            </option>

                            <option value="closed">
                              Closed
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdate(
                              job.job_id
                            )
                          }
                          disabled={saving}
                          className="btn-neon"
                        >
                          {saving
                            ? 'Saving...'
                            : 'Save Changes'}
                        </button>

                        <button
                          type="button"
                          onClick={
                            cancelEditing
                          }
                          disabled={saving}
                          className="btn-ghost"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-bold">
                            {job.title}
                          </h2>

                          <span
                            className={`status-lumynx ${getStatusClasses(
                              job.status
                            )}`}
                          >
                            {formatStatus(
                              job.status
                            )}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-[#a995b8]">
                          Category:{' '}
                          <span className="text-[#ded1ea]">
                            {job.category_name ||
                              'Not specified'}
                          </span>
                        </p>

                        {acceptedProposal && (
                          <p className="mt-1 text-sm text-[#a995b8]">
                            Freelancer:{' '}
                            <span className="text-[#ded1ea]">
                              {
                                acceptedProposal.freelancer_name
                              }
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="glass-card min-w-[170px] p-4 md:text-right">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#806f8d]">
                          Project budget
                        </p>

                        <p className="mt-2 text-2xl font-black text-white">
                          $
                          {Number(
                            job.budget
                          ).toFixed(2)}
                        </p>

                        <p className="mt-2 text-sm text-[#a995b8]">
                          {job.total_proposals || 0}{' '}
                          proposal
                          {Number(
                            job.total_proposals ||
                              0
                          ) === 1
                            ? ''
                            : 's'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-5">
                      <p className="whitespace-pre-wrap leading-7 text-[#bba9c7]">
                        {job.description}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {job.status === 'open' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              startEditing(job)
                            }
                            className="btn-neon"
                          >
                            Edit Job
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                job.job_id
                              )
                            }
                            className="btn-danger-lumynx"
                          >
                            Delete
                          </button>
                        </>
                      )}

                      {job.status ===
                        'in_progress' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkCompleted(
                              job
                            )
                          }
                          disabled={
                            completingJobId ===
                            job.job_id
                          }
                          className="btn-neon"
                        >
                          {completingJobId ===
                          job.job_id
                            ? 'Completing...'
                            : 'Mark as Completed'}
                        </button>
                      )}

                    </div>

                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}