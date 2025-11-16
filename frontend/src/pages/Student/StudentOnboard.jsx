import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import api from '../../api/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { currentAcademicYear } from '../../utils/format.js';
import { getRoleHomePath } from '../../utils/routes.js';

const LEVEL_OPTIONS = [100, 200, 300, 400, 500, 600];

const StudentOnboard = () => {
  const { user, updateStoredUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingFaculties, setLoadingFaculties] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    matric_no: '',
    year_of_entry: '',
    level: '',
    faculty_id: '',
    department_id: ''
  });

  const hasStudentProfile = Boolean(user?.student_profile);

  useEffect(() => {
    if (user?.student_profile) {
      setFormState({
        matric_no: user.student_profile.matric_no ?? '',
        year_of_entry: user.student_profile.year_of_entry ? String(user.student_profile.year_of_entry) : '',
        level: user.student_profile.level ? String(user.student_profile.level) : '',
        faculty_id: user.student_profile.faculty_id ? String(user.student_profile.faculty_id) : '',
        department_id: user.student_profile.department_id ? String(user.student_profile.department_id) : ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [facultyResponse, departmentResponse] = await Promise.all([
          api.get('/faculties'),
          api.get('/departments')
        ]);
        setFaculties(facultyResponse.data?.items ?? facultyResponse.data ?? []);
        setDepartments(departmentResponse.data?.items ?? departmentResponse.data ?? []);
      } catch (error) {
        addToast({ title: 'Unable to load reference data', variant: 'error' });
      } finally {
        setLoadingFaculties(false);
        setLoadingDepartments(false);
      }
    };

    fetchReferenceData();
  }, [addToast]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'faculty_id' ? { department_id: '' } : {})
    }));
  };

  const availableDepartments = useMemo(() => {
    if (!formState.faculty_id) {
      return [];
    }
    return departments.filter(
      (department) => String(department.faculty_id) === String(formState.faculty_id)
    );
  }, [departments, formState.faculty_id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/students/profile', {
        matric_no: formState.matric_no,
        year_of_entry: Number(formState.year_of_entry),
        level: Number(formState.level),
        faculty_id: Number(formState.faculty_id),
        department_id: Number(formState.department_id)
      });
      updateStoredUser({ ...user, role: 'student', student_profile: data });
      addToast({ title: 'Onboarding complete', variant: 'success' });
      const destination = getRoleHomePath('student');
      navigate(destination, { replace: true });
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Please review the details and try again.';
      addToast({ title: 'Submission failed', description: detail, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="card">
        <h1 className="text-xl font-semibold text-brand-text">Student onboarding</h1>
        <p className="mt-2 text-sm text-slate-600">
          Provide your matriculation details so we can personalise course recommendations and registration windows.
        </p>
        {hasStudentProfile ? (
          <div className="mt-6 space-y-4 rounded-lg bg-indigo-50 p-5 text-sm text-slate-700">
            <p className="font-medium text-brand-primary">You have already completed your onboarding.</p>
            <p>
              Your matriculation details are on file. If anything changes, contact an administrator to update your
              record.
            </p>
            <Button onClick={() => navigate(getRoleHomePath('student'))}>
              Go to student dashboard
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Matriculation number"
              name="matric_no"
              value={formState.matric_no}
              onChange={handleChange}
              required
            />
            <Input
              label="Year of entry"
              name="year_of_entry"
              type="number"
              min="1990"
              max={new Date().getFullYear()}
              value={formState.year_of_entry}
              onChange={handleChange}
              helperText={`Current academic year: ${currentAcademicYear()}`}
              required
            />

            <div className="flex flex-col gap-2">
              <label htmlFor="level" className="text-sm font-medium text-slate-700">
                Current level
              </label>
              <select
                id="level"
                name="level"
                value={formState.level}
                onChange={handleChange}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="faculty_id" className="text-sm font-medium text-slate-700">
                  Faculty
                </label>
                <select
                  id="faculty_id"
                  name="faculty_id"
                  value={formState.faculty_id}
                  onChange={handleChange}
                  disabled={loadingFaculties}
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
                <label htmlFor="department_id" className="text-sm font-medium text-slate-700">
                  Department
                </label>
                <select
                  id="department_id"
                  name="department_id"
                  value={formState.department_id}
                  onChange={handleChange}
                  disabled={!formState.faculty_id || loadingDepartments || availableDepartments.length === 0}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
                  required
                >
                  <option value="" disabled={availableDepartments.length === 0}>
                    {loadingDepartments ? 'Loading departments…' : 'Select department'}
                  </option>
                  {availableDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {!loadingDepartments && formState.faculty_id && availableDepartments.length === 0 ? (
                  <p className="text-xs text-amber-600">
                    No departments recorded under this faculty yet.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Save onboarding details'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default StudentOnboard;
