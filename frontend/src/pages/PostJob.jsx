import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PostJob() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    category_id: ''
  });

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      alert('Please log in first');
      navigate('/');
      return;
    }

    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        setError('');

        const res = await fetch(
          'http://localhost:5000/api/jobs/categories',
          {
            headers: {
              Authorization: `Bearer ${token.trim()}`
            }
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message ||
              'Failed to load categories'
          );
        }

        setCategories(data.categories || []);
      } catch (err) {
        console.error(
          'Categories Load Error:',
          err
        );

        setError(
          err.message ||
            'Failed to load categories'
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [token, navigate]);

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

    if (!token) {
      alert('Please log in first');
      navigate('/');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await fetch(
        'http://localhost:5000/api/jobs',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.trim()}`
          },
          body: JSON.stringify({
            title: form.title.trim(),
            description:
              form.description.trim(),
            budget: Number(form.budget),
            category_id: Number(
              form.category_id
            )
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            'Failed to post job'
        );
      }

      alert('Job posted successfully');

      navigate('/my-jobs');
    } catch (err) {
      console.error('Post Job Error:', err);

      setError(
        err.message ||
          'Server error. Make sure the backend is running.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lumynx-container">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.26em] text-purple-300">
            Create an opportunity
          </p>

          <h1 className="neon-title text-3xl font-black md:text-4xl">
            Post a New Job
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#a995b8]">
            Describe your project clearly so the right
            freelancers can understand your needs and submit
            accurate proposals.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-panel p-7 md:p-9"
        >
          {error && (
            <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-[#ded1ea]"
              >
                Job Title
              </label>

              <input
                id="title"
                type="text"
                name="title"
                placeholder="Example: Build a React portfolio website"
                value={form.title}
                onChange={handleChange}
                required
                minLength={3}
                className="input-lumynx"
              />

              <p className="mt-2 text-xs text-[#806f8d]">
                Use a short and specific title.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-[#ded1ea]"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Explain the project requirements, expected result and any important details."
                rows={7}
                value={form.description}
                onChange={handleChange}
                required
                minLength={10}
                className="input-lumynx min-h-[190px] resize-y"
              />

              <div className="mt-2 flex justify-between gap-3 text-xs text-[#806f8d]">
                <span>
                  Include skills, scope and expected outcome.
                </span>

                <span>
                  {form.description.length} characters
                </span>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="budget"
                  className="mb-2 block text-sm font-semibold text-[#ded1ea]"
                >
                  Budget
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-purple-300">
                    $
                  </span>

                  <input
                    id="budget"
                    type="number"
                    name="budget"
                    step="0.01"
                    min="1"
                    placeholder="500.00"
                    value={form.budget}
                    onChange={handleChange}
                    required
                    className="input-lumynx pl-9"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="category_id"
                  className="mb-2 block text-sm font-semibold text-[#ded1ea]"
                >
                  Category
                </label>

                <select
                  id="category_id"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                  disabled={loadingCategories}
                  className="input-lumynx"
                >
                  <option value="">
                    {loadingCategories
                      ? 'Loading categories...'
                      : 'Select a category'}
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/my-jobs')}
              disabled={submitting}
              className="btn-ghost"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingCategories
              }
              className="btn-neon min-w-[150px]"
            >
              {submitting
                ? 'Posting...'
                : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}