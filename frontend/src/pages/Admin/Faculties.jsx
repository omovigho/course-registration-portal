import React, { useCallback, useEffect, useState } from 'react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Table from '../../components/ui/Table.jsx';
import api from '../../api/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDate } from '../../utils/format.js';

const Faculties = () => {
  const { addToast } = useToast();
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', code: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', code: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchFaculties = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/faculties');
      setFaculties(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Failed to load faculties', error);
      addToast({ title: 'Unable to load faculties', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchFaculties();
  }, [fetchFaculties]);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = createForm.name.trim();
    const trimmedCode = createForm.code.trim();

    if (!trimmedName || !trimmedCode) {
      addToast({ title: 'Provide both name and code', variant: 'error' });
      return;
    }

    setCreating(true);
    try {
      await api.post('/faculties', { name: trimmedName, code: trimmedCode });
      addToast({ title: 'Faculty added', variant: 'success' });
      setCreateForm({ name: '', code: '' });
      await fetchFaculties();
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to add faculty. Please try again.';
      addToast({ title: 'Creation failed', description: detail, variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (faculty) => {
    setEditingId(faculty.id);
    setEditForm({ name: faculty.name, code: faculty.code });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', code: '' });
    setSavingEdit(false);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    const trimmedName = editForm.name.trim();
    const trimmedCode = editForm.code.trim();
    if (!trimmedName || !trimmedCode) {
      addToast({ title: 'Provide both name and code', variant: 'error' });
      return;
    }

    setSavingEdit(true);
    try {
      await api.put(`/faculties/${editingId}`, { name: trimmedName, code: trimmedCode });
      addToast({ title: 'Faculty updated', variant: 'success' });
      cancelEdit();
      await fetchFaculties();
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to update faculty at this time.';
      addToast({ title: 'Update failed', description: detail, variant: 'error' });
      setSavingEdit(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Faculty name' },
    { key: 'code', header: 'Code' },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => formatDate(row.created_at)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          variant="secondary"
          className="px-3 py-1 text-xs"
          onClick={() => startEdit(row)}
        >
          Edit
        </Button>
      )
    }
  ];

  return (
    <section className="space-y-6">
      <header className="card">
        <h1 className="text-xl font-semibold text-brand-text">Manage faculties</h1>
        <p className="mt-2 text-sm text-slate-600">
          Add new faculties and update their codes. Entries cannot be deleted to preserve historical records.
        </p>
      </header>

      <div className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-text">Add faculty</h2>
          <p className="mt-1 text-sm text-slate-600">Capture the faculty name and short code used in course catalogues.</p>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreateSubmit}>
          <Input
            label="Faculty name"
            name="name"
            value={createForm.name}
            onChange={handleCreateChange}
            required
          />
          <Input
            label="Code"
            name="code"
            value={createForm.code}
            onChange={handleCreateChange}
            helperText="Use a short uppercase code, e.g. SCI."
            required
          />
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={creating}>
              {creating ? 'Saving…' : 'Add faculty'}
            </Button>
          </div>
        </form>
      </div>

      {editingId ? (
        <div className="card space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">Edit faculty</h2>
            <p className="mt-1 text-sm text-slate-600">Adjust the faculty details below and save your changes.</p>
          </div>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleEditSubmit}>
            <Input
              label="Faculty name"
              name="name"
              value={editForm.name}
              onChange={handleEditChange}
              required
            />
            <Input
              label="Code"
              name="code"
              value={editForm.code}
              onChange={handleEditChange}
              required
            />
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? 'Updating…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <Table
        columns={columns}
        data={loading ? [] : faculties}
        emptyMessage={loading ? 'Loading faculties…' : 'No faculties recorded yet.'}
      />
    </section>
  );
};

export default Faculties;
