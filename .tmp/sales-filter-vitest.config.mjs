import config from '../vite.config.js';
export default { ...config, test: { ...config.test, setupFiles: ['.tmp/browser-storage-setup.js'] } };
