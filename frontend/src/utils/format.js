// Utility helpers shared across the frontend

/**
 * Composes class name strings in a truthy-safe way, similar to clsx.
 * Accepts strings, numbers, arrays, and object maps of conditional classes.
 */
export const cn = (...inputs) => {
  const normalize = (value) => {
    if (!value) {
      return '';
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value.map(normalize).filter(Boolean).join(' ');
    }

    if (typeof value === 'object') {
      return Object.entries(value)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([className]) => className)
        .join(' ');
    }

    return '';
  };

  return inputs
    .map(normalize)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Derives up to two initials from a provided name string.
 */
export const getInitials = (name = '') => {
  if (!name || typeof name !== 'string') {
    return 'NA';
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return initials || 'NA';
};

/**
 * Calculates the current academic year label using a September turnover.
 */
export const currentAcademicYear = (date = new Date()) => {
  const currentYear = date.getFullYear();
  const monthIndex = date.getMonth();
  const startYear = monthIndex >= 8 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;
  return `${startYear}/${endYear}`;
};

/**
 * Formats a date-like input into a readable string.
 */
export const formatDate = (value, { locale = 'en-US', dateStyle = 'medium', timeStyle } = {}) => {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat(locale, { dateStyle, timeStyle }).format(date);
  } catch (error) {
    console.warn('formatDate fallback triggered', error);
    return date.toISOString().split('T')[0];
  }
};

export const formatCurrency = (value, { currency = 'NGN', locale = 'en-NG', minimumFractionDigits = 0 } = {}) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '₦0';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
    }).format(amount);
  } catch (error) {
    console.warn('formatCurrency fallback triggered', error);
    const symbol = currency === 'NGN' ? '₦' : '';
    return `${symbol}${amount.toFixed(minimumFractionDigits)}`;
  }
};
