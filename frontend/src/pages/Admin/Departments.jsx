import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Table from '../../components/ui/Table.jsx';
import api from '../../api/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDate } from '../../utils/format.js';

const Departments = () => {
  const { addToast } = useToast();
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingFaculties, setLoadingFaculties] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [createForm, setCreateForm] = useState({ name: '', code: '', faculty_id: '' });
  const [creating, setCreating] = useState(false);
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState('');
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', faculty_id: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchFaculties = useCallback(async () => {
    setLoadingFaculties(true);
    try {
      const { data } = await api.get('/faculties');
      setFaculties(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Failed to load faculties', error);
      addToast({ title: 'Unable to load faculties', variant: 'error' });
    } finally {
      setLoadingFaculties(false);
    }
  }, [addToast]);

  const fetchDepartments = useCallback(async (facultyId) => {
    setLoadingDepartments(true);
    try {
      const params = facultyId ? { params: { faculty_id: Number(facultyId) } } : undefined;
      const { data } = await api.get('/departments', params);
      setDepartments(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Failed to load departments', error);
      addToast({ title: 'Unable to load departments', variant: 'error' });
    } finally {
      setLoadingDepartments(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchFaculties();
  }, [fetchFaculties]);

  useEffect(() => {
    fetchDepartments(selectedFacultyFilter);
  }, [fetchDepartments, selectedFacultyFilter]);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    const { name, code, faculty_id } = createForm;
    if (!name.trim() || !code.trim() || !faculty_id) {
      addToast({ title: 'All fields are required', variant: 'error' });
      return;
    }

    setCreating(true);
    try {
      await api.post('/departments', {
        name: name.trim(),
        code: code.trim(),
        faculty_id: Number(faculty_id)
      });
      addToast({ title: 'Department added', variant: 'success' });
      setCreateForm({ name: '', code: '', faculty_id: '' });
      await fetchDepartments(selectedFacultyFilter);
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to add department right now.';
      addToast({ title: 'Creation failed', description: detail, variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const facultyOptions = useMemo(
    () => faculties.map((faculty) => ({ value: String(faculty.id), label: faculty.name })),
    [faculties]
  );

  const startEdit = (department) => {
    setEditingDepartment(department);
    setEditForm({
      name: department.name,
      code: department.code,
      faculty_id: String(department.faculty_id)
    });
  };

  const cancelEdit = () => {
    setEditingDepartment(null);
    setEditForm({ name: '', code: '', faculty_id: '' });
    setSavingEdit(false);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingDepartment) {
      return;
    }

    const { name, code, faculty_id } = editForm;
    if (!name.trim() || !code.trim() || !faculty_id) {
      addToast({ title: 'All fields are required', variant: 'error' });
      return;
    }

    setSavingEdit(true);
    try {
      await api.put(`/departments/${editingDepartment.id}`, {
        name: name.trim(),
        code: code.trim(),
        faculty_id: Number(faculty_id)
      });
      addToast({ title: 'Department updated', variant: 'success' });
      cancelEdit();
      await fetchDepartments(selectedFacultyFilter);
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to update department right now.';
      addToast({ title: 'Update failed', description: detail, variant: 'error' });
      setSavingEdit(false);
    }
  };

  const lookupFacultyName = (id) => faculties.find((item) => item.id === id)?.name ?? '—';

  const columns = [
    { key: 'name', header: 'Department name' },
    { key: 'code', header: 'Code' },
    {
      key: 'faculty',
      header: 'Faculty',
      render: (row) => lookupFacultyName(row.faculty_id)
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => formatDate(row.created_at)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => startEdit(row)}>
          Edit
        </Button>
      )
    }
  ];

  return (
    <section className="space-y-6">
      <header className="card">
        <h1 className="text-xl font-semibold text-brand-text">Manage departments</h1>
        <p className="mt-2 text-sm text-slate-600">
          Add departments under each faculty and update their details. Records cannot be deleted once created.
        </p>
      </header>

      <div className="card space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">Departments</h2>
            <p className="text-sm text-slate-600">Filter by faculty to focus on a subset of departments.</p>
          </div>
          <div className="flex flex-col gap-2 sm:w-72">
            <label htmlFor="faculty-filter" className="text-sm font-medium text-slate-700">
              Filter by faculty
            </label>
            <select
              id="faculty-filter"
              name="faculty-filter"
              value={selectedFacultyFilter}
              onChange={(event) => setSelectedFacultyFilter(event.target.value)}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
              disabled={loadingFaculties}
            >
              <option value="">All faculties</option>
              {facultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={loadingDepartments ? [] : departments}
          emptyMessage={loadingDepartments ? 'Loading departments…' : 'No departments recorded yet.'}
        />
      </div>

      <div className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-text">Add department</h2>
          <p className="mt-1 text-sm text-slate-600">Specify the department name, code, and owning faculty.</p>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreateSubmit}>
          <Input
            label="Department name"
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
            required
          />
          <div className="sm:col-span-2 flex flex-col gap-2">
            <label htmlFor="faculty_id" className="text-sm font-medium text-slate-700">
              Faculty
            </label>
            <select
              id="faculty_id"
              name="faculty_id"
              value={createForm.faculty_id}
              onChange={handleCreateChange}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
              disabled={loadingFaculties || faculties.length === 0}
              required
            >
              <option value="">Select faculty</option>
              {facultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={creating || faculties.length === 0}>
              {creating ? 'Saving…' : 'Add department'}
            </Button>
          </div>
        </form>
      </div>

      {editingDepartment ? (
        <div className="card space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">Edit department</h2>
            <p className="mt-1 text-sm text-slate-600">Update the department details and save the changes.</p>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleEditSubmit}>
            <Input
              label="Department name"
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
            <div className="sm:col-span-2 flex flex-col gap-2">
              <label htmlFor="edit_faculty" className="text-sm font-medium text-slate-700">
                Faculty
              </label>
              <select
                id="edit_faculty"
                name="faculty_id"
                value={editForm.faculty_id}
                onChange={handleEditChange}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
                disabled={loadingFaculties}
                required
              >
                <option value="">Select faculty</option>
                {facultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
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
    </section>
  );
};

export default Departments;
