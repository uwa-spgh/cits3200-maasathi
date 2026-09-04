import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maasathi.app',
  appName: 'MaaSathi',
  webDir: 'dist',
  plugins: {
    CapacitorSQLite: {
      // Data is isolated by the Android app sandbox; encryption (sqlcipher)
      // is not required and its bundled libsqlcipher.so is not 16 KB-aligned,
      // which triggers an install warning on modern Pixels.
      androidIsEncryption: false
    }
  }
};

export default config;