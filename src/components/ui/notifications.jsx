import toast from 'react-hot-toast';

function notify(type, value, seconds) {
  const config = value && typeof value === 'object' && !value.$$typeof ? value : { content: value };
  const options = { id: config.key, duration: config.duration === 0 ? Infinity : (config.duration ?? seconds ?? 4) * 1000 };
  const call = type === 'loading' ? toast.loading : type === 'error' ? toast.error : type === 'success' ? toast.success : toast;
  const id = call(config.content, options);
  return () => toast.dismiss(id);
}

export const message = {
  success: (value, seconds) => notify('success', value, seconds),
  error: (value, seconds) => notify('error', value, seconds),
  warning: (value, seconds) => notify('warning', value, seconds),
  info: (value, seconds) => notify('info', value, seconds),
  loading: (value, seconds = 0) => notify('loading', value, seconds),
  destroy: key => toast.dismiss(key),
};
