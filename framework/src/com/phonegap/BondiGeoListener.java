package com.phonegap;

import android.content.Context;
import android.location.Location;
import android.webkit.WebView;

public class BondiGeoListener extends GeoListener{
	
	private WebView mAppView;
	
	BondiGeoListener(String i, Context ctx, int time, WebView appView)
	{
		super(i, ctx, time, appView);
		mAppView = appView;
		
		
		//After creation now let's make a first location-check, to get warm
		Location loc = null;
		if ( mGps != null ) {
			loc = mGps.getLocation();
		}
		if (loc == null && mNetwork != null) {
			loc = mNetwork.getLocation();
		}
		success(loc);
	}
	
	void success(Location loc){
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
		
		mAppView.loadUrl("javascript:Bondi.geolocation.success(" + id + "," +  params + ")");
	}
	
	void fail(){
		mAppView.loadUrl("javascript:Bondi.geolocation.fail(" + id + ")");
	}
	
	public Location getCurrentLocation() {
		Location loc = null;
		if ( mGps != null ) {
			loc = mGps.getLocation();
		}
		if (loc == null && mNetwork != null) {
			loc = mNetwork.getLocation();
		}
		return loc;
	}
}
