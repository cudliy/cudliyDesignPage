import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost';
};

export const Button: React.FC<ButtonProps> = ({ variant = 'default', className = '', ...props }) => {
  const variantClasses =
    variant === 'outline'
      ? 'bg-transparent border border-gray-300 text-gray-700'
      : variant === 'ghost'
      ? 'bg-transparent text-gray-700'
      : 'bg-black text-white';

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${variantClasses} ${className}`}
      {...props}
    />
  );
};

export default Button;


