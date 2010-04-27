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
 * THE SOFTWARE IS PROVIDED AS IS, WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.SensorManager;
import android.os.BatteryManager;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.OrientationEventListener;
import android.webkit.WebView;

public class DeviceStatus {

	private WebView mAppView;
	private Context mCtx;
	private Timer clock = new Timer();
	private HashMap<Long, Timerbundle> timeTable = new HashMap<Long, Timerbundle>();

	/** the logger */
	private static final String LOG_TAG = "DeviceStatus";
	
	/**
	 * Constructor, set content and appView
	 * @param ctx
	 * @param appView
	 */
	public DeviceStatus(Context ctx, WebView appView) {
		this.mCtx = ctx;
		this.mAppView = appView;
	}

	public String listVocabularies(){
		return "defaultProp";
	}
	//setDefualtVocabularies
	public String testSetDefaultVocabulary(){
		return "default";
	}

	// listAspects
	public String testSetListAspects(){
		return "default";
	}
	public String testGetProperties(){
		return "default";
	}

	//The above call is equivalent to:
	public String testGetPropertyValue01(){
		return "default";
	}

	// or
	public String testGetPropertyValue02(){
		return "default";
	}
	public String testGetPropertyValue03(){
		return "default";
	}
	//set
	public String testSetPropertyValue(){
		return "default";
	}
	public String watchPropertyChange(){
		return "default";
	}

	
	public void init() {
		
	}
	
	/**
	 * this method returns the phonenumber of this device
	 * @return the telephoneNo. of this device
	 */
	public String getOwnNumber(){
		TelephonyManager mTelephonyMgr = (TelephonyManager) mCtx.getSystemService(Context.TELEPHONY_SERVICE);
		String phoneNumber = mTelephonyMgr.getLine1Number();
		return phoneNumber;
	}
	
	/**
	 * The language of the default locale.
	 * @return a language code.
	 */
	public String getLanguage() {
		return Locale.getDefault().getLanguage();
	}

	/**
	 * find out all available information about this batteries technology
	 * @return
	 */
	public String getBatteryTechnology() {
		final List<String> resultStatus = Collections.synchronizedList(new ArrayList<String>());
		final Integer syncobject = new Integer(9);
		BroadcastReceiver battReceiver = new BroadcastReceiver() {
			
			public void onReceive(Context context, Intent intent) {
				context.unregisterReceiver(this);
				String technology = intent.getStringExtra("technology");
				synchronized (syncobject) {
					resultStatus.add(technology);
					syncobject.notifyAll();
				}
			}
		};
		IntentFilter battFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
		mCtx.registerReceiver(battReceiver, battFilter);
		
		synchronized (syncobject) {
			try {
				syncobject.wait(5000);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			if (resultStatus.size() > 0){
				return resultStatus.get(0);
			} else {
				return "unknown";
			}
		}
		
		
	}
	
	/**
	 * batteryIsBeingCharged
	 * @return  a status message
	 */
	public String batteryIsBeingCharged() {
		final List<String> resultStatus = Collections.synchronizedList(new ArrayList<String>());
		final Integer syncobject = new Integer(9);
		BroadcastReceiver battReceiver = new BroadcastReceiver() {
			
			public void onReceive(Context context, Intent intent) {
				context.unregisterReceiver(this);
				int status = intent.getIntExtra("status", -1);
				synchronized (syncobject) {

					if (status == BatteryManager.BATTERY_STATUS_CHARGING){
						resultStatus.add("true");
					} else {
						resultStatus.add("false");
					}
					syncobject.notifyAll();
				}
			}
		};
		IntentFilter battFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
		mCtx.registerReceiver(battReceiver, battFilter);
		
		synchronized (syncobject) {
			try {
				syncobject.wait(5000);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			if (resultStatus.size() > 0){
				return resultStatus.get(0);
			} else {
				return "unknown";
			}
		}
	}
	
	
	/** the map of listeners */
	private Map<Long, BroadcastReceiver> listeners = new HashMap<Long, BroadcastReceiver>();
	private Map<Long, OrientationEventListener> orientListeners = new HashMap<Long, OrientationEventListener>();
	
	public void clearAllListeners(){
		for (Long key : listeners.keySet()){
			mCtx.unregisterReceiver(listeners.get(key));
		}
		
		for (Long key : orientListeners.keySet()){
			removeDisplayOrientationListener(key);
		}
		
	}
	
	private class BatteryLevelListener extends BroadcastReceiver{
		//Stores the last reading of the batterylevel
		private int oldLevel = -1;
		/*
		 *  should be <= 1 if every change should be reported.
		 *  otherwise its the minimal distance between oldlevel and the new level before
		 *  a change is reported. 
		 *  As the level already is in percent no further calculation is needed
		 */
		private int minPercentage = 1;
		
		public long id = -1;
		
		public void register(long no, int minpercentage){
			id = no;
			minPercentage = minpercentage;
			IntentFilter battFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
			mCtx.registerReceiver(this, battFilter);
		}
		
		public void onReceive(Context context, Intent intent){
			int rawlevel = intent.getIntExtra("level", -1);
			int scale = intent.getIntExtra("scale", -1);
			int level = -1;
			
			if (rawlevel >= 0 && scale > 0) {
				level = (rawlevel * 100) / scale;
			}
			
			if (Math.abs(level - oldLevel) >= minPercentage){
				mAppView.loadUrl("javascript:bondi.devicestatus.propertyChanged(" + id + "," +  level + ")");
				oldLevel = level;
			}
			
		}
	};
	
	/**
	 * setupBatteryLevelListener
	 * @param key the ID of the listener.
	 */
	public void setupBatteryLevelListener(long key, int minChangePercentage){
		BatteryLevelListener listener = new BatteryLevelListener();
		listener.register(key, minChangePercentage);
		listeners.put(key, listener);
	}
	
	/**
	 * removeBatteryLevelListener
	 * @param key the ID of the listener.
	 */
	public void removeBatteryLevelListener(long key){
		BatteryLevelListener listener = (BatteryLevelListener) listeners.remove(key);
		//System.out.println("listener is null " + (listener == null) + " key: " + key);
		try{
			mCtx.unregisterReceiver(listener);
		}catch(Throwable e){
			System.err.println("Problem with unregistering a BatteryLevelListener!");
			e.printStackTrace();
		}
	}
	
	/**
	 * The BatteryTechnologyListener.
	 * @author Andreas
	 *
	 */
	private class BatteryTechnologyListener extends BroadcastReceiver{
		
		/** the id */
		public long id = -1;
		
		/**
		 * register
		 * @param no the id
		 */
		public void register(long no){
			id = no;
			IntentFilter battFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
			mCtx.registerReceiver(this, battFilter);
		}
		
		/**
		 * onReceive.
		 * @see android.content.BroadcastReceiver#onReceive(android.content.Context, android.content.Intent)
		 */
		public void onReceive(Context context, Intent intent){
			String technology = intent.getStringExtra("technology");
			
			mAppView.loadUrl("javascript:bondi.devicestatus.propertyChanged(" + id + "," +  technology + ")");
		}
	};
	
	
	/**
	 * sets up a BatteryTechnologyListener
	 * @param key the ID of the listener.
	 */
	public void setupBatteryTechnologyListener(long key){
		BatteryTechnologyListener listener = new BatteryTechnologyListener();
		listener.register(key);
		listeners.put(key, listener);
		
	}
	
	/**
	 * removes a BatteryTechnologyListener
	 * @param key the ID of the listener.
	 */
	public void removeBatteryTechnologyListener(long key){
		BatteryTechnologyListener listener = (BatteryTechnologyListener) listeners.remove(key);
		try{
			mCtx.unregisterReceiver(listener);
		}catch(Throwable e){
			System.err.println("Problem with unregistering a BatteryTechnologyListener!");
			e.printStackTrace();
		}
	}
	
	
	/**
	 * BatteryIsChargedListener.
	 * @author Andreas
	 *
	 */
	private class BatteryIsChargedListener extends BroadcastReceiver{
		
		/** the id */
		public long id = -1;
		
		/**
		 * register.
		 * @param no the id.
		 */
		public void register(long no){
			id = no;
			IntentFilter battFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
			mCtx.registerReceiver(this, battFilter);
		}
		
		/**
		 * onReceive.
		 * @see android.content.BroadcastReceiver#onReceive(android.content.Context, android.content.Intent)
		 */
		public void onReceive(Context context, Intent intent) {
			context.unregisterReceiver(this);
			int status = intent.getIntExtra("status", -1);

				if (status == BatteryManager.BATTERY_STATUS_CHARGING){
					mAppView.loadUrl("javascript:bondi.devicestatus.propertyChanged(" + id + "," +  "true" + ")");
				} else {
					mAppView.loadUrl("javascript:bondi.devicestatus.propertyChanged(" + id + "," +  "false" + ")");
				}
			
		}
	};
	
	
	/**
	 * sets up a BatteryIsChargedListener
	 * @param key the ID of the listener.
	 */
	public void setupBatteryIsChargedListener(long key){
		BatteryIsChargedListener listener = new BatteryIsChargedListener();
		listener.register(key);
		listeners.put(key, listener);
		
	}
	
	/**
	 * removes a BatteryIsChargedListener
	 * @param key the ID of the listener.
	 */
	public void removeBatteryIsChargedListener(long key){
		BatteryIsChargedListener listener = (BatteryIsChargedListener) listeners.remove(key);
		try{
			mCtx.unregisterReceiver(listener);
		}catch(Throwable e){
			System.err.println("Problem with unregistering a BatteryIsChargedListener!");
			e.printStackTrace();
		}
	}
	
	
	/**
	 * OrientListener
	 *
	 */
	private class OrientListener extends OrientationEventListener{
		long _id = -1;
		long _oldOrientation = -1;
		
		// the minimal angle in degree that raises an event
		float _minChangePercentage = 0.25f;
		
		public OrientListener(Context context, int rate, long id){
			super(context, rate);
			_id = id;
		}
		
		public void setMinChangePercentage(float percentage){
			_minChangePercentage = percentage;
		}
		
		public void onOrientationChanged (int orientation) {
			
			// ignore invalid orientation values
			if (orientation < 0) {
				return;
			}

			// synchronize the code to prevent race conditions
			synchronized (this) {

				// lazy initialization of _oldOrientation
				if (_oldOrientation == -1){
					_oldOrientation = orientation;
					mAppView.loadUrl("javascript:bondi.devicestatus.propertyChanged(" + _id + "," +  orientation + ")");
				} else {
					
					// calculate the angle difference
					long difference = -1;
					long difference2 = Math.abs( orientation - _oldOrientation);
					long difference3 = Math.abs(-orientation + _oldOrientation -360);
					long difference4 = Math.abs( orientation - _oldOrientation -360);
					difference = Math.min(difference2, Math.min(difference3, difference4));

					// normalize the angle difference
					// You might want to use the percentage value
					// float changePercentage = difference / 360.0f;
					
					// if the angle difference if bigger than the threshold, trigger the event.
					//if (changePercentage > _minChangePercentage){
					if (difference > 45) { // FIXME: replace by _minChangePercentage 
						_oldOrientation = orientation;
						mAppView.loadUrl("javascript:bondi.devicestatus.propertyChanged(" + _id + "," +  orientation + ")");
					}
				}
			}
		}
	}
	
	public void setupDisplayOrientationListener(long key, float minChangePercentage){
		OrientListener orientListener = new OrientListener (mCtx,
				SensorManager.SENSOR_DELAY_UI, key);
		orientListener.setMinChangePercentage(minChangePercentage);
		orientListener.enable(); 
		orientListeners.put(key, orientListener);
	}
	
	public void removeDisplayOrientationListener(long key){
		OrientationEventListener listener = (OrientationEventListener) orientListeners.remove(key);
		listener.disable();
	}
	
	
	/**
	 * getBatteryLevel.
	 * @return the batteryLevel as string
	 */
	public String getBatteryLevel() {
		return  monitorBatteryState();
	}
	

	/**
	 * monitorBatteryState
	 * @return a string describing the battery status
	 */
	private String monitorBatteryState() {
		final List<String> resultStatus = new ArrayList<String>();
		BroadcastReceiver battReceiver = new BroadcastReceiver() {
			
			public void onReceive(Context context, Intent intent) {
				StringBuilder sb = new StringBuilder();

				context.unregisterReceiver(this);
				int rawlevel = intent.getIntExtra("level", -1);
				int scale = intent.getIntExtra("scale", -1);
				int status = intent.getIntExtra("status", -1);
				int health = intent.getIntExtra("health", -1);
				int level = -1;  // percentage, or -1 for unknown
				if (rawlevel >= 0 && scale > 0) {
					level = (rawlevel * 100) / scale;
				}
	            sb.append("The phone");
				if (BatteryManager.BATTERY_HEALTH_OVERHEAT == health) {
					sb.append("'s battery feels very hot!");
				} else {
					switch(status) {
					case BatteryManager.BATTERY_STATUS_UNKNOWN:
						// old emulator; maybe also when plugged in with no battery
						sb.append(" has no battery.");
						break;
					case BatteryManager.BATTERY_STATUS_CHARGING:
						sb.append("'s battery");
						if (level <= 33)
							sb.append(" is charging, and really ought to " +
									"remain that way for the time being.");
						else if (level <= 84)
							sb.append(" charges merrily.");
						else
				 			sb.append(" will soon be fully charged.");
						break;
					case BatteryManager.BATTERY_STATUS_DISCHARGING:
					case BatteryManager.BATTERY_STATUS_NOT_CHARGING:
						if (level == 0)
							sb.append(" needs charging right away.");
						else if (level > 0 && level <= 33)
							sb.append(" is about ready to be recharged.");
						else
							sb.append("'s battery discharges merrily.");
						break;
					case BatteryManager.BATTERY_STATUS_FULL:
						sb.append(" is fully charged up and ready to go on " +
								"an adventure of some sort.");
						break;
					default:
						sb.append("'s battery is indescribable!");
						break;
					}
				}
				sb.append(' ');
				//System.out.println(sb.toString());
				//resultStatus.add(sb.toString()); // provide a text
				synchronized (resultStatus) {
					resultStatus.add("" + level);
					resultStatus.notifyAll();
				}
			}
		};
		IntentFilter battFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
		mCtx.registerReceiver(battReceiver, battFilter);
		synchronized (resultStatus) {
			try {
				resultStatus.wait(2000);
				if (resultStatus.size() > 0) {
					return resultStatus.get(0);
				}
			} catch (InterruptedException e) {
				Log.w(LOG_TAG, e);
			} catch (Exception e) {
				Log.w(LOG_TAG, e);
			}
		}
		//mCtx.unregisterReceiver(battReceiver);
		//battReceiver.abortBroadcast();
		//battReceiver.setResult(Activity.RESULT_OK, "123", null);
		return "unknown";
	}
	
	
	public void startTimer (long id, String minTimeout, String maxTimeout){
		System.out.println("StartTimer " + id + " min " + minTimeout + " max " + maxTimeout);
		Timerbundle bundle = new Timerbundle(id, Long.parseLong(minTimeout), Long.parseLong(maxTimeout));
		this.timeTable.put(id, bundle);
	}
	
	public void restartTimer(long id){
		System.out.println("restartTimer " + id);
		Timerbundle bundle = this.timeTable.get(id);
		if (bundle != null){
			bundle.restart();
		}
	}
	
	public void cancelTimer(long id){
		System.out.println("cancel timer" + id);
		Timerbundle bundle = this.timeTable.remove(id);
		if (bundle != null){
			bundle.cancel();
		}
	}
	
	
	
	private class Timerbundle{
		TimeoutTask minTimer = null;
		TimeoutTask maxTimer = null;
		
		public Timerbundle(long id, long minTimeout, long maxTimeout){
			System.out.println("timerbundle " + id + " min " + minTimeout + " max " + maxTimeout);
			if (minTimeout > -1){
				minTimer = new TimeoutTask(id, "minTimeout", minTimeout, this);
				clock.scheduleAtFixedRate(minTimer, minTimeout, minTimeout);
			}
			if (maxTimeout > -1){
				maxTimer = new TimeoutTask(id, "maxTimeout", maxTimeout, this);
				clock.scheduleAtFixedRate(maxTimer, maxTimeout, maxTimeout);
			}
		}
		
		public void restart(){
			if (minTimer != null){
				minTimer.restart();
			}
			if (maxTimer != null){
				maxTimer.restart();
			}
			clock.purge();
		}
		
		public void cancel(){
			if (minTimer != null){
				minTimer.cancel();
			}
			if (maxTimer != null){
				maxTimer.cancel();
			}
			clock.purge();
		}
		
	}
	
	private class TimeoutTask extends TimerTask{

		long id = -1;
		String title = "";
		long time;
		Timerbundle holder;
		
		public TimeoutTask(long key, String title, long time, Timerbundle holder){
			id = key;
			this.title = title;
			this.time = time;
			this.holder = holder;
		}
		
		public void restart(){
			this.cancel();
			TimeoutTask nT = new TimeoutTask(id, title, time, holder);
			if (title.equalsIgnoreCase("minTimeout")){
				holder.minTimer = nT;
			} else {
				holder.maxTimer = nT;
			}
			clock.scheduleAtFixedRate(nT, time, time);
		}
		
		@Override
		public void run() {
			mAppView.loadUrl("javascript:bondi.devicestatus.propertyChanged(" + id + ",null,'" + title + "')");			
		}
		
	}
	
	
}

