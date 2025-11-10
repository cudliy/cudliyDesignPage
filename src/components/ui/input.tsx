import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`rounded-md border border-white/30 dark:border-slate-600 bg-white dark:bg-slate-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-slate-400 px-3 py-2 text-sm outline-none focus:border-gray-500 dark:focus:border-slate-400 focus:outline-none focus-visible:border-gray-500 dark:focus-visible:border-slate-400 focus-visible:outline-none transition-colors duration-300 ${className}`}
      style={{
        outline: 'none',
        boxShadow: 'none'
      }}
      {...props}
    />
  );
};

export default Input;


