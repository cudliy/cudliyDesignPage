import React from 'react';
import { useToast } from '@/hooks/useToast';

const Toaster: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map(t => (
        <div key={t.id} className="min-w-[240px] max-w-[360px] bg-black text-white rounded-lg shadow-lg px-4 py-3 text-sm">
          {t.title}
        </div>
      ))}
    </div>
  );
};

export default Toaster;


