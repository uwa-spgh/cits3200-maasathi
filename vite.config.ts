import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    build: {
        // Transpile down to syntax supported by older Android WebViews
        // (ships on low-end / older Bangladesh-market phones).
        target: 'es2018'
    }
});
