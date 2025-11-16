import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { cn } from '../utils/format.js';

const Landing = () => {
  return (
    <div className="min-h-screen bg-brand-background">
      <header className="relative overflow-hidden bg-white">
        <div className="main-container py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 classame="text-3xl font-semibold text-brand-text sm:text-4xl">
              NACOS Course Management Portal at the University of Benin
            </h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              Discover a unified portal for students, lecturers, and administrators to manage academic
              workflows with confidence.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-container space-y-16 py-16">
        <section className="grid gap-6 md:grid-cols-3">
          {featureCards.map((feature) => (
            <article key={feature.title} className="card h-full">
              <feature.icon className="h-8 w-8 text-brand-primary" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-brand-text">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="card grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-brand-text">Built for collaborative success</h2>
            <p className="mt-3 text-sm text-slate-600">
              From onboarding new students to auditing departmental performance, the portal keeps every
              stakeholder aligned. Secure authentication, role-based dashboards, and export-ready reports come out of the box.
            </p>
            <Button asChild className="mt-6">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
          <ul className="space-y-3">
            {checklistItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className={cn('mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-brand-primary')}>
                  <CheckIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="bg-white py-6">
        <div className="main-container flex flex-col items-center justify-between gap-3 text-sm text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} UNIBEN Course Management Portal</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-brand-primary">
              Access portal
            </Link>
            <a href="mailto:support@uniben.edu" className="hover:text-brand-primary">
              Contact support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};



const checklistItems = [
  'Secure authentication with automatic token refresh',
  'Role-based dashboards tailored to your permissions',
  'Accessible UI built with responsive design principles',
  'Fast API backend ready for analytics and reporting'
];

const iconBase = 'h-5 w-5';

function GraduationIcon({ className = '', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={cn(iconBase, className)}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8.485 4.243a.75.75 0 010 1.314L12 12.8l-8.485-4.243a.75.75 0 010-1.314L12 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12l7.5 3.75L19.5 12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12v6l7.5 3 7.5-3v-6" />
    </svg>
  );
}

function ClipboardIcon({ className = '', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={cn(iconBase, className)}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0115 21H9a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 019 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6M9 12h6m-6 4.5h4" />
    </svg>
  );
}

function ShieldIcon({ className = '', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={cn(iconBase, className)}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7.5 3v5.25c0 4.5-3 8.76-7.5 10.5-4.5-1.74-7.5-6-7.5-10.5V6L12 3z" />
    </svg>
  );
}

function CheckIcon({ className = '', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={cn(iconBase, className)}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

const featureCards = [
  {
    title: 'Focused student journeys',
    description: 'Guide students from onboarding to registration with personalised checklists and deadline reminders.',
    icon: GraduationIcon
  },
  {
    title: 'Lecturer oversight',
    description: 'Review course enrolments, monitor submissions, and coordinate with faculty staff from one dashboard.',
    icon: ClipboardIcon
  },
  {
    title: 'Administrative controls',
    description: 'Manage faculties, departments, and exports with audit-friendly trails and secure access.',
    icon: ShieldIcon
  }
];

export default Landing;
