import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maasathi.app',
  appName: 'MaaSathi',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      // Resolved by name from android/app/src/main/res/drawable, so the mipmap
      // launcher icon cannot be used here. Without this the plugin falls back to
      // android.R.drawable.ic_dialog_info and every reminder shows Android's
      // generic info glyph in the status bar.
      smallIcon: 'ic_stat_maasathi',
      iconColor: '#f6c945'
    },
    CapacitorSQLite: {
      // Data is isolated by the Android app sandbox, so encryption (sqlcipher)
      // is not required. This only stops the plugin *using* sqlcipher at
      // runtime — @capacitor-community/sqlite still ships
      // net.zetetic:sqlcipher-android unconditionally, so libsqlcipher.so is
      // always packaged.
      //
      // The older "not 16 KB-aligned, warns on modern Pixels" note no longer
      // applies: sqlcipher-android 4.17.0 has 0x4000-aligned LOAD segments, and
      // `zipalign -c -P 16` passes on both the debug and release APKs.
      androidIsEncryption: false
    }
  }
};

export default config;