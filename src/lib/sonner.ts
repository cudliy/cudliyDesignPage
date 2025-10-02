// Bridge to the local toast system implemented in hooks/useToast
import { toast as toastImpl } from '@/hooks/useToast';

export const toast = {
  success: (msg: string) => toastImpl({ title: msg }),
  error: (msg: string) => toastImpl({ title: msg }),
  info: (msg: string) => toastImpl({ title: msg })
};

export default toast;


