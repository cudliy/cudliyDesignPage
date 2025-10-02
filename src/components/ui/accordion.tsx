import React from 'react';

type RootProps = { children: React.ReactNode; className?: string };
export const Accordion: React.FC<RootProps> = ({ children, className }) => (
  <div className={className}>{children}</div>
);

type ItemProps = { value: string; children: React.ReactNode; className?: string };
export const AccordionItem: React.FC<ItemProps> = ({ children, className }) => (
  <div className={className}>{children}</div>
);

type TriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string };
export const AccordionTrigger: React.FC<TriggerProps> = ({ children, className = '', ...props }) => (
  <button className={`w-full text-left py-3 font-medium ${className}`} {...props}>{children}</button>
);

type ContentProps = { children: React.ReactNode; className?: string };
export const AccordionContent: React.FC<ContentProps> = ({ children, className }) => {
  return <div className={`${className}`}>{children}</div>;
};

export default Accordion;


