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

public class BondiGeoBroker {
    private WebView mAppView;
	private Context mCtx;
	private HashMap<String, BondiGeoListener> geoListeners = new HashMap<String, BondiGeoListener>();
	private Location cLoc;
	private LocationManager mLocMan;
	
	public BondiGeoBroker(WebView view, Context ctx)
	{
		mCtx = ctx;
		mAppView = view;
	}
	
	public void getCurrentLocation(int time)
	{
		BondiGeoListener listener = new BondiGeoListener("global", mCtx, time, mAppView);
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
		BondiGeoListener listener = new BondiGeoListener(key, mCtx, freq, mAppView);
		geoListeners.put(key, listener);
		return key;
	}
	
	
	
	/**
	 * Stop.
	 * @param key the key
	 */
	public void stop(String key)
	{
		BondiGeoListener geo = geoListeners.get(key);
		geo.stop();
		geo = null;
	}
	
}
