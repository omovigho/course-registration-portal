import React, { useEffect, useState } from 'react';
import api from '../../api/api.js';
import Table from '../../components/ui/Table.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDate } from '../../utils/format.js';

const LecturerDashboard = () => {
  const { addToast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const { data } = await api.get('/registrations?scope=lecturer');
        setRegistrations(data ?? []);
      } catch (error) {
        addToast({ title: 'Unable to load lecturer overview', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [addToast]);

  return (
    <section className="space-y-6">
      <div className="card">
        <h1 className="text-xl font-semibold text-brand-text">Lecturer dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Monitor student registration submissions relevant to your assigned courses.
        </p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-text">Recent student submissions</h2>
          <p className="text-sm text-slate-500">{registrations.length} awaiting review</p>
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading submissions…</p>
          ) : (
            <Table
              columns={columns}
              data={registrations.map((registration) => ({
                id: registration.id,
                student: registration.student?.full_name ?? registration.student?.email ?? 'Unknown',
                status: registration.status,
                submitted_at: registration.submitted_at
                  ? formatDate(registration.submitted_at)
                  : 'Pending submission',
                total_units: registration.total_units ?? registration.items?.length ?? 0
              }))}
              emptyMessage="No submissions to review at this time."
            />
          )}
        </div>
      </div>
    </section>
  );
};

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'student', header: 'Student' },
  { key: 'status', header: 'Status' },
  { key: 'total_units', header: 'Units' },
  { key: 'submitted_at', header: 'Submitted' }
];

export default LecturerDashboard;
