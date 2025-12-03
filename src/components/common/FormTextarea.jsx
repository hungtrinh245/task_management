// src/components/common/FormTextarea.jsx
export default function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  icon: Icon,
}) {
  return (
    <div className="relative">
      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
        {Icon && <Icon className="w-5 h-5 mr-2 text-indigo-500" />}
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
      ></textarea>
    </div>
  );
}
