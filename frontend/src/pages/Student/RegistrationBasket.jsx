import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../api/api.js';
import Table from '../../components/ui/Table.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const LEVEL_OPTIONS = [100, 200, 300, 400, 500, 600];

const normalizeList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  return [];
};

function resolveAcademicYearName(yearId, academicYears) {
  if (!yearId) {
    return '—';
  }
  const match = academicYears.find((year) => year.id === yearId || String(year.id) === String(yearId));
  return match?.name ?? `Session ${yearId}`;
}

const RegistrationBasket = () => {
  const location = useLocation();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [activeRegistrationId, setActiveRegistrationId] = useState(null);
  const [activeRegistration, setActiveRegistration] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const studentLevel = user?.student_profile?.level ? String(user.student_profile.level) : '';
  const [levelFilter, setLevelFilter] = useState(studentLevel);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [addingCourseId, setAddingCourseId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [resolvingRegistration, setResolvingRegistration] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const registrationCreationPromiseRef = useRef(null);
  const lastPrefillIdRef = useRef(null);

  const courseToPrefill = new URLSearchParams(location.search).get('course');

  const loadRegistrationDetails = useCallback(
    async (registrationId) => {
      if (!registrationId) {
        setActiveRegistration(null);
        setItems([]);
        setLoadingItems(false);
        return;
      }

      setLoadingItems(true);
      try {
        const { data } = await api.get(`/registrations/${registrationId}`);
        setActiveRegistration(data);
        setItems(data.items ?? []);
      } catch (error) {
        addToast({ title: 'Unable to load registration details', variant: 'error' });
      } finally {
        setLoadingItems(false);
      }
    },
    [addToast]
  );

  const hydrateAcademicYears = useCallback(async () => {
    setLoadingYears(true);
    try {
      const { data } = await api.get('/academic-years');
      const items = normalizeList(data);
      setAcademicYears(items);
      if (items.length) {
        setSelectedYear((prev) => (prev ? prev : String(items[0].id)));
      }
    } catch (error) {
      addToast({ title: 'Unable to load academic sessions', variant: 'error' });
    } finally {
      setLoadingYears(false);
    }
  }, [addToast]);

  const loadRegistrations = useCallback(async () => {
    setLoadingRegistrations(true);
    try {
      const { data } = await api.get('/registrations');
      const list = normalizeList(data);
      setRegistrations(list);

      if (!list.length) {
        setActiveRegistrationId(null);
        setActiveRegistration(null);
        setItems([]);
        return;
      }

      setActiveRegistrationId((prev) => {
        if (prev && list.some((entry) => entry.id === prev)) {
          return prev;
        }
        return list[0].id;
      });
    } catch (error) {
      addToast({ title: 'Unable to load registrations', variant: 'error' });
    } finally {
      setLoadingRegistrations(false);
    }
  }, [addToast]);

  useEffect(() => {
    hydrateAcademicYears();
    loadRegistrations();
  }, [hydrateAcademicYears, loadRegistrations]);

  useEffect(() => {
    if (!studentLevel) {
      return;
    }
    setLevelFilter((prev) => prev || studentLevel);
  }, [studentLevel]);

  useEffect(() => {
    if (!levelFilter) {
      setCourses([]);
      return;
    }

    let isMounted = true;
    setLoadingCourses(true);

    const fetchCourses = async () => {
      try {
        const { data } = await api.get('/courses', {
          params: { level: Number(levelFilter) }
        });
        if (isMounted) {
          setCourses(normalizeList(data));
        }
      } catch (error) {
        if (isMounted) {
          addToast({ title: 'Unable to load courses', variant: 'error' });
          setCourses([]);
        }
      } finally {
        if (isMounted) {
          setLoadingCourses(false);
        }
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, [addToast, levelFilter]);

  useEffect(() => {
    if (!activeRegistrationId) {
      loadRegistrationDetails(null);
      return;
    }

    loadRegistrationDetails(activeRegistrationId);
  }, [activeRegistrationId, loadRegistrationDetails]);

  const ensureActiveRegistration = useCallback(async () => {
    if (activeRegistrationId) {
      return activeRegistrationId;
    }

    if (registrationCreationPromiseRef.current) {
      return registrationCreationPromiseRef.current;
    }

    const academicYearId = Number(selectedYear);
    if (!Number.isInteger(academicYearId) || academicYearId <= 0) {
      addToast({ title: 'Select an academic session first', variant: 'error' });
      return null;
    }

    setResolvingRegistration(true);
    const creationPromise = (async () => {
      try {
        const { data } = await api.post('/registrations', {
          academic_year_id: academicYearId
        });
        setSelectedYear(String(data.academic_year_id));
        await loadRegistrations();
        setActiveRegistrationId(data.id);
        addToast({
          title: 'Registration created',
          description: 'A draft registration was created to add your course.',
          variant: 'success'
        });
        return data.id;
      } catch (error) {
        const detail = error.response?.data?.detail ?? 'Unable to create registration.';
        addToast({ title: 'Action failed', description: detail, variant: 'error' });
        return null;
      } finally {
        setResolvingRegistration(false);
        registrationCreationPromiseRef.current = null;
      }
    })();

    registrationCreationPromiseRef.current = creationPromise;
    return creationPromise;
  }, [activeRegistrationId, selectedYear, addToast, loadRegistrations]);

  useEffect(() => {
    const courseId = Number(courseToPrefill);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      lastPrefillIdRef.current = null;
      return;
    }

    const lastPrefill = lastPrefillIdRef.current;
    if (lastPrefill?.id === courseId) {
      if (lastPrefill.status === 'success' || lastPrefill.status === 'pending') {
        return;
      }
    }
    lastPrefillIdRef.current = { id: courseId, status: 'pending' };

    let cancelled = false;

    const addPrefillCourse = async () => {
      const registrationId = await ensureActiveRegistration();
      if (!registrationId || cancelled) {
        if (!cancelled) {
          lastPrefillIdRef.current = null;
        }
        return;
      }

      try {
        await api.post(`/registrations/${registrationId}/items`, {
          course_id: courseId
        });
        if (cancelled) {
          return;
        }
        await loadRegistrationDetails(registrationId);
        addToast({ title: 'Course added to basket', variant: 'success' });
        if (!cancelled) {
          lastPrefillIdRef.current = { id: courseId, status: 'success' };
        }
      } catch (error) {
        const detail = error.response?.data?.detail ?? 'Could not add course to basket.';
        addToast({ title: 'Action failed', description: detail, variant: 'error' });
        if (!cancelled) {
          lastPrefillIdRef.current = null;
        }
      }
    };

    addPrefillCourse();

    return () => {
      cancelled = true;
    };
  }, [courseToPrefill, ensureActiveRegistration, addToast, loadRegistrationDetails]);

  const totalCourses = useMemo(
    () => items.filter((item) => item.status === 'active' && !item.removed_at).length,
    [items]
  );

  const activeCourseIds = useMemo(() => {
    const ids = new Set();
    items
      .filter((item) => item.status === 'active' && !item.removed_at && item.course_id)
      .forEach((item) => ids.add(Number(item.course_id)));
    return ids;
  }, [items]);

  const canAddCourses = useMemo(
    () =>
      Boolean(activeRegistrationId || selectedYear) &&
      !resolvingRegistration &&
      !creating &&
      !loadingRegistrations &&
      !loadingYears,
    [activeRegistrationId, selectedYear, resolvingRegistration, creating, loadingRegistrations, loadingYears]
  );

  const addButtonLabels = useMemo(
    () => ({
      idle: 'Add',
      disabled: resolvingRegistration
        ? 'Preparing…'
        : creating || loadingRegistrations || loadingYears
        ? 'Please wait…'
        : !activeRegistrationId && !selectedYear
        ? 'Select session'
        : 'Unavailable'
    }),
    [resolvingRegistration, creating, loadingRegistrations, loadingYears, activeRegistrationId, selectedYear]
  );

  const handleCreateRegistration = async (event) => {
    event.preventDefault();
    if (!selectedYear) {
      addToast({ title: 'Select an academic session', variant: 'error' });
      return;
    }

    try {
      setCreating(true);
      const { data } = await api.post('/registrations', {
        academic_year_id: Number(selectedYear)
      });
      addToast({ title: 'Registration created', variant: 'success' });
      setSelectedYear(String(data.academic_year_id));
      await loadRegistrations();
      setActiveRegistrationId(data.id);
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to create registration.';
      addToast({ title: 'Action failed', description: detail, variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleAddCourse = async (courseId) => {
    const parsedCourseId = Number(courseId);
    if (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0) {
      addToast({ title: 'Action failed', description: 'Invalid course identifier.', variant: 'error' });
      return;
    }

    let registrationId = activeRegistrationId;
    if (!registrationId) {
      registrationId = await ensureActiveRegistration();
    }

    if (!registrationId) {
      return;
    }

    try {
      setAddingCourseId(parsedCourseId);
      await api.post(`/registrations/${registrationId}/items`, {
        course_id: parsedCourseId
      });
      await loadRegistrationDetails(registrationId);
      addToast({ title: 'Course added', variant: 'success' });
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to add this course.';
      addToast({ title: 'Action failed', description: detail, variant: 'error' });
    } finally {
      setAddingCourseId(null);
    }
  };

  const handleRemove = async () => {
    if (!confirmRemoveId) {
      return;
    }

    if (!activeRegistrationId) {
      addToast({ title: 'Select a registration to modify first', variant: 'error' });
      setConfirmRemoveId(null);
      return;
    }

    try {
      await api.delete(`/registrations/items/${confirmRemoveId}`);
  await loadRegistrationDetails(activeRegistrationId);
      addToast({ title: 'Course removed', variant: 'success' });
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to remove this course.';
      addToast({ title: 'Action failed', description: detail, variant: 'error' });
    } finally {
      setConfirmRemoveId(null);
    }
  };

  const handleSubmit = async () => {
    if (!activeRegistrationId) {
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/registrations/${activeRegistrationId}/submit`, {
        submitted: true
      });
      addToast({ title: 'Registration submitted', variant: 'success' });
      await loadRegistrationDetails(activeRegistrationId);
      await loadRegistrations();
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Review your basket and try again.';
      addToast({ title: 'Submission failed', description: detail, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="card space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">Course registration</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create or manage course registrations per academic year. You can submit once you are satisfied with your selected
            courses.
          </p>
        </div>

        <form className="grid gap-4 rounded-xl bg-indigo-50/60 p-4 sm:grid-cols-4" onSubmit={handleCreateRegistration}>
          <div className="sm:col-span-2">
            <label htmlFor="create-academic-year" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Academic session
            </label>
            <select
              id="create-academic-year"
              className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm text-brand-text focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              disabled={loadingYears || !academicYears.length}
              required
            >
              <option value="">
                {loadingYears ? 'Loading sessions…' : academicYears.length ? 'Select session' : 'No sessions available'}
              </option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name ?? `Session ${year.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button
              type="submit"
              disabled={creating || resolvingRegistration || loadingYears || !academicYears.length}
              className="w-full sm:w-auto"
            >
              {creating || resolvingRegistration ? 'Creating…' : 'Create registration'}
            </Button>
            <Button asChild variant="secondary">
              <Link to="/student/courses">Browse courses</Link>
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-text">Registrations</p>
            <p className="text-xs text-slate-500">Select one to manage its basket.</p>
          </div>
          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100 sm:w-60"
            value={activeRegistrationId ?? ''}
            onChange={(event) => setActiveRegistrationId(event.target.value ? Number(event.target.value) : null)}
            disabled={loadingRegistrations || resolvingRegistration || !registrations.length}
          >
            <option value="">
              {loadingRegistrations ? 'Loading…' : registrations.length ? 'Select registration' : 'No registrations yet'}
            </option>
            {registrations.map((registration) => (
              <option key={registration.id} value={registration.id}>
                {`ID ${registration.id} · ${resolveAcademicYearName(registration.academic_year_id, academicYears)} · ${registration.submitted ? 'Submitted' : 'Draft'}`}
              </option>
            ))}
          </select>
          {resolvingRegistration && (
            <p className="text-xs text-indigo-600">Preparing a draft registration…</p>
          )}
        </div>

        <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Academic session</p>
            <p className="mt-1 text-base font-semibold text-brand-text">
              {resolveAcademicYearName(activeRegistration?.academic_year_id, academicYears)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-1 text-base font-semibold text-brand-text">
              {activeRegistration?.submitted ? 'Submitted' : 'Draft'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Total courses</p>
            <p className="mt-1 text-base font-semibold text-brand-text">{totalCourses}</p>
          </div>
        </div>

        <div className="card border border-indigo-100 bg-white">
          <h2 className="text-lg font-semibold text-brand-text">Selected courses</h2>
          <div className="mt-4">
            {loadingItems ? (
              <p className="text-sm text-slate-500">Loading basket…</p>
            ) : (
              <Table
                columns={selectedCourseColumns({ setConfirmRemoveId })}
                data={items
                  .filter((item) => item.status === 'active' && !item.removed_at)
                  .map((item) => ({
                    id: item.id,
                    course_code_snapshot: item.course_code_snapshot,
                    course_name_snapshot: item.course_name_snapshot
                  }))}
                emptyMessage="No courses yet. Head to the catalog to add your first course."
              />
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting || totalCourses === 0}>
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </Button>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-text">Available courses</h2>
            <p className="text-sm text-slate-600">Browse courses for the selected level and add them to this registration.</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="course-level-filter" className="text-sm font-medium text-slate-700">
              Level
            </label>
            <select
              id="course-level-filter"
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">Select level</option>
              {LEVEL_OPTIONS.map((level) => (
                <option key={level} value={String(level)}>
                  {level} level
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          {loadingCourses ? (
            <p className="text-sm text-slate-500">Loading courses…</p>
          ) : (
            <Table
              columns={availableCourseColumns({
                onAdd: handleAddCourse,
                pendingCourseId: addingCourseId,
                disabledIds: activeCourseIds,
                canAdd: canAddCourses,
                labels: addButtonLabels
              })}
              data={courses}
              emptyMessage={
                !levelFilter
                  ? 'Select a level to view courses.'
                  : selectedYear
                  ? 'No courses available for this level.'
                  : 'Select an academic session to start adding courses.'
              }
            />
          )}
        </div>
      </div>

      <Modal
        open={Boolean(confirmRemoveId)}
        onClose={() => setConfirmRemoveId(null)}
        onConfirm={handleRemove}
        title="Remove course"
        description="Are you sure you want to remove this course from your basket?"
        confirmText="Remove"
        confirmVariant="secondary"
      />
    </section>
  );
};

const selectedCourseColumns = ({ setConfirmRemoveId }) => [
  { key: 'course_code_snapshot', header: 'Course Code' },
  { key: 'course_name_snapshot', header: 'Course Title' },
  {
    key: 'actions',
    header: '',
    render: (row) => (
      <Button variant="secondary" onClick={() => setConfirmRemoveId(row.id)}>
        Remove
      </Button>
    )
  }
];

const availableCourseColumns = ({ onAdd, pendingCourseId, disabledIds, canAdd, labels }) => [
  { key: 'course_code', header: 'Course Code' },
  { key: 'course_name', header: 'Course Title' },
  { key: 'level', header: 'Level' },
  {
    key: 'actions',
    header: '',
    render: (row) => {
      const courseId = Number(row.id);
      if (disabledIds?.has(courseId)) {
        return <span className="text-xs font-semibold text-emerald-600">Added</span>;
      }
      const isPending = pendingCourseId === courseId;
      const isDisabled = isPending || !canAdd;
      const label = isPending
        ? 'Adding…'
        : canAdd
        ? labels?.idle ?? 'Add'
        : labels?.disabled ?? 'Add';
      return (
        <Button
          className="px-3 py-1 text-xs"
          onClick={() => onAdd(courseId)}
          disabled={isDisabled}
          title={!canAdd && labels?.disabled ? labels.disabled : undefined}
        >
          {label}
        </Button>
      );
    }
  }
];

export default RegistrationBasket;
