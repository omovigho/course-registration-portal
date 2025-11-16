function toBoolean(value) {
  return value === 1 || value === true;
}

function mapUser(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    is_active: toBoolean(row.is_active),
    created_at: row.created_at,
  };
}

function mapStudentProfile(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    user_id: row.user_id,
    matric_no: row.matric_no,
    year_of_entry: row.year_of_entry,
    faculty_id: row.faculty_id,
    department_id: row.department_id,
    level: row.level,
    created_at: row.created_at,
  };
}

function mapFaculty(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    created_at: row.created_at,
  };
}

function mapDepartment(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    faculty_id: row.faculty_id,
    created_at: row.created_at,
  };
}

function mapCourse(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    course_code: row.course_code,
    course_name: row.course_name,
    level: row.level,
    faculty_id: row.faculty_id,
    department_id: row.department_id,
    created_by: row.created_by,
    is_active: toBoolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapSchoolFeePolicy(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    academic_year_id: row.academic_year_id,
    amount: row.amount,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    academic_year_name: row.academic_year_name,
  };
}

function mapSchoolFeePayment(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    student_id: row.student_id,
    academic_year_id: row.academic_year_id,
    amount: row.amount,
    status: row.status,
    payment_reference: row.payment_reference,
    notes: row.notes,
    approved_by: row.approved_by,
    approved_at: row.approved_at,
    declined_by: row.declined_by,
    declined_at: row.declined_at,
    declined_reason: row.declined_reason,
    created_at: row.created_at,
    updated_at: row.updated_at,
    academic_year_name: row.academic_year_name,
    student: row.student_full_name || row.student_email
      ? {
          id: row.student_id,
          full_name: row.student_full_name,
          email: row.student_email,
        }
      : null,
    approved_by_user: row.approver_full_name || row.approver_email
      ? {
          id: row.approved_by,
          full_name: row.approver_full_name,
          email: row.approver_email,
        }
      : null,
    declined_by_user: row.decliner_full_name || row.decliner_email
      ? {
          id: row.declined_by,
          full_name: row.decliner_full_name,
          email: row.decliner_email,
        }
      : null,
  };
}

function mapRegistration(row, items = []) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    student_id: row.student_id,
    academic_year_id: row.academic_year_id,
    submitted: toBoolean(row.submitted),
    submitted_at: row.submitted_at,
    created_at: row.created_at,
    items: items.map(mapRegistrationItem),
  };
}

function mapRegistrationItem(row) {
  return {
    id: row.id,
    registration_id: row.registration_id,
    course_id: row.course_id,
    course_code_snapshot: row.course_code_snapshot,
    course_name_snapshot: row.course_name_snapshot,
    status: row.status,
    removed_at: row.removed_at,
    created_at: row.created_at,
  };
}

module.exports = {
  mapUser,
  mapStudentProfile,
  mapFaculty,
  mapDepartment,
  mapCourse,
  mapRegistration,
  mapRegistrationItem,
  mapSchoolFeePolicy,
  mapSchoolFeePayment,
};
