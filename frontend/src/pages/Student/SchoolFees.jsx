import React, { useEffect, useMemo, useState } from 'react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Table from '../../components/ui/Table.jsx';
import api from '../../api/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

const StudentSchoolFees = () => {
  const { addToast } = useToast();
  const [policies, setPolicies] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const { data } = await api.get('/school-fees/policies');
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setPolicies(items);
      if (items.length > 0) {
        setSelectedAcademicYear((prev) => prev || String(items[0].academic_year_id));
      }
    } catch (error) {
      console.error('Failed to load school fee policies', error);
      addToast({ title: 'Unable to fetch school fee amounts', variant: 'error' });
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const { data } = await api.get('/school-fees/payments');
      setPayments(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Failed to load school fee payments', error);
      addToast({ title: 'Unable to fetch your payment history', variant: 'error' });
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchPayments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPolicy = useMemo(
    () => policies.find((policy) => String(policy.academic_year_id) === selectedAcademicYear) ?? null,
    [policies, selectedAcademicYear]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedAcademicYear) {
      addToast({ title: 'Select an academic year', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/school-fees/payments', {
        academic_year_id: Number(selectedAcademicYear),
        payment_reference: reference || undefined,
        notes: notes || undefined
      });
      addToast({ title: 'Payment captured', description: 'Awaiting administrator confirmation.', variant: 'success' });
      setReference('');
      setNotes('');
      await fetchPayments();
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to record your payment right now.';
      addToast({ title: 'Payment failed', description: detail, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const paymentColumns = useMemo(() => [
    {
      key: 'academic_year_name',
      header: 'Academic Year',
      render: (row) => row.academic_year_name ?? row.academic_year_id
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => formatCurrency(row.amount)
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusPill status={row.status} />
    },
    {
      key: 'payment_reference',
      header: 'Reference',
      render: (row) => row.payment_reference ?? '—'
    },
    {
      key: 'updated_at',
      header: 'Updated',
      render: (row) => formatDate(row.updated_at)
    }
  ], []);

  return (
    <section className="space-y-6">
      <div className="card space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">School fee payments</h1>
          <p className="mt-2 text-sm text-slate-600">
            Submit your fee payment for the academic session you are clearing. Once recorded, an administrator will approve or decline it.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="academic-year" className="text-sm font-medium text-slate-700">
              Academic year
            </label>
            <select
              id="academic-year"
              name="academic_year_id"
              value={selectedAcademicYear}
              onChange={(event) => setSelectedAcademicYear(event.target.value)}
              disabled={loadingPolicies || policies.length === 0}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              required
            >
              <option value="">
                {loadingPolicies ? 'Loading academic years…' : 'Select academic year'}
              </option>
              {policies.map((policy) => (
                <option key={policy.id} value={policy.academic_year_id}>
                  {policy.academic_year_name ?? `Year ${policy.academic_year_id}`} – {formatCurrency(policy.amount)}
                </option>
              ))}
            </select>
            {policies.length === 0 && !loadingPolicies ? (
              <p className="text-xs text-amber-600">No school fee amounts have been published yet.</p>
            ) : null}
          </div>

          <Input
            label="Payment reference"
            placeholder="e.g. TRANS-123456"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            helperText="Provide the bank or platform reference to help administrators verify your payment."
          />

          <div className="md:col-span-2">
            <label htmlFor="payment-notes" className="text-sm font-medium text-slate-700">
              Notes (optional)
            </label>
            <textarea
              id="payment-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed"
              placeholder="Add any extra details an administrator should know about this payment."
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={submitting || policies.length === 0}>
              {submitting ? 'Submitting…' : 'Record payment'}
            </Button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-text">Payment history</h2>
          <p className="text-sm text-slate-500">{payments.length} record(s)</p>
        </div>

        <div className="mt-4">
          {loadingPayments ? (
            <p className="text-sm text-slate-500">Loading your payments…</p>
          ) : (
            <Table
              columns={paymentColumns}
              data={payments}
              emptyMessage="You have not recorded any school fee payments yet."
            />
          )}
        </div>
      </div>
    </section>
  );
};

const StatusPill = ({ status }) => {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
  let classes = 'bg-slate-100 text-slate-700';
  if (status === 'approved') {
    classes = 'bg-emerald-100 text-emerald-700';
  } else if (status === 'declined') {
    classes = 'bg-rose-100 text-rose-700';
  } else if (status === 'pending') {
    classes = 'bg-amber-100 text-amber-700';
  }

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
};

export default StudentSchoolFees;
