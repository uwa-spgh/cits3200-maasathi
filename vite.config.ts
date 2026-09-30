import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Short commit SHA baked into the bundle so a running build can identify
 * itself. `adb logcat` then answers "is the fix I just pushed actually on this
 * device?" without guesswork. Falls back to an env var, then to a placeholder,
 * so a build from a tarball or CI checkout without git still works.
 */
function buildSha(): string {
    if (process.env.MAASATHI_BUILD_SHA) return process.env.MAASATHI_BUILD_SHA;
    try {
        return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim();
    } catch {
        return 'unknown';
    }
}

export default defineConfig({
    plugins: [vue()],
    define: {
        __MAASATHI_BUILD_SHA__: JSON.stringify(buildSha())
    },
    build: {
        // Transpile down to syntax supported by older Android WebViews
        // (ships on low-end / older Bangladesh-market phones).
        target: 'es2018'
    }
});
