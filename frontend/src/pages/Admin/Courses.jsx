import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Table from '../../components/ui/Table.jsx';
import api from '../../api/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDate } from '../../utils/format.js';

const LEVEL_OPTIONS = [100, 200, 300, 400, 500, 600];

const Courses = () => {
  const { addToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [createForm, setCreateForm] = useState({
    course_code: '',
    course_name: '',
    level: '',
    faculty_id: '',
    department_id: '',
    is_active: true
  });
  const [editForm, setEditForm] = useState({
    course_name: '',
    level: '',
    faculty_id: '',
    department_id: '',
    is_active: true
  });

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const { data } = await api.get('/courses', { params: { include_inactive: 'true' } });
      setCourses(Array.isArray(data) ? data : data?.items ?? []);
    } catch (error) {
      console.error('Failed to load courses', error);
      addToast({ title: 'Unable to load courses', variant: 'error' });
    } finally {
      setLoadingCourses(false);
    }
  }, [addToast]);

  const fetchReferences = useCallback(async () => {
    setLoadingReferences(true);
    try {
      const [facultyResponse, departmentResponse] = await Promise.all([
        api.get('/faculties'),
        api.get('/departments')
      ]);
      setFaculties(facultyResponse.data?.items ?? facultyResponse.data ?? []);
      setDepartments(departmentResponse.data?.items ?? departmentResponse.data ?? []);
    } catch (error) {
      console.error('Failed to load reference data', error);
      addToast({ title: 'Unable to load faculties and departments', variant: 'error' });
    } finally {
      setLoadingReferences(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCourses();
    fetchReferences();
  }, [fetchCourses, fetchReferences]);

  const createDepartments = useMemo(() => {
    if (!createForm.faculty_id) {
      return [];
    }
    return departments.filter((department) => String(department.faculty_id) === String(createForm.faculty_id));
  }, [createForm.faculty_id, departments]);

  const editDepartments = useMemo(() => {
    if (!editForm.faculty_id) {
      return [];
    }
    return departments.filter((department) => String(department.faculty_id) === String(editForm.faculty_id));
  }, [departments, editForm.faculty_id]);

  const facultyLookup = useMemo(() => {
    return faculties.reduce((acc, faculty) => {
      acc[faculty.id] = faculty.name;
      return acc;
    }, {});
  }, [faculties]);

  const departmentLookup = useMemo(() => {
    return departments.reduce((acc, department) => {
      acc[department.id] = department.name;
      return acc;
    }, {});
  }, [departments]);

  const handleCreateChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'faculty_id' ? { department_id: '' } : {})
    }));
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'faculty_id' ? { department_id: '' } : {})
    }));
  };

  const resetCreateForm = () => {
    setCreateForm({
      course_code: '',
      course_name: '',
      level: '',
      faculty_id: '',
      department_id: '',
      is_active: true
    });
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    const trimmedCode = createForm.course_code.trim();
    const trimmedName = createForm.course_name.trim();

    if (!trimmedCode || !trimmedName || !createForm.level || !createForm.faculty_id || !createForm.department_id) {
      addToast({ title: 'Provide all required course details', variant: 'error' });
      return;
    }

    setCreating(true);
    try {
      await api.post('/courses', {
        course_code: trimmedCode,
        course_name: trimmedName,
        level: Number(createForm.level),
        faculty_id: Number(createForm.faculty_id),
        department_id: Number(createForm.department_id),
        is_active: createForm.is_active
      });
      addToast({ title: 'Course added', variant: 'success' });
      resetCreateForm();
      await fetchCourses();
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to create course at this time.';
      addToast({ title: 'Creation failed', description: detail, variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const startEdit = useCallback((course) => {
    setEditingId(course.id);
    setEditForm({
      course_name: course.course_name ?? '',
      level: course.level ? String(course.level) : '',
      faculty_id: course.faculty_id ? String(course.faculty_id) : '',
      department_id: course.department_id ? String(course.department_id) : '',
      is_active: Boolean(course.is_active)
    });
  }, []);

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      course_name: '',
      level: '',
      faculty_id: '',
      department_id: '',
      is_active: true
    });
    setSavingEdit(false);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    const trimmedName = editForm.course_name.trim();
    if (!trimmedName || !editForm.level || !editForm.faculty_id || !editForm.department_id) {
      addToast({ title: 'Provide all required course details', variant: 'error' });
      return;
    }

    setSavingEdit(true);
    try {
      await api.put(`/courses/${editingId}`, {
        course_name: trimmedName,
        level: Number(editForm.level),
        faculty_id: Number(editForm.faculty_id),
        department_id: Number(editForm.department_id),
        is_active: editForm.is_active
      });
      addToast({ title: 'Course updated', variant: 'success' });
      cancelEdit();
      await fetchCourses();
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to update course right now.';
      addToast({ title: 'Update failed', description: detail, variant: 'error' });
      setSavingEdit(false);
    }
  };

  const tableRows = useMemo(() => {
    return courses.map((course) => ({
      ...course,
      faculty_name: facultyLookup[course.faculty_id] ?? course.faculty_id,
      department_name: departmentLookup[course.department_id] ?? course.department_id
    }));
  }, [courses, departmentLookup, facultyLookup]);

  const columns = useMemo(() => [
    { key: 'course_code', header: 'Course Code' },
    { key: 'course_name', header: 'Course Title' },
    {
      key: 'level',
      header: 'Level',
      render: (row) => `${row.level} level`
    },
    {
      key: 'faculty_name',
      header: 'Faculty'
    },
    {
      key: 'department_name',
      header: 'Department'
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (row.is_active ? 'Active' : 'Inactive')
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => formatDate(row.created_at)
    },
    {
      key: 'actions',
      header: '',
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
  ], [startEdit]);

  return (
    <section className="space-y-6">
      <header className="card">
        <h1 className="text-xl font-semibold text-brand-text">Manage courses</h1>
        <p className="mt-2 text-sm text-slate-600">
          Add or modify courses across faculties and departments. Deletions are disabled to preserve academic history.
        </p>
      </header>

      <div className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-text">Add course</h2>
          <p className="mt-1 text-sm text-slate-600">
            Capture the key course details including the level it is available to and the owning department.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateSubmit}>
          <Input
            label="Course code"
            name="course_code"
            value={createForm.course_code}
            onChange={handleCreateChange}
            helperText="Use the official course code, e.g. CSC101"
            required
          />
          <Input
            label="Course title"
            name="course_name"
            value={createForm.course_name}
            onChange={handleCreateChange}
            required
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="create-level" className="text-sm font-medium text-slate-700">
              Level
            </label>
            <select
              id="create-level"
              name="level"
              value={createForm.level}
              onChange={handleCreateChange}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
              required
            >
              <option value="">Select level</option>
              {LEVEL_OPTIONS.map((level) => (
                <option key={level} value={level}>
                  {level} level
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="create-faculty" className="text-sm font-medium text-slate-700">
              Faculty
            </label>
            <select
              id="create-faculty"
              name="faculty_id"
              value={createForm.faculty_id}
              onChange={handleCreateChange}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
              required
              disabled={loadingReferences}
            >
              <option value="">Select faculty</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="create-department" className="text-sm font-medium text-slate-700">
              Department
            </label>
            <select
              id="create-department"
              name="department_id"
              value={createForm.department_id}
              onChange={handleCreateChange}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
              required
              disabled={!createForm.faculty_id}
            >
              <option value="">{createDepartments.length ? 'Select department' : 'Choose faculty first'}</option>
              {createDepartments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="is_active"
              checked={createForm.is_active}
              onChange={handleCreateChange}
              className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
            />
            Active immediately
          </label>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={creating}>
              {creating ? 'Saving…' : 'Add course'}
            </Button>
          </div>
        </form>
      </div>

      {editingId ? (
        <div className="card space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">Edit course</h2>
            <p className="mt-1 text-sm text-slate-600">Update the course details below. Course codes cannot be deleted, only adjusted.</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-brand-primary">Course code</p>
            <p>{courses.find((course) => course.id === editingId)?.course_code ?? '—'}</p>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleEditSubmit}>
            <Input
              label="Course title"
              name="course_name"
              value={editForm.course_name}
              onChange={handleEditChange}
              required
            />

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-level" className="text-sm font-medium text-slate-700">
                Level
              </label>
              <select
                id="edit-level"
                name="level"
                value={editForm.level}
                onChange={handleEditChange}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
                required
              >
                <option value="">Select level</option>
                {LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level} level
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-faculty" className="text-sm font-medium text-slate-700">
                Faculty
              </label>
              <select
                id="edit-faculty"
                name="faculty_id"
                value={editForm.faculty_id}
                onChange={handleEditChange}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
                required
              >
                <option value="">Select faculty</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-department" className="text-sm font-medium text-slate-700">
                Department
              </label>
              <select
                id="edit-department"
                name="department_id"
                value={editForm.department_id}
                onChange={handleEditChange}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
                required
                disabled={!editForm.faculty_id}
              >
                <option value="">{editDepartments.length ? 'Select department' : 'Choose faculty first'}</option>
                {editDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                checked={editForm.is_active}
                onChange={handleEditChange}
                className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
              />
              Active
            </label>

            <div className="md:col-span-2 flex justify-end gap-2">
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
        data={loadingCourses ? [] : tableRows}
        emptyMessage={loadingCourses ? 'Loading courses…' : 'No courses recorded yet.'}
      />
    </section>
  );
};

export default Courses;
