import {
  useEffect,
  useState
} from 'react';

import { Link } from 'react-router-dom';

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    minBudget: '',
    maxBudget: '',
    sort: 'latest'
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('Please login first');
      setLoading(false);
      return;
    }

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

        if (!res.ok) {
          throw new Error(
            `Status ${res.status}`
          );
        }

        const data = await res.json();

        setCategories(
          data.categories || []
        );
      } catch (err) {
        console.error(
          'Categories Error:',
          err
        );

        setCategories([]);
      }
    };

    fetchCategories();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError('');

        const params =
          new URLSearchParams();

        if (filters.search) {
          params.append(
            'search',
            filters.search
          );
        }

        if (filters.category_id) {
          params.append(
            'category_id',
            filters.category_id
          );
        }

        if (filters.minBudget) {
          params.append(
            'minBudget',
            filters.minBudget
          );
        }

        if (filters.maxBudget) {
          params.append(
            'maxBudget',
            filters.maxBudget
          );
        }

        if (filters.sort) {
          params.append(
            'sort',
            filters.sort
          );
        }

        const res = await fetch(
          `http://localhost:5000/api/jobs?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!res.ok) {
          throw new Error(
            `Status ${res.status}`
          );
        }

        const data = await res.json();

        setJobs(data.jobs || []);
      } catch (err) {
        setError(
          `Failed to load jobs: ${err.message}`
        );

        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filters, token]);

  const handleFilterChange = (event) => {
    const { name, value } =
      event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category_id: '',
      minBudget: '',
      maxBudget: '',
      sort: 'latest'
    });
  };

  return (
    <div className="lumynx-container">

      {/* PAGE HEADER */}
      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-purple-300">
          Find Opportunities
        </p>

        <h1 className="neon-title text-3xl font-black md:text-4xl">
          Browse Open Jobs
        </h1>

        <p className="mt-3 text-sm text-[#a995b8]">
          Browse available projects and submit
          proposals to clients.
        </p>
      </div>


      {/* FILTER SECTION */}
      <section className="glass-panel mb-7 p-5 md:p-6">

        <h2 className="mb-4 text-lg font-bold text-white">
          Search & Filter Jobs
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">

          {/* SEARCH */}
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search jobs..."
            className="input-lumynx lg:col-span-2"
          />


          {/* CATEGORY */}
          <select
            name="category_id"
            value={filters.category_id}
            onChange={handleFilterChange}
            className="input-lumynx"
          >
            <option value="">
              All Categories
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


          {/* MIN BUDGET */}
          <input
            type="number"
            name="minBudget"
            min="0"
            value={filters.minBudget}
            onChange={handleFilterChange}
            placeholder="Min Budget"
            className="input-lumynx"
          />


          {/* MAX BUDGET */}
          <input
            type="number"
            name="maxBudget"
            min="0"
            value={filters.maxBudget}
            onChange={handleFilterChange}
            placeholder="Max Budget"
            className="input-lumynx"
          />

        </div>


        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

          <select
            name="sort"
            value={filters.sort}
            onChange={handleFilterChange}
            className="input-lumynx max-w-[220px]"
          >
            <option value="latest">
              Latest Jobs
            </option>

            <option value="budget_high">
              Budget: High to Low
            </option>

            <option value="budget_low">
              Budget: Low to High
            </option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="btn-ghost"
          >
            Clear Filters
          </button>

        </div>

      </section>


      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}


      {/* LOADING */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-purple-400/30 border-t-fuchsia-400" />

            <p className="text-[#a995b8]">
              Loading jobs...
            </p>

          </div>

        </div>
      ) : jobs.length === 0 ? (

        /* EMPTY STATE */
        <div className="glass-panel p-10 text-center">

          <h2 className="text-xl font-bold text-white">
            No Jobs Found
          </h2>

          <p className="mt-2 text-sm text-[#a995b8]">
            Try changing your search or filter
            options.
          </p>

        </div>

      ) : (

        /* JOB LIST */
        <div className="space-y-5">

          {jobs.map((job) => (
            <article
              key={job.job_id}
              className="glass-card group p-6 md:p-7"
            >

              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                {/* JOB INFO */}
                <div className="min-w-0 flex-1">

                  <h2 className="text-xl font-bold text-white transition group-hover:text-purple-200">
                    {job.title}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">

                    <span className="status-lumynx border-purple-400/20 bg-purple-500/10 text-purple-200">
                      {job.category_name ||
                        'Uncategorized'}
                    </span>

                    <span className="status-lumynx border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                      Open
                    </span>

                  </div>


                  {job.description && (
                    <p className="mt-4 line-clamp-3 max-w-3xl text-sm leading-6 text-[#a995b8]">
                      {job.description}
                    </p>
                  )}

                </div>


                {/* BUDGET */}
                <div className="md:text-right">

                  <p className="text-xs font-bold uppercase tracking-wider text-[#806f8d]">
                    Budget
                  </p>

                  <p className="mt-1 text-2xl font-black text-white">
                    $
                    {Number(
                      job.budget || 0
                    ).toFixed(2)}
                  </p>

                </div>

              </div>


              {/* ACTION */}
              <div className="mt-6 flex items-center justify-end border-t border-white/10 pt-5">

                <Link
                  to={`/proposal/${job.job_id}`}
                  className="btn-neon"
                >
                  Submit Proposal
                </Link>

              </div>

            </article>
          ))}

        </div>
      )}

    </div>
  );
}