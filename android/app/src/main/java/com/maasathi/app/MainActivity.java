package com.maasathi.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Let the WebView extend behind the status and navigation bars so the
        // app background shows through, matching the iOS UIScene layout. Android
        // 15+ enforces this for targetSdk 35+; the call keeps older releases
        // consistent. The web layer pads content clear via env(safe-area-inset-*).
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
