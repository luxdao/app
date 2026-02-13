import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';
import packageJson from './package.json';

// Simplified dev config without wrangler
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 3005,
    },
    define: {
      'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
    },
  };
});
