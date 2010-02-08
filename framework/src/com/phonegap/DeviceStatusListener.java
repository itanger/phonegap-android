package com.phonegap;

import android.content.Context;
import android.location.Location;
import android.webkit.WebView;

public class DeviceStatusListener {
	String id;
	String successCallback;
	String failCallback;
    GpsListener mGps; 
    NetworkListener mNetwork;
    Context mCtx;
    private WebView mAppView;
	
	int interval;
	
	DeviceStatusListener(String i, Context ctx, int time, WebView appView)
	{
		id = i;
		interval = time;
		mCtx = ctx;
        mAppView = appView;
	}
	
	void success(Location loc)
	{
		/*
		 * We only need to figure out what we do when we succeed!
		 */
		
		/*
		 * Build the giant string to send back to JavaScript!
		 */
		
		/*
		 * altitudeAccuracy is constant as this value isn't supported by the Android.location.Location class
		 */
	}
	
	void fail()
	{
		
	}
	
	// This stops the listener
	void stop()
	{
		
	}
}
