export const getRoleHomePath = (role) => {
  switch (role) {
    case 'student':
      return '/student/dashboard';
    case 'lecturer':
      return '/lecturer/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/dashboard';
  }
};
