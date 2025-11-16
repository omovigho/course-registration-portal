import React, { useState } from 'react';
import { cn, getInitials } from '../utils/format.js';

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg'
};

const Avatar = ({ src, name = '', size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const resolvedSize = sizeMap[size] ?? sizeMap.md;

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s avatar` : 'User avatar'}
        className={cn('rounded-full object-cover', resolvedSize, className)}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-indigo-100 text-brand-primary',
        resolvedSize,
        className
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
