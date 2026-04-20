import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        teacher: resolve(__dirname, 'teacher.html'),
        student: resolve(__dirname, 'student.html'),
      },
    },
  },
});