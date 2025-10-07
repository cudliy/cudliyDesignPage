// Bridge to the local toast system implemented in hooks/useToast
import { toast as toastImpl } from '@/hooks/useToast';

export const toast = {
  success: (msg: string) => {
    const toastInstance = toastImpl({ title: msg });
    // Auto-dismiss success toasts after 2 seconds
    setTimeout(() => {
      toastInstance.dismiss();
    }, 2000);
    return toastInstance;
  },
  error: (msg: string) => toastImpl({ title: msg }),
  info: (msg: string) => toastImpl({ title: msg })
};

export default toast;


