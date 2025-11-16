import React, { useId } from 'react';
import { cn } from '../../utils/format.js';

const Input = React.forwardRef(
  (
    {
      label,
      helperText,
      error,
      type = 'text',
      className = '',
      containerClassName = '',
      required,
      ...props
    },
    ref
  ) => {
    const fallbackId = useId();
    const inputId = props.id ?? fallbackId;
    const describedById = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className={cn('flex flex-col gap-2', containerClassName)}>
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
            {required ? <span className="ml-1 text-brand-error" aria-hidden="true">*</span> : null}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedById}
          className={cn(
            'w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-brand-text shadow-sm transition focus:border-brand-primary focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100',
            error && 'border-brand-error focus:ring-red-100',
            className
          )}
          {...props}
        />
        {helperText ? (
          <p id={describedById} className="text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
        {error ? (
          <p className="text-xs font-medium text-brand-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
