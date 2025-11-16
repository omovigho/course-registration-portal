import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Layout/Navbar.jsx';
import Sidebar from './components/Layout/Sidebar.jsx';
import { useAuth } from './hooks/useAuth.js';
import Login from './pages/Auth/Login.jsx';
import Signup from './pages/Auth/Signup.jsx';
import Landing from './pages/Landing.jsx';
import WelcomeRole from './pages/WelcomeRole.jsx';
import Profile from './pages/Profile.jsx';
import StudentOnboard from './pages/Student/StudentOnboard.jsx';
import StudentDashboard from './pages/Student/StudentDashboard.jsx';
import CourseCatalog from './pages/Student/CourseCatalog.jsx';
import RegistrationBasket from './pages/Student/RegistrationBasket.jsx';
import RegistrationHistory from './pages/Student/RegistrationHistory.jsx';
import StudentSchoolFees from './pages/Student/SchoolFees.jsx';
import LecturerDashboard from './pages/Lecturer/LecturerDashboard.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import Faculties from './pages/Admin/Faculties.jsx';
import Departments from './pages/Admin/Departments.jsx';
import StudentExports from './pages/Admin/StudentExports.jsx';
import Courses from './pages/Admin/Courses.jsx';
import AdminSchoolFees from './pages/Admin/SchoolFees.jsx';
import { getRoleHomePath } from './utils/routes.js';

const App = () => {
  const renderDashboard = (Component, allowedRoles) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    </ProtectedRoute>
  );

  return (
    <Routes>
      <Route
        path="/login"
        element={<PublicRoute redirectOnAuth={false}><Login /></PublicRoute>}
      />
      <Route
        path="/signup"
        element={<PublicRoute redirectOnAuth={false}><Signup /></PublicRoute>}
      />

      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={renderDashboard(WelcomeRole, ['user'])} />
      <Route path="/profile" element={renderDashboard(Profile)} />

      <Route
        path="/student/onboard"
        element={renderDashboard(StudentOnboard, ['user', 'student'])}
      />
      <Route
        path="/student/dashboard"
        element={renderDashboard(StudentDashboard, ['student'])}
      />
      <Route
        path="/student/courses"
        element={renderDashboard(CourseCatalog, ['student'])}
      />
      <Route
        path="/student/registration-basket"
        element={renderDashboard(RegistrationBasket, ['student'])}
      />
      <Route
        path="/student/registration-history"
        element={renderDashboard(RegistrationHistory, ['student'])}
      />
      <Route
        path="/student/school-fees"
        element={renderDashboard(StudentSchoolFees, ['student'])}
      />

      <Route
        path="/lecturer/dashboard"
        element={renderDashboard(LecturerDashboard, ['lecturer', 'admin'])}
      />

      <Route
        path="/admin/dashboard"
        element={renderDashboard(AdminDashboard, ['admin'])}
      />
      <Route
        path="/admin/faculties"
        element={renderDashboard(Faculties, ['admin'])}
      />
      <Route
        path="/admin/departments"
        element={renderDashboard(Departments, ['admin'])}
      />
      <Route
        path="/admin/courses"
        element={renderDashboard(Courses, ['admin'])}
      />
      <Route
        path="/admin/student-exports"
        element={renderDashboard(StudentExports, ['admin'])}
      />
      <Route
        path="/admin/school-fees"
        element={renderDashboard(AdminSchoolFees, ['admin'])}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageSpinner label="Loading your workspace" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = getRoleHomePath(user.role);
    return <Navigate to={fallback} replace />;
  }

  return children;
};

const PublicRoute = ({ children, redirectOnAuth = true }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageSpinner label="Checking session" />;
  }

  if (user && redirectOnAuth) {
    const destination = getRoleHomePath(user.role);
    return <Navigate to={destination} replace />;
  }

  return <AuthLayout>{children}</AuthLayout>;
};

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-brand-background">
      <Navbar />
      <div className="flex w-full">
        <Sidebar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="main-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const AuthLayout = ({ children }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-white px-4 py-8">
    <div className="main-container">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/70">
        {children}
      </div>
    </div>
  </div>
);

const FullPageSpinner = ({ label }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-brand-background text-brand-primary">
    <svg
      className="h-12 w-12 animate-spin text-brand-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label={label}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
    <p className="mt-4 text-sm font-medium text-brand-text">{label}</p>
  </div>
);

export default App;
