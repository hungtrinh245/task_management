// src/components/common/FormInput.jsx
export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  icon: Icon,
}) {
  return (
    <div className="relative">
      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
        {Icon && <Icon className="w-5 h-5 mr-2 text-indigo-500" />}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
      />
    </div>
  );
}
