import React from 'react';

interface CommonButtonProps {
  text?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  // 🚀 Added 'edit' and 'default' variants
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'custom' | 'darkblue' | 'clear' | 'info' | 'edit' | 'default';
  loading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-300 hover:bg-gray-400 text-black',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  custom: 'text-white',
  darkblue: 'bg-[#275981] hover:bg-[#275981] text-white',
  clear: 'bg-[#275981] hover:bg-[#275981] text-white',
  info: 'bg-sky-600 hover:bg-sky-700 text-white',
  // 🚀 Added styles for 'edit' and 'default'
  edit: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  default: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
search:'#275981'
};

const CommonButton: React.FC<CommonButtonProps> = ({
  text,
  children,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  variant = 'primary',
  loading = false,
}) => {
  const isCustom = variant === 'custom';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded font-semibold transition duration-200 
        ${variantClasses[variant]} 
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} 
        ${className}`}
      style={isCustom ? { backgroundColor: '#275981' } : undefined}
    >
      {loading ? 'Loading...' : children ?? text}
    </button>
  );
};

export default CommonButton;