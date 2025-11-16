import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api.js';
import Table from '../../components/ui/Table.jsx';
import Button from '../../components/ui/Button.jsx';
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

const CourseCatalog = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const studentLevel = user?.student_profile?.level ? String(user.student_profile.level) : '';
  const studentFacultyId = user?.student_profile?.faculty_id ? String(user.student_profile.faculty_id) : '';
  const [filters, setFilters] = useState({
    level: studentLevel,
    faculty_id: studentFacultyId,
    department_id: ''
  });
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchMeta = async () => {
      try {
        const [facultyResponse, departmentResponse] = await Promise.all([
          api.get('/faculties'),
          api.get('/departments')
        ]);
        if (!isMounted) {
          return;
        }
        setFaculties(normalizeList(facultyResponse.data));
        setDepartments(normalizeList(departmentResponse.data));
      } catch (error) {
        if (isMounted) {
          addToast({ title: 'Unable to load reference data', variant: 'error' });
        }
      }
    };

    fetchMeta();

    return () => {
      isMounted = false;
    };
  }, [addToast]);

  useEffect(() => {
    setFilters((prev) => {
      const nextLevel = prev.level || studentLevel;
      const nextFacultyId = prev.faculty_id || studentFacultyId;
      if (nextLevel === prev.level && nextFacultyId === prev.faculty_id) {
        return prev;
      }
      return {
        ...prev,
        level: nextLevel,
        faculty_id: nextFacultyId
      };
    });
  }, [studentFacultyId, studentLevel]);

  useEffect(() => {
    const levelFilter = filters.level;
    if (!levelFilter) {
      setCourses([]);
      setLoadingCourses(false);
      return;
    }

    let isMounted = true;
    setLoadingCourses(true);

    const fetchCourses = async () => {
      try {
        const { data } = await api.get('/courses', {
          params: {
            level: Number(levelFilter)
          }
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
  }, [addToast, filters.level]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'level' ? { department_id: '' } : {})
    }));
  };

  const dataRows = useMemo(
    () =>
      courses.map((course) => ({
        ...course,
        faculty_name: faculties.find((faculty) => faculty.id === course.faculty_id)?.name ?? course.faculty_id,
        department_name:
          departments.find((department) => department.id === course.department_id)?.name ?? course.department_id
      })),
    [courses, departments, faculties]
  );

  const filteredRows = useMemo(() => {
    return dataRows.filter((course) => {
      if (filters.faculty_id && String(course.faculty_id) !== filters.faculty_id) {
        return false;
      }
      if (filters.department_id && String(course.department_id) !== filters.department_id) {
        return false;
      }
      return true;
    });
  }, [dataRows, filters.department_id, filters.faculty_id]);

  return (
    <section className="space-y-6">
      <div className="card">
        <h1 className="text-xl font-semibold text-brand-text">Course catalog</h1>
        <p className="mt-2 text-sm text-slate-600">
          View the courses available to your level and faculty. Add interesting courses to your registration basket.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="level" className="text-sm font-medium text-slate-700">
              Level
            </label>
            <select
              id="level"
              name="level"
              value={filters.level}
              onChange={handleFilterChange}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">Select level</option>
              {LEVEL_OPTIONS.map((level) => (
                <option key={level} value={String(level)}>
                  {level} level
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="faculty" className="text-sm font-medium text-slate-700">
              Faculty
            </label>
            <select
              id="faculty"
              name="faculty_id"
              value={filters.faculty_id}
              onChange={handleFilterChange}
              disabled
              className="rounded-md border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-brand-text shadow-sm"
            >
              <option value="">All faculties</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="department" className="text-sm font-medium text-slate-700">
              Department
            </label>
            <select
              id="department"
              name="department_id"
              value={filters.department_id}
              onChange={handleFilterChange}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">All departments</option>
              {departments
                .filter((department) =>
                  studentFacultyId ? String(department.faculty_id) === studentFacultyId : true
                )
                .map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-text">Available courses</h2>
          <p className="text-sm text-slate-500">{filteredRows.length} courses found</p>
        </div>

        <div className="mt-4">
          {loadingCourses ? (
            <p className="text-sm text-slate-500">Loading courses…</p>
          ) : (
            <Table
              columns={columns}
              data={filteredRows}
              emptyMessage="No courses match your filters yet. Try adjusting them."
            />
          )}
        </div>
      </div>
    </section>
  );
};

const columns = [
  { key: 'course_code', header: 'Course Code' },
  { key: 'course_name', header: 'Course Title' },
  { key: 'level', header: 'Level' },
  { key: 'faculty_name', header: 'Faculty' },
  { key: 'department_name', header: 'Department' },
  {
    key: 'actions',
    header: '',
    render: (row) => (
      <Button asChild variant="secondary">
        <Link to={`/student/registration-basket?course=${row.id}`}>Add to basket</Link>
      </Button>
    )
  }
];

export default CourseCatalog;
