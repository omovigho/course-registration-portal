import React, { Fragment } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { getRoleHomePath } from '../../utils/routes.js';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const studentLinks = [
    { to: '/student/onboard', label: 'Onboarding', icon: ClipboardIcon },
    { to: '/student/dashboard', label: 'Dashboard', icon: AcademicCapIcon },
    { to: '/student/courses', label: 'Course Catalog', icon: BookOpenIcon },
    { to: '/student/school-fees', label: 'School Fees', icon: CurrencyIcon },
    { to: '/student/registration-basket', label: 'Course Registration', icon: CartIcon },
    { to: '/student/registration-history', label: 'Course History', icon: ClockIcon }
  ];

  const lecturerLinks = [
    { to: '/lecturer/dashboard', label: 'Lecturer Dashboard', icon: AcademicCapIcon }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: ShieldIcon },
    { to: '/admin/faculties', label: 'Faculties', icon: BuildingIcon },
    { to: '/admin/departments', label: 'Departments', icon: LayersIcon },
    { to: '/admin/courses', label: 'Courses', icon: BookOpenIcon },
    { to: '/admin/school-fees', label: 'School Fees', icon: CurrencyIcon },
    { to: '/admin/student-exports', label: 'Student Exports', icon: DownloadIcon }
  ];

  const buildLinks = () => {
    if (!user) {
      return [];
    }

    const homeLink = {
      to: getRoleHomePath(user.role),
      label: 'Home',
      icon: HomeIcon
    };

    const generalLinks = [homeLink, { to: '/profile', label: 'Profile', icon: UserIcon }];

    const linkGroups = [
      { header: 'General', links: generalLinks }
    ];

    if (user.role === 'user') {
      linkGroups.push({
        header: 'Getting started',
        links: [
          { to: '/student/onboard', label: 'Become a student', icon: ClipboardIcon }
        ]
      });
    }

    if (user.role === 'student') {
      linkGroups.push({ header: 'Student', links: studentLinks });
    }

    if (user.role === 'lecturer' || user.role === 'admin') {
      linkGroups.push({ header: 'Lecturer', links: lecturerLinks });
    }

    if (user.role === 'admin') {
      linkGroups.push({ header: 'Admin', links: adminLinks });
    }

    return linkGroups;
  };

  const linkGroups = buildLinks();

  if (!user) {
    return null;
  }

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/90 backdrop-blur md:block">
      <nav aria-label="Primary navigation" className="sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto px-4 py-6">
        <div className="flex h-full flex-col">
          <div className="flex-1">
            {linkGroups.map((group) => (
              <Fragment key={group.header}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.header}
                </p>
                <ul className="mb-6 space-y-1">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <NavLink
                        to={link.to}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ${
                            isActive
                              ? 'bg-indigo-50 text-brand-primary'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-brand-primary'
                          }`
                        }
                      >
                        <link.icon className="h-5 w-5 text-indigo-400 group-hover:text-brand-primary" aria-hidden="true" />
                        <span>{link.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </Fragment>
            ))}
          </div>

          <div className="mt-auto border-t border-slate-200 pt-4">
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              onClick={handleSignOut}
            >
              <LogoutIcon className="h-5 w-5 text-brand-primary" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>
    </aside>
  );
};

const iconBase = 'h-5 w-5';

const HomeIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V21a.75.75 0 01-.75.75h-4.5v-6h-6v6h-4.5A.75.75 0 013 21v-10.5z" />
  </svg>
);

const UserIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
  </svg>
);

const ClipboardIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0115 21H9a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 019 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6M9 12h6m-6 4.5h4" />
  </svg>
);

const AcademicCapIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8.485 4.243a.75.75 0 010 1.314L12 12.8l-8.485-4.243a.75.75 0 010-1.314L12 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12l7.5 3.75L19.5 12" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12v6l7.5 3 7.5-3v-6" />
  </svg>
);

const BookOpenIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.25c1.5-1 3.75-1.75 6.75-2.25V17c-3 .5-5.25 1.25-6.75 2.25-1.5-1-3.75-1.75-6.75-2.25V3c3 .5 5.25 1.25 6.75 2.25z" />
  </svg>
);

const CartIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l3.6 12.258a1.5 1.5 0 001.432 1.092H17.5M6 6h15l-1.5 6.75H9.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const ClockIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShieldIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7.5 3v5.25c0 4.5-3 8.76-7.5 10.5-4.5-1.74-7.5-6-7.5-10.5V6L12 3z" />
  </svg>
);

const BuildingIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7.5a2.25 2.25 0 012.25-2.25h9.5A2.25 2.25 0 0119 7.5V21M9 21v-6h6v6" />
  </svg>
);

const LayersIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L12 3l9 4.5-9 4.5-9-4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9 4.5 9-4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5L12 21l9-4.5" />
  </svg>
);

const DownloadIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l4.5-4.5M12 15l-4.5-4.5M4.5 18h15" />
  </svg>
);

const LogoutIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75V4.5A1.5 1.5 0 0014.25 3h-7.5A1.5 1.5 0 005.25 4.5v15A1.5 1.5 0 006.75 21h7.5a1.5 1.5 0 001.5-1.5v-2.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 15.75L21 12l-3-3.75M21 12H9" />
  </svg>
);

const CurrencyIcon = ({ className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`${iconBase} ${className}`.trim()}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25a5.25 5.25 0 00-10.5 0 5.25 5.25 0 0010.5 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
  </svg>
);

export default Sidebar;
