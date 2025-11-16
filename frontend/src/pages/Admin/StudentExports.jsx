import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/api.js';
import Table from '../../components/ui/Table.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDate } from '../../utils/format.js';

const StudentExports = () => {
  const { addToast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmittedRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/registrations/submitted');
      setRegistrations(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Failed to load submitted registrations', error);
      const detail = error.response?.data?.detail ?? 'Unable to load registered students right now.';
      addToast({ title: 'Load failed', description: detail, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSubmittedRegistrations();
  }, [fetchSubmittedRegistrations]);

  const summary = useMemo(() => {
    const studentCount = registrations.length;
    const totalCourses = registrations.reduce((acc, item) => acc + (Number(item.course_count) || 0), 0);
    return { studentCount, totalCourses };
  }, [registrations]);

  const tableData = useMemo(() => {
    return registrations.map((registration) => ({
      ...registration,
      course_count: Number(registration.course_count) || 0,
      id: registration.registration_id ?? `${registration.student_id}-${registration.academic_year_id}`,
    }));
  }, [registrations]);

  const columns = useMemo(() => [
    {
      key: 'student_full_name',
      header: 'Student',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-brand-text">{row.student_full_name ?? '—'}</span>
          {row.student_email ? <span className="text-xs text-slate-500">{row.student_email}</span> : null}
        </div>
      )
    },
    {
      key: 'matric_no',
      header: 'Matric no.'
    },
    {
      key: 'level',
      header: 'Level',
      render: (row) => (row.level ? `${row.level} level` : '—')
    },
    {
      key: 'course_count',
      header: 'Courses',
      render: (row) => {
        const count = Number(row.course_count) || 0;
        return `${count} ${count === 1 ? 'course' : 'courses'}`;
      }
    },
    {
      key: 'submitted_at',
      header: 'Registered on',
      render: (row) => formatDate(row.submitted_at, { dateStyle: 'medium', timeStyle: 'short' })
    },
    {
      key: 'academic_year_name',
      header: 'Academic year',
      render: (row) => row.academic_year_name ?? row.academic_year_id ?? '—'
    }
  ], []);

  const emptyMessage = loading ? 'Loading submitted registrations…' : 'No submitted registrations yet.';

  return (
    <section className="space-y-6">
      <header className="card space-y-2">
        <h1 className="text-xl font-semibold text-brand-text">Student registration exports</h1>
        <p className="text-sm text-slate-600">
          Review students who have successfully submitted their course registrations. Export actions will appear once reporting is wired up.
        </p>
      </header>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">Submitted registrations</h2>
            <p className="mt-1 text-sm text-slate-600">
              {summary.studentCount} {summary.studentCount === 1 ? 'student' : 'students'} with {summary.totalCourses}{' '}
              {summary.totalCourses === 1 ? 'course' : 'courses'} registered in total.
            </p>
          </div>
          <Button variant="secondary" onClick={fetchSubmittedRegistrations} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        <Table columns={columns} data={tableData} emptyMessage={emptyMessage} />
      </div>
    </section>
  );
};

export default StudentExports;
