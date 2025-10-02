import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 ${className}`}
      {...props}
    />
  );
};

export default Input;


