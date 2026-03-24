import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  base: '/agent-input/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@100xbot/agent-input': path.resolve(__dirname, '../src'),
    },
  },
});
