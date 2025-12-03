import { forwardRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-indigo-500" />}
          {label}
          {props.required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={`w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 placeholder:text-gray-400 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
