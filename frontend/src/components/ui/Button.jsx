import React from 'react';
import { cn } from '../../utils/format.js';

const variantClasses = {
  primary:
    'bg-brand-primary text-white shadow-md shadow-indigo-300/40 hover:bg-indigo-700 focus-visible:ring-brand-accent',
  secondary:
    'border border-brand-primary text-brand-primary bg-transparent hover:bg-indigo-50 focus-visible:ring-brand-primary'
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const Button = React.forwardRef(
  ({ asChild = false, variant = 'primary', className = '', children, type = 'button', ...props }, ref) => {
    const resolvedClasses = cn(baseClasses, variantClasses[variant] ?? variantClasses.primary, className);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        className: cn(resolvedClasses, children.props.className),
        ref
      });
    }

    return (
      <button ref={ref} type={type} className={resolvedClasses} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
