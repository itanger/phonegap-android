package com.phonegap;

import java.util.List;

import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;

public class BondiGeoListener implements LocationListener{
	String id;
	String successCallback;
	String failCallback;
    LocationManager mLocMan;
    Context mCtx;
	
	int interval;
	
	private WebView mAppView;
	private static final String LOG_TAG = "BondiGeoListener";
	private Location cLoc;
	
	BondiGeoListener(String i, Context ctx, int time, WebView appView) 
	{
		
		mAppView = appView;
		id = i;
		interval = time;
		mCtx = ctx;
		mLocMan = (LocationManager) mCtx.getSystemService(Context.LOCATION_SERVICE);
		
		
	
		if (mLocMan.getProvider(LocationManager.GPS_PROVIDER) != null){
			mLocMan.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1, 0, this);
		}
		if (mLocMan.getProvider(LocationManager.NETWORK_PROVIDER) != null){
			mLocMan.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 1, 0, this);
		}
		
		
		//After creation now let's make a first location-check, to get warm
		cLoc = getCurrentLocation();
		if (cLoc != null){
			onLocationChanged(cLoc);
		} else {
			mAppView.loadUrl("javascript:bondi.geolocation.fail(" + id + ",'noLoc')");
		}
	}
	
	
	/**
	 * Checks all available providers for a location
	 * @return Location if found, null else
	 */
	public Location getCurrentLocation() {
		
		List<String> providers = mLocMan.getAllProviders();
		
		boolean noProvider = true;
		Location loc = null;
		for (String provName : providers){
			if (loc == null && (mLocMan.getProvider(provName) != null)){
				loc = mLocMan.getLastKnownLocation(provName);
				noProvider = false;
			} 
		}
		
		if (noProvider){
			mAppView.loadUrl("javascript:bondi.geolocation.fail(" + id + ",'Currently is no Location-Provider avaiable - check devicesettings')");
		}
//		Location loc = null;
//		if ( mGps != null ) {
//			loc = mGps.getLocation();
//		}
//		if (loc == null && mNetwork != null) {
//			loc = mNetwork.getLocation();
//		}
		return loc;
	}
	
	// This stops the listener
	void stop()
	{
		mLocMan.removeUpdates(this);
//		if(mGps != null)
//			mGps.stop();
//		if(mNetwork != null)
//			mNetwork.stop();
	}
	
	public void onProviderDisabled(String provider) {
		Log.d(LOG_TAG, "The provider " + provider + " is disabled");
		String message = "The provider " + provider + " is disabled";
		mAppView.loadUrl("javascript:bondi.geolocation.alertMessage('"+message+"')");
	}

	public void onProviderEnabled(String provider) {
		Log.d(LOG_TAG, "The provider "+ provider + " is enabled");
		String message = "The provider " + provider + " is enabled";
		mAppView.loadUrl("javascript:bondi.geolocation.alertMessage('"+message+"')");
	}


	public void onStatusChanged(String provider, int status, Bundle extras) {
		Log.d(LOG_TAG, "Logging logging logging");
		Log.d(LOG_TAG, "The status of the provider " + provider + " has changed");
		String message ="The status of the provider " + provider + " has changed \n";
		
		if(status == 0)
		{
			Log.d(LOG_TAG, provider + " is OUT OF SERVICE");
			message+= provider + " is OUT OF SERVICE";
			mAppView.loadUrl("javascript:bondi.geolocation.alertMessage('"+message+"')");
		}
		else if(status == 1)
		{
			Log.d(LOG_TAG, provider + " is TEMPORARILY_UNAVAILABLE");
			message+= provider + " is TEMPORARILY_UNAVAILABLE";
			mAppView.loadUrl("javascript:bondi.geolocation.alertMessage('"+message+"')");
		}
		else
		{
			Log.d(LOG_TAG, provider + " is Available");
			message+= provider + " is Available";
			mAppView.loadUrl("javascript:bondi.geolocation.alertMessage('"+message+"')");
		}
	}


	public void onLocationChanged(Location loc) {
		Log.d(LOG_TAG, "The location has been updated!");
		if (loc != null){
			Log.d(LOG_TAG, "New Location: long:" + loc.getLongitude() + " lat: " + loc.getLatitude());
			try {
				String params; 
				/*
				 * Build the giant string to send back to Javascript!
				 */

				/*
				 * altitudeAccuracy: as this value isn't supported seperatedly by the Android.location.Location class
				 * so the general accuracy is used for it
				 */
				float altitudeAccuracy = loc.getAccuracy();

				params = loc.getLatitude() + "," + loc.getLongitude() + ", " + loc.getAltitude() + "," + loc.getAccuracy() + "," + altitudeAccuracy +  "," + loc.getBearing();
				params += "," + loc.getSpeed() + "," + loc.getTime();

				mAppView.loadUrl("javascript:bondi.geolocation.success(" + id + "," +  params + ")");
			} catch (Exception e) {
				e.printStackTrace();
				// call fail if an error was detected.
				mAppView.loadUrl("javascript:bondi.geolocation.fail(" + id + ",'"+ e.getMessage() +"')");
			}
		} else {
			mAppView.loadUrl("javascript:bondi.geolocation.fail(" + id + ",'noLoc')");
		}
	}
}
