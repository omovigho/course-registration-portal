import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/api.js';
import Table from '../../components/ui/Table.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDate } from '../../utils/format.js';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  return [];
};

const RegistrationHistory = () => {
  const { addToast } = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);

  const yearLookup = useMemo(() => {
    return academicYears.reduce((acc, year) => {
      acc[String(year.id)] = year.name ?? `Session ${year.id}`;
      return acc;
    }, {});
  }, [academicYears]);

  const rows = useMemo(() => {
    return registrations.map((registration) => ({
      ...registration,
      total_courses: (registration.items ?? []).filter((item) => item.status === 'active' && !item.removed_at).length,
      submitted_label: registration.submitted_at ? formatDate(registration.submitted_at) : 'Not submitted'
    }));
  }, [registrations]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [regResp, yearResp] = await Promise.all([api.get('/registrations'), api.get('/academic-years')]);
        setRegistrations(normalizeList(regResp.data));
        setAcademicYears(normalizeList(yearResp.data));
      } catch (error) {
        addToast({ title: 'Unable to load history', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [addToast]);

  const handleDownload = useCallback(
    async (registrationId) => {
      try {
        const response = await api.get(`/registrations/${registrationId}/pdf`, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `registration-${registrationId}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        const detail = error.response?.data?.detail ?? 'Unable to download registration PDF.';
        addToast({ title: 'Download failed', description: detail, variant: 'error' });
      }
    },
    [addToast]
  );

  const columns = useMemo(
    () => [
      { key: 'id', header: 'Registration ID' },
      {
        key: 'academic_year_id',
        header: 'Academic session',
        render: (row) => yearLookup[String(row.academic_year_id)] ?? `Session ${row.academic_year_id}`
      },
      {
        key: 'submitted',
        header: 'Status',
        render: (row) => (row.submitted ? 'Submitted' : 'Draft')
      },
      {
        key: 'total_courses',
        header: 'Courses',
        render: (row) => row.total_courses ?? 0
      },
      {
        key: 'submitted_label',
        header: 'Submitted',
        render: (row) => row.submitted_label
      },
      {
        key: 'actions',
        header: '',
        render: (row) => (
          <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => handleDownload(row.id)}>
            Download PDF
          </Button>
        )
      }
    ],
    [handleDownload, yearLookup]
  );

  return (
    <section className="space-y-6">
      <div className="card">
        <h1 className="text-xl font-semibold text-brand-text">Course history</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review past submissions, approval status, and any feedback from course advisers.
        </p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-brand-text">All submissions</h2>
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading registrations…</p>
          ) : (
            <Table columns={columns} data={rows} emptyMessage="You have not submitted any registrations yet." />
          )}
        </div>
      </div>
    </section>
  );
};

export default RegistrationHistory;
