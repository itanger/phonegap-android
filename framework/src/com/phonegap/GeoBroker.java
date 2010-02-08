package com.phonegap;

import java.util.HashMap;

import android.content.Context;
import android.location.Location;
import android.location.LocationManager;
import android.webkit.WebView;

/*
 * This class is the interface to the Geolocation.  It's bound to the geo object.
 * 
 * This class only starts and stops various GeoListeners, which consist of a GPS and a Network Listener
 */

public class GeoBroker {
    private WebView mAppView;
	private Context mCtx;
	private HashMap<String, GeoListener> geoListeners = new HashMap<String, GeoListener>();
	private Location cLoc;
	private LocationManager mLocMan;
	
	public GeoBroker(WebView view, Context ctx)
	{
		mCtx = ctx;
		mAppView = view;
	}
	
		public void getCurrentLocation()
	{				
		GeoListener listener = new GeoListener("global", mCtx, 10000, mAppView);
		Location loc = listener.getCurrentLocation();
		String params = loc.getLatitude() + "," + loc.getLongitude() + ", " + loc.getAltitude() + "," + loc.getAccuracy() + "," + loc.getBearing();
		params += "," + loc.getSpeed() + "," + loc.getTime();
		mAppView.loadUrl("javascript:navigator.geolocation.gotCurrentPosition(" + params + ")");
		listener.stop();
	}
	
	public void getCurrentLocation(int time)
	{
		GeoListener listener = new GeoListener("global", mCtx, time, mAppView);
	}
	
	/**
	 * getLastKnownLocation.
	 * @return the last know location
	 */
	public Location getLastKnownLocation()
	{
		mLocMan = (LocationManager) mCtx.getSystemService(Context.LOCATION_SERVICE);
		cLoc = mLocMan.getLastKnownLocation(LocationManager.GPS_PROVIDER);
		if (cLoc == null){
			cLoc = mLocMan.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
		}
		
		return cLoc;
	}
	
	/**
	 * Start.
	 * @param freq the frequency
	 * @param key the key
	 * @return the key
	 */
	public String start(final int freq, final String key)
	{
		GeoListener listener = new GeoListener(key, mCtx, freq, mAppView);
		geoListeners.put(key, listener);
		return key;
	}
	
	/**
	 * Stop.
	 * @param key the key
	 */
	public void stop(String key)
	{
		GeoListener geo = geoListeners.get(key);
		geo.stop();
		geo = null;
	}
	
}
