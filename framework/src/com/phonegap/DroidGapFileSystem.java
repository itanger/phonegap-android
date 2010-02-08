package com.phonegap;

import java.lang.reflect.Field;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.os.Bundle;
import android.util.Log;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebSettings.LayoutAlgorithm;

public class DroidGapFileSystem extends Activity {
	private static final String LOG_TAG = "DroidGapFileSystem";
	
	private WebView appView;
	private String uri;
	private PhoneGap gap;
	private NetworkManager netMan;
	private FileSystem mFileSystem;

	
	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		
		getWindow().requestFeature(Window.FEATURE_NO_TITLE);
		getWindow().setFlags(
				WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN,
				WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
		setContentView(R.layout.main);
		appView = (WebView) findViewById(R.id.appView);

		/*
		 * This changes the setWebChromeClient to log alerts to LogCat!
		 * Important for Javascript Debugging
		 */

		appView.setWebChromeClient(new GapClient(this));
		appView.setInitialScale(100);
		WebSettings settings = appView.getSettings();
		settings.setJavaScriptEnabled(true);
		settings.setJavaScriptCanOpenWindowsAutomatically(true);
		settings.setLayoutAlgorithm(LayoutAlgorithm.NORMAL);

		/* Bind the appView object to the gap class methods */
		bindBrowser(appView);
		/* Load a URI from the strings.xml file */
		Class<R.string> c = R.string.class;
		Field f;

		int i = 0;

		try {
			f = c.getField("urlFileSystemTest");
			i = f.getInt(f);
			this.uri = this.getResources().getString(i);
		} catch (Exception e) {
			this.uri = "http://www.phonegap.com";
		}
		appView.loadUrl(this.uri);

	}

	private void bindBrowser(WebView appView) {
		gap = new PhoneGap(this, appView);
		netMan = new NetworkManager(this, appView);
		mFileSystem = new FileSystem(this, appView);

		// This creates the new javascript interfaces for PhoneGap
		appView.addJavascriptInterface(gap, "DroidGap");
		appView.addJavascriptInterface(netMan, "NetworkManager");
		appView.addJavascriptInterface(mFileSystem, "FileSystem");
	}
	
    /**
     * Provides a hook for calling "alert" from javascript. Useful for
     * debugging your javascript.
     */
    final class GapClient extends WebChromeClient {
    	
    	Context mCtx;
    	GapClient(Context ctx)
    	{
    		mCtx = ctx;
    	}
    	
    	@Override
        public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
            Log.d(LOG_TAG, message);
            // This shows the dialog box.  This can be commented out for dev
            AlertDialog.Builder alertBldr = new AlertDialog.Builder(mCtx);
            alertBldr.setMessage(message);
            alertBldr.setTitle("Alert");
            alertBldr.show();
            result.confirm();
            return true;
        }
    	
    }
    
	@Override
    public void onConfigurationChanged(Configuration newConfig) {
      //don't reload the current page when the orientation is changed
      super.onConfigurationChanged(newConfig);
    } 
     
	
    
    protected void onActivityResult(int requestCode, int resultCode, Intent intent)
    {
    	super.onActivityResult(requestCode, resultCode, intent);
    }	


    @Override
    protected void onResume() {
    	super.onResume();
    	if (mFileSystem != null){
    		mFileSystem.registerReceiver();
    	}
    }
    
    @Override
    protected void onPause() {
    	super.onPause();
    	if (mFileSystem != null){
    		mFileSystem.unregisterReceiver();
    	}
    }
    
}