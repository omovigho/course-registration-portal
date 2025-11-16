import React, { useEffect, useState } from 'react';
import api from '../../api/api.js';
import Table from '../../components/ui/Table.jsx';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { formatDate } from '../../utils/format.js';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const { data } = await api.get('/registrations');
  setRegistrations(data ?? []);
      } catch (error) {
        addToast({ title: 'Unable to load registrations', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [addToast]);

  return (
    <section className="space-y-6">
      <div className="card">
        <h1 className="text-xl font-semibold text-brand-text">Welcome back, {user?.full_name ?? user?.email}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Keep track of your registration timeline and recently added courses.
        </p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">Recent registrations</h2>
            <p className="text-sm text-slate-600">Submit once you are confident in your course mix.</p>
          </div>
          <Button asChild>
            <Link to="/student/registration-basket">Go to basket</Link>
          </Button>
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-slate-500">Fetching your records…</p>
          ) : (
            <Table
              columns={registrationColumns}
              data={registrations.map((registration) => ({
                id: registration.id,
                academic_year_id: registration.academic_year_id,
                status: registration.submitted ? 'Submitted' : 'Draft',
                total_courses: (registration.items ?? []).filter(
                  (item) => item.status === 'active' && !item.removed_at
                ).length,
                created_at: formatDate(registration.created_at)
              }))}
              emptyMessage="No registrations yet. Start by adding courses to your basket."
            />
          )}
        </div>
      </div>
    </section>
  );
};

const registrationColumns = [
  { key: 'id', header: 'Registration ID' },
  { key: 'academic_year_id', header: 'Academic Year ID' },
  { key: 'status', header: 'Status' },
  { key: 'total_courses', header: 'Courses' },
  {
    key: 'created_at',
    header: 'Created',
    render: (row) => <span className="text-slate-600">{row.created_at}</span>
  }
];

export default StudentDashboard;
