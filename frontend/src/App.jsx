import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
  useNavigate
} from 'react-router-dom';

import {
  useEffect,
  useState
} from 'react';

import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MyJobs from './pages/MyJobs';
import PostJob from './pages/PostJob';
import JobList from './pages/JobList';
import SubmitProposal from './pages/SubmitProposal';
import ViewProposals from './pages/ViewProposals';
import MyProposals from './pages/MyProposals';
import AdminDashboard from './pages/AdminDashboard';

import logo from './assets/logo1.jpeg';

function LogoutButton({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.dispatchEvent(
      new Event('auth-change')
    );

    onLogout?.();

    navigate('/', {
      replace: true
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="lumynx-logout"
    >
      Logout
    </button>
  );
}

function NavigationLink({
  to,
  children,
  onClick
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `lumynx-nav-link ${
          isActive
            ? 'lumynx-nav-link-active'
            : ''
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function AppContent() {
  const [auth, setAuth] = useState({
    loggedIn: false,
    user: null
  });

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token =
        localStorage.getItem('token');

      try {
        const user = JSON.parse(
          localStorage.getItem('user') ||
            'null'
        );

        setAuth({
          loggedIn: Boolean(token && user),
          user
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setAuth({
          loggedIn: false,
          user: null
        });
      }
    };

    checkAuth();

    window.addEventListener(
      'storage',
      checkAuth
    );

    window.addEventListener(
      'auth-change',
      checkAuth
    );

    return () => {
      window.removeEventListener(
        'storage',
        checkAuth
      );

      window.removeEventListener(
        'auth-change',
        checkAuth
      );
    };
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const role = auth.user?.role;

  const userInitial =
    auth.user?.full_name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || 'U';

  return (
    <div className="lumynx-app">
      <header className="lumynx-navbar">
        <nav className="lumynx-navbar-inner">

          <Link
            to={
              auth.loggedIn
                ? '/dashboard'
                : '/'
            }
            onClick={closeMobileMenu}
            className="lumynx-brand"
          >
            <img
              src={logo}
              alt="lumynx logo"
              className="h-11 w-auto object-contain"
            />

            <span className="lumynx-brand-copy">
              <span className="lumynx-brand-name">
                lumynx
              </span>

              <span className="lumynx-brand-tagline">
                Build. Hire. Grow.
              </span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() =>
              setMobileMenuOpen(
                (current) => !current
              )
            }
            className="lumynx-mobile-button"
          >
            {mobileMenuOpen ? '×' : '☰'}
          </button>

          {auth.loggedIn ? (
            <>
              <div
                className={`lumynx-nav-links ${
                  mobileMenuOpen
                    ? 'lumynx-nav-links-open'
                    : ''
                }`}
              >
                <NavigationLink
                  to="/dashboard"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </NavigationLink>

                <NavigationLink
                  to="/profile"
                  onClick={closeMobileMenu}
                >
                  My Profile
                </NavigationLink>

                {role === 'freelancer' && (
                  <>
                    <NavigationLink
                      to="/jobs"
                      onClick={closeMobileMenu}
                    >
                      Browse Jobs
                    </NavigationLink>

                    <NavigationLink
                      to="/my-proposals"
                      onClick={closeMobileMenu}
                    >
                      My Proposals
                    </NavigationLink>
                  </>
                )}

                {role === 'client' && (
                  <>
                    <NavigationLink
                      to="/post-job"
                      onClick={closeMobileMenu}
                    >
                      Post Job
                    </NavigationLink>

                    <NavigationLink
                      to="/my-jobs"
                      onClick={closeMobileMenu}
                    >
                      My Jobs
                    </NavigationLink>

                    <NavigationLink
                      to="/received-proposals"
                      onClick={closeMobileMenu}
                    >
                      Proposals
                    </NavigationLink>
                  </>
                )}

                {role === 'admin' && (
                  <NavigationLink
                    to="/admin"
                    onClick={closeMobileMenu}
                  >
                    Admin Panel
                  </NavigationLink>
                )}
              </div>

              <div
                className={`lumynx-account-area ${
                  mobileMenuOpen
                    ? 'lumynx-account-area-open'
                    : ''
                }`}
              >
                <div className="lumynx-user-chip">
                  <span className="lumynx-user-avatar">
                    {userInitial}
                  </span>

                  <span className="lumynx-user-name">
                    {auth.user?.full_name}
                  </span>
                </div>

                <LogoutButton
                  onLogout={closeMobileMenu}
                />
              </div>
            </>
          ) : (
            <>
              <div
                className={`lumynx-account-area ${
                  mobileMenuOpen
                    ? 'lumynx-account-area-open'
                    : ''
                }`}
              >
                <NavLink
                  to="/login"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `btn-ghost ${
                      isActive
                        ? 'border-purple-400/40'
                        : ''
                    }`
                  }
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  onClick={closeMobileMenu}
                  className="btn-neon"
                >
                  Join lumynx
                </NavLink>
              </div>
            </>
          )}
        </nav>
      </header>

      <main
        className={
          auth.loggedIn
            ? 'lumynx-main'
            : 'lumynx-public-main'
        }
      >
        <Routes>

          <Route
            path="/"
            element={
              auth.loggedIn ? (
                <Navigate
                  to="/dashboard"
                  replace
                />
              ) : (
                <Home />
              )
            }
          />

          <Route
            path="/login"
            element={
              auth.loggedIn ? (
                <Navigate
                  to="/dashboard"
                  replace
                />
              ) : (
                <Login />
              )
            }
          />

          <Route
            path="/register"
            element={
              auth.loggedIn ? (
                <Navigate
                  to="/dashboard"
                  replace
                />
              ) : (
                <Register />
              )
            }
          />

          <Route
            path="/forgot-password"
            element={
              <ForgotPassword />
            }
          />

          <Route
            path="/reset-password"
            element={
              <ResetPassword />
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute
                roles={['freelancer']}
              >
                <JobList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/post-job"
            element={
              <ProtectedRoute
                roles={['client']}
              >
                <PostJob />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-jobs"
            element={
              <ProtectedRoute
                roles={['client']}
              >
                <MyJobs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/proposal/:id"
            element={
              <ProtectedRoute
                roles={['freelancer']}
              >
                <SubmitProposal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-proposals"
            element={
              <ProtectedRoute
                roles={['freelancer']}
              >
                <MyProposals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/received-proposals"
            element={
              <ProtectedRoute
                roles={['client']}
              >
                <ViewProposals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                roles={['admin']}
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to={
                  auth.loggedIn
                    ? '/dashboard'
                    : '/'
                }
                replace
              />
            }
          />

        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}