package com.phonegap;
import java.lang.reflect.Field;

import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebSettings.LayoutAlgorithm;

/**
 * Adapt the DroidGap according to the needs of the Bondi camera Test
 * @author Andreas
 *
 */
public class DroidGapCamera extends DroidGap {
	
	private WebView appView;
	private String uri;
	private PhoneGap gap;
	private CameraLauncher launcher;

	
    /** Called when the activity is first created. */
	@Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
          f = c.getField("urlCameraTest");
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
    	launcher = new CameraLauncher(appView, this);
    	
    	// This creates the new javascript interfaces for PhoneGap
    	appView.addJavascriptInterface(gap, "DroidGap");
    	appView.addJavascriptInterface(launcher, "GapCam");
    }  
    	    	
    // This is required to start the camera activity!  It has to come from the previous activity
    public void startCamera(int quality, int width, int height)
    {
    	Intent i = new Intent(this, CameraPreview.class);
    	i.setAction("android.intent.action.PICK");
    	i.putExtra("quality", quality);
    	i.putExtra("width", width);
    	i.putExtra("height", height);
    	startActivityForResult(i, 0);
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
    
}
