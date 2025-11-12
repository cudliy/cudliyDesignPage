import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`border border-white/30 bg-white text-black placeholder-gray-400 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:outline-none focus-visible:border-gray-500 focus-visible:outline-none transition-colors duration-300 ${className}`}
      style={{
        outline: 'none',
        boxShadow: 'none'
      }}
      {...props}
    />
  );
};

export default Input;


