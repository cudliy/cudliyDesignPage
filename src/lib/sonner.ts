export const toast = {
  success: (msg: string) => console.log(`[success] ${msg}`),
  error: (msg: string) => console.error(`[error] ${msg}`),
  info: (msg: string) => console.info(`[info] ${msg}`),
};

export default toast;


