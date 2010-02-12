package com.phonegap;
/* License (MIT)
 * Copyright (c) 2008 Nitobi
 * website: http://phonegap.com
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * Software), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import java.lang.reflect.Field;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebSettings.LayoutAlgorithm;
import android.widget.LinearLayout;
import android.os.Build.*;

public class DroidGap extends Activity {
	
	private static final String LOG_TAG = "DroidGap";
	private WebView appView;
	private String uri;
	private PhoneGap gap;
	private GeoBroker geo;
	private BondiGeoBroker bondiGeo;
	private AccelListener accel;
	private CameraLauncher launcher;
	private ContactManager mContacts;
	private FileUtils fs;
	private NetworkManager netMan;
	private CompassListener mCompass;
	private FileSystem mFileSystem;
	private DeviceStatus mDeviceStatus;
	private MessageHandler mMessageHandler;
	
	
	
    /** Called when the activity is first created. */
	@Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // allow only the class DroidGapCameraSub to do a specific initialization
        if (this.getClass().getSimpleName().equals("DroidGapCamera")) {
        	return;
        }
            
        getWindow().requestFeature(Window.FEATURE_NO_TITLE); 
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN); 
        setContentView(R.layout.main);        
         
        appView = (WebView) findViewById(R.id.appView);
        
        /* This changes the setWebChromeClient to log alerts to LogCat!  Important for Javascript Debugging */
        
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
          f = c.getField("url");
          i = f.getInt(f);
          this.uri = this.getResources().getString(i);
        } catch (Exception e)
        {
          this.uri = "http://www.phonegap.com";
        }
        appView.loadUrl(this.uri);
        
    }
	
	@Override
    public void onConfigurationChanged(Configuration newConfig) {
      //don't reload the current page when the orientation is changed
      super.onConfigurationChanged(newConfig);
    } 
    
    private void bindBrowser(WebView appView)
    {
    	gap = new PhoneGap(this, appView);
    	geo = new GeoBroker(appView, this);
    	bondiGeo = new BondiGeoBroker(appView, this);
    	accel = new AccelListener(this, appView);
    	launcher = new CameraLauncher(appView, this);
    	mContacts = new ContactManager(this, appView);
    	fs = new FileUtils(appView);
    	netMan = new NetworkManager(this, appView);
    	mCompass = new CompassListener(this, appView);
		mFileSystem = new FileSystem(this, appView);
		mDeviceStatus = new DeviceStatus(this, appView);
		mMessageHandler = new MessageHandler(this, appView);
    	
    	// This creates the new javaScript interfaces for PhoneGap
    	appView.addJavascriptInterface(gap, "DroidGap");
    	appView.addJavascriptInterface(geo, "Geo");
    	appView.addJavascriptInterface(bondiGeo, "bGeo");
    	appView.addJavascriptInterface(accel, "Accel");
    	appView.addJavascriptInterface(launcher, "GapCam");
    	appView.addJavascriptInterface(mContacts, "ContactHook");
    	appView.addJavascriptInterface(fs, "FileUtil");
    	appView.addJavascriptInterface(netMan, "NetworkManager");
    	appView.addJavascriptInterface(mCompass, "CompassHook");
    	appView.addJavascriptInterface(mFileSystem, "FileSystem");
    	appView.addJavascriptInterface(mDeviceStatus, "DStatus");
    	appView.addJavascriptInterface(mMessageHandler, "mMessageHandler");
    }
    
	public void loadUrl(String url)
	{
		appView.loadUrl(url);
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
    
    	    	
    // This is required to start the camera activity!  It has to come from the previous activity
    public void startCamera(int quality, int width, int height, int id)
    {
    	Intent i = new Intent(this, CameraPreview.class);
    	i.setAction("android.intent.action.PICK");
    	i.putExtra("quality", quality);
    	i.putExtra("width", width);
    	i.putExtra("height", height);
    	startActivityForResult(i, id);
    }
    // This is required to start the camera activity!  It has to come from the previous activity
    public void startSetCameraFeature(int featureID, int valueID)
    {
    	Intent i = new Intent(this, CameraSetFeature.class);
    	i.setAction("android.intent.action.PICK");
    	i.putExtra("featureID", featureID);
    	i.putExtra("valueID", valueID);
    	startActivityForResult(i, 0);
    }
    
    protected void onActivityResult(int requestCode, int resultCode, Intent intent)
    {
    	String data;
    	String data2;
    	String error;
    	super.onActivityResult(requestCode, resultCode, intent);
    	
        // allow sub classes to do a specific result handling
        if (this instanceof DroidGap && !this.getClass().equals(DroidGap.class)) {
        	return;
        }
    	
    	if (".CameraPreview".equals(intent.getComponent().getShortClassName())) {
    		//System.out.println("CameraPreview detected");
    		if (resultCode == RESULT_OK)
        	{
        		data = intent.getStringExtra("picture");   
        		data2 = intent.getStringExtra("path"); 
        		error = intent.getStringExtra("error");
        		// Send the graphic back to the class that needs it
        		if (error == null || error.length() == 0) {
        			launcher.processPicture(data, data2, requestCode);
        		} else {
        			launcher.failPicture("Did not complete! reason=" + error, requestCode);
        		}
        	}
        	else
        	{
        		launcher.failPicture("Did not complete!", requestCode);
        	}
    	}
    	if (".CameraSetFeature".equals(intent.getComponent().getShortClassName())) {
    		// do nothing
    	}
    	
    }
    
    @Override
    protected void onResume() {
    	super.onResume();

    	if (mFileSystem != null) {
        	// let us receive mount events    		
    		mFileSystem.registerReceiver();
    	}
    }
    
    @Override
    protected void onPause() {
    	super.onPause();

    	if (mFileSystem != null) {
        	// unregister as we might get closed    		
    		mFileSystem.unregisterReceiver();
    	}
    	if (mMessageHandler != null){
    		appView.loadUrl("javascript:bondi.messaging.unsubscribeFromAllSMS()");
    	}
    	if (mDeviceStatus != null){
    		appView.loadUrl("javascript:bondi.devicestatus.clearAllPropertyChange()");
    	}
    	
    }
    
}
