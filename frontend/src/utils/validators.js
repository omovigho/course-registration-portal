// Form validation helpers.

/**
 * Checks whether a provided string matches a simple email pattern.
 */
export const isValidEmail = (value = '') => {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized.toLowerCase());
};

/**
 * Ensures a password has at least eight characters with both letters and numbers.
 */
export const isStrongPassword = (value = '') => {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim();
  if (normalized.length < 8) {
    return false;
  }

  const hasLetter = /[a-zA-Z]/.test(normalized);
  const hasNumber = /\d/.test(normalized);
  return hasLetter && hasNumber;
};
