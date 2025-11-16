import React from 'react';

const AdminDashboard = () => {
  return (
    <section className="space-y-6">
      <header className="card">
        <h1 className="text-xl font-semibold text-brand-text">Admin overview</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage platform resources and review the latest activity. Additional analytics will appear here
          as they become available.
        </p>
      </header>
      <div className="card">
        <h2 className="text-lg font-semibold text-brand-text">Getting started</h2>
        <p className="mt-2 text-sm text-slate-600">
          Use the navigation menu to update faculties, departments, or export student registration data.
        </p>
      </div>
    </section>
  );
};

export default AdminDashboard;
