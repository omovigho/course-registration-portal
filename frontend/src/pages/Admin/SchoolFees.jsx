import React, { useEffect, useMemo, useState } from 'react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Table from '../../components/ui/Table.jsx';
import Modal from '../../components/ui/Modal.jsx';
import api from '../../api/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Declined', value: 'declined' }
];

const AdminSchoolFees = () => {
  const { addToast } = useToast();
  const [academicYears, setAcademicYears] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [creatingYear, setCreatingYear] = useState(false);
  const [creatingPolicy, setCreatingPolicy] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [policyForm, setPolicyForm] = useState({ academic_year_id: '', amount: '' });
  const [yearForm, setYearForm] = useState({ name: '', is_current: false });
  const [declineState, setDeclineState] = useState({ open: false, paymentId: null, reason: '' });

  const fetchAcademicYears = async (preferredYearId = null) => {
    try {
      const { data } = await api.get('/academic-years');
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setAcademicYears(items);
      setPolicyForm((prev) => {
        const normalizedPreferred = preferredYearId ? String(preferredYearId) : null;
        const existingSelection = prev.academic_year_id ? String(prev.academic_year_id) : '';
        const availableIds = new Set(items.map((year) => String(year.id)));

        if (normalizedPreferred && availableIds.has(normalizedPreferred)) {
          return { ...prev, academic_year_id: normalizedPreferred };
        }

        if (existingSelection && availableIds.has(existingSelection)) {
          return { ...prev, academic_year_id: existingSelection };
        }

        return { ...prev, academic_year_id: items.length > 0 ? String(items[0].id) : '' };
      });
    } catch (error) {
      console.error('Failed to load academic years', error);
      addToast({ title: 'Unable to load academic years', variant: 'error' });
    }
  };

  const fetchPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const { data } = await api.get('/school-fees/policies');
      setPolicies(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Failed to load policies', error);
      addToast({ title: 'Unable to load school fee policies', variant: 'error' });
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchPayments = async (status = statusFilter) => {
    setLoadingPayments(true);
    try {
      const params = status ? { status } : {};
      const { data } = await api.get('/school-fees/payments', { params });
      setPayments(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Failed to load payments', error);
      addToast({ title: 'Unable to load fee payments', variant: 'error' });
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
    fetchPolicies();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPayments(statusFilter);
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePolicyChange = (event) => {
    const { name, value } = event.target;
    setPolicyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleYearChange = (event) => {
    const { name, type, checked, value } = event.target;
    setYearForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleYearSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = yearForm.name.trim();
    if (!trimmedName) {
      addToast({ title: 'Provide an academic year name', variant: 'error' });
      return;
    }

    setCreatingYear(true);
    try {
      const { data } = await api.post('/academic-years', {
        name: trimmedName,
        is_current: yearForm.is_current
      });
      addToast({ title: 'Academic year added', variant: 'success' });
      setYearForm({ name: '', is_current: false });
      await fetchAcademicYears(String(data?.id ?? ''));
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to add academic year right now.';
      addToast({ title: 'Save failed', description: detail, variant: 'error' });
    } finally {
      setCreatingYear(false);
    }
  };

  const handlePolicySubmit = async (event) => {
    event.preventDefault();
    if (!policyForm.academic_year_id || !policyForm.amount) {
      addToast({ title: 'Provide academic year and amount', variant: 'error' });
      return;
    }

    setCreatingPolicy(true);
    try {
      await api.post('/school-fees/policies', {
        academic_year_id: Number(policyForm.academic_year_id),
        amount: Number(policyForm.amount)
      });
      addToast({ title: 'Policy saved', variant: 'success' });
      await fetchPolicies();
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to save school fee amount right now.';
      addToast({ title: 'Save failed', description: detail, variant: 'error' });
    } finally {
      setCreatingPolicy(false);
    }
  };

  const handleApprove = async (paymentId) => {
    setProcessingPaymentId(paymentId);
    try {
      await api.post(`/school-fees/payments/${paymentId}/approve`);
      addToast({ title: 'Payment approved', variant: 'success' });
      await fetchPayments(statusFilter);
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to approve this payment.';
      addToast({ title: 'Approval failed', description: detail, variant: 'error' });
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleDecline = async () => {
    if (!declineState.paymentId) {
      return;
    }
    setProcessingPaymentId(declineState.paymentId);
    try {
      await api.post(`/school-fees/payments/${declineState.paymentId}/decline`, {
        reason: declineState.reason
      });
      addToast({ title: 'Payment declined', variant: 'success' });
      setDeclineState({ open: false, paymentId: null, reason: '' });
      await fetchPayments(statusFilter);
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to decline this payment.';
      addToast({ title: 'Decline failed', description: detail, variant: 'error' });
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const paymentColumns = useMemo(() => [
    {
      key: 'student',
      header: 'Student',
      render: (row) => row.student?.full_name ?? row.student?.email ?? row.student_id
    },
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
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <PaymentActions
          row={row}
          onApprove={handleApprove}
          onDecline={(paymentId) => setDeclineState({ open: true, paymentId, reason: '' })}
          processing={processingPaymentId === row.id}
        />
      )
    }
  ], [handleApprove, processingPaymentId]);

  const academicYearColumns = useMemo(() => [
    {
      key: 'name',
      header: 'Name'
    },
    {
      key: 'is_current',
      header: 'Current',
      render: (row) => (row.is_current ? 'Yes' : 'No')
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => formatDate(row.created_at)
    }
  ], []);

  const policyRows = useMemo(() => {
    return policies.map((policy) => ({
      ...policy,
      academic_year_name:
        policy.academic_year_name ?? academicYears.find((year) => year.id === policy.academic_year_id)?.name ?? policy.academic_year_id
    }));
  }, [academicYears, policies]);

  const policyColumns = useMemo(() => [
    {
      key: 'academic_year_name',
      header: 'Academic Year'
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => formatCurrency(row.amount)
    },
    {
      key: 'updated_at',
      header: 'Updated',
      render: (row) => formatDate(row.updated_at)
    }
  ], []);

  return (
    <section className="space-y-6">
      <div className="card space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">Academic years</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create academic sessions that will be available when configuring school fee amounts and when students submit their payments.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-6" onSubmit={handleYearSubmit}>
          <Input
            containerClassName="md:col-span-4"
            label="Academic year"
            name="name"
            placeholder="e.g. 2024/2025"
            value={yearForm.name}
            onChange={handleYearChange}
            required
          />
          <label className="md:col-span-1 flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="is_current"
              checked={yearForm.is_current}
              onChange={handleYearChange}
              className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
            />
            Mark as current
          </label>
          <div className="md:col-span-1 flex items-end justify-end">
            <Button type="submit" disabled={creatingYear}>
              {creatingYear ? 'Saving…' : 'Add year'}
            </Button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-brand-text">Recorded academic years</h2>
          <div className="mt-4">
            <Table
              columns={academicYearColumns}
              data={academicYears}
              emptyMessage="No academic years have been recorded yet."
            />
          </div>
        </div>
      </div>

      <div className="card space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-brand-text">School fee configuration</h2>
          <p className="mt-2 text-sm text-slate-600">
            Set the payable amount per academic year. Students can only submit payments for academic sessions that have a published fee.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-3" onSubmit={handlePolicySubmit}>
          <div className="md:col-span-1 flex flex-col gap-2">
            <label htmlFor="policy-academic-year" className="text-sm font-medium text-slate-700">
              Academic year
            </label>
            <select
              id="policy-academic-year"
              name="academic_year_id"
              value={policyForm.academic_year_id}
              onChange={handlePolicyChange}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
              required
            >
              <option value="">Select academic year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount"
            name="amount"
            type="number"
            min="0"
            value={policyForm.amount}
            onChange={handlePolicyChange}
            helperText="Enter the total amount payable for this session."
            required
          />

          <div className="md:col-span-1 flex items-end justify-end">
            <Button type="submit" disabled={creatingPolicy}>
              {creatingPolicy ? 'Saving…' : 'Save amount'}
            </Button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-brand-text">Published amounts</h2>
          <div className="mt-4">
            {loadingPolicies ? (
              <p className="text-sm text-slate-500">Loading policies…</p>
            ) : (
              <Table
                columns={policyColumns}
                data={policyRows}
                emptyMessage="No school fee amounts have been recorded yet."
              />
            )}
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">Student payments</h2>
            <p className="text-sm text-slate-600">Review submitted payments and approve or decline each request.</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="payment-status-filter" className="text-sm font-medium text-slate-600">
              Status
            </label>
            <select
              id="payment-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          {loadingPayments ? (
            <p className="text-sm text-slate-500">Loading payments…</p>
          ) : (
            <Table
              columns={paymentColumns}
              data={payments}
              emptyMessage="No payments recorded for the selected status."
            />
          )}
        </div>
      </div>

      <Modal
        open={declineState.open}
        onClose={() => setDeclineState({ open: false, paymentId: null, reason: '' })}
        onConfirm={handleDecline}
        confirmText="Decline payment"
        confirmVariant="secondary"
        title="Decline payment"
        description="Provide a reason so the student understands what to fix."
      >
        <label htmlFor="decline-reason" className="text-sm font-medium text-slate-700">
          Reason
        </label>
        <textarea
          id="decline-reason"
          value={declineState.reason}
          onChange={(event) => setDeclineState((prev) => ({ ...prev, reason: event.target.value }))}
          rows={4}
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
          placeholder="Explain why this payment cannot be approved."
        />
      </Modal>
    </section>
  );
};

const PaymentActions = ({ row, onApprove, onDecline, processing }) => {
  if (row.status !== 'pending') {
    return <span className="text-xs text-slate-500">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        className="px-3 py-1 text-xs"
        onClick={() => onApprove(row.id)}
        disabled={processing}
      >
        {processing ? 'Processing…' : 'Approve'}
      </Button>
      <Button
        variant="secondary"
        className="px-3 py-1 text-xs"
        onClick={() => onDecline(row.id)}
        disabled={processing}
      >
        Decline
      </Button>
    </div>
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

export default AdminSchoolFees;
