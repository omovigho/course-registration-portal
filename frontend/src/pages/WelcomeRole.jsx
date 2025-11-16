import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';

const WelcomeRole = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const roleContent = {
    user: {
      title: 'Become a student to continue',
      description:
        'Complete the student onboarding form so we can connect you with the right faculty, department, and registration timeline.',
      actions: [
        { to: '/student/onboard', label: 'Become a student' }
      ]
    },
    student: {
      title: 'Ready to build your semester plan?',
      description:
        'Browse courses, update your academic profile, and register in a few clicks. Your personalised dashboard keeps everything in one place.',
      actions: [
        { to: '/student/onboard', label: 'Complete onboarding' },
        { to: '/student/courses', label: 'Explore courses', variant: 'secondary' }
      ]
    },
    lecturer: {
      title: 'Manage your course responsibilities',
      description:
        'Track student enrolments, monitor course registrations, and stay aligned with departmental timelines.',
      actions: [{ to: '/lecturer/dashboard', label: 'Go to lecturer dashboard' }]
    },
    admin: {
      title: 'Oversee faculties and departments',
      description:
        'Approve registrations, manage course data, and export student records securely with one interface.',
      actions: [
        { to: '/admin/dashboard', label: 'Admin control panel' },
        { to: '/admin/student-exports', label: 'Export student data', variant: 'secondary' }
      ]
    }
  };

  const { title, description, actions } = roleContent[user.role] ?? roleContent.user;

  return (
    <section className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-semibold text-brand-text">Hello, {user.full_name ?? user.email}</h1>
        <p className="mt-2 text-sm text-slate-600">
          You are signed in as <span className="font-medium text-brand-primary">{user.role}</span>.
        </p>
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-indigo-100 p-6">
          <h2 className="text-xl font-semibold text-brand-primary">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button key={action.to} asChild variant={action.variant ?? 'primary'}>
                <Link to={action.to}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <QuickStat label="Active courses" value={user.metrics?.active_courses ?? 0} icon={CourseIcon} />
        <QuickStat label="Pending actions" value={user.metrics?.pending_actions ?? 0} icon={TasksIcon} />
      </div>
    </section>
  );
};

const QuickStat = ({ label, value, icon: Icon }) => (
  <div className="card flex items-center gap-4">
    <div className="rounded-full bg-indigo-100 p-3 text-brand-primary">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-brand-text">{value}</p>
    </div>
  </div>
);

const CourseIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5V6A2.25 2.25 0 016.75 3.75h10.5A2.25 2.25 0 0119.5 6v13.5l-7.5-3.75-7.5 3.75z" />
  </svg>
);

const TasksIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4.5h4.5M15.75 6H18a2.25 2.25 0 012.25 2.25v9A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25v-9A2.25 2.25 0 016 6h2.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6A2.25 2.25 0 0110.5 3.75h3A2.25 2.25 0 0115.75 6H8.25z" />
  </svg>
);

export default WelcomeRole;
