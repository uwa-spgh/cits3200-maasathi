/// <reference types="vite/client" />

/** Commit SHA of the build, injected by vite.config.ts. */
declare const __MAASATHI_BUILD_SHA__: string;

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
