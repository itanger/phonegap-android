package com.phonegap;

import java.util.HashMap;
import java.util.Map;

import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.media.MediaScannerConnection.MediaScannerConnectionClient;
import android.net.Uri;
import android.webkit.MimeTypeMap;
import android.webkit.WebView;


public class CameraLauncher {
		
	private WebView mAppView;
	private DroidGap mGap;
	private static int defaultWidth = 320;
	private static int defaultHeight = 416;
	private Map<Integer, Boolean> occupiedBondiCams = new HashMap<Integer, Boolean>();
	
	CameraLauncher(WebView view, DroidGap gap)
	{
		mAppView = view;
		mGap = gap;
	}
	
	public boolean checkPermission(){
		boolean permission = false;
		
		PackageManager packageManager = mAppView.getContext().getPackageManager();
		String packageName = mAppView.getContext().getPackageName();
		
		int perm = packageManager.checkPermission("android.permission.CAMERA", packageName);
		
		if (perm == PackageManager.PERMISSION_GRANTED){
			permission = true;
		}
		
		return permission;
	}
	
	public void takePicture(int quality){
	//non-bondiMethod
		mGap.startCamera(quality, defaultWidth, defaultHeight, Integer.MAX_VALUE);
	}
	
	public String takePictureFile(int quality, int id) {
		//bondiMethod
		
		Boolean occupied = false;
		
		if (occupiedBondiCams.get(id) != null){
			occupied = occupiedBondiCams.get(id);
		} else {
			occupiedBondiCams.put(id, false);
		}
		
		int perm = mAppView.getContext().getPackageManager().checkPermission("android.permission.CAMERA", mAppView.getContext().getPackageName());
		if (perm == PackageManager.PERMISSION_GRANTED){
			if (occupied){
				return "occupied";
			} else { 
				mGap.startCamera(quality, defaultWidth, defaultHeight, id);
				return "unoccupied";
			}
		} else {
			return "Permission Denied";
		}
	}
	public String takePictureFile(int quality, int width, int height, int id) {
	//bondiMethod	
		
		Boolean occupied = false;
		
		if (occupiedBondiCams.get(id) != null){
			occupied = occupiedBondiCams.get(id);
		} else {
			occupiedBondiCams.put(id, false);
		}
		
		int perm = mAppView.getContext().getPackageManager().checkPermission("android.permission.CAMERA", mAppView.getContext().getPackageName());
		if (perm == PackageManager.PERMISSION_GRANTED){
			if (occupied){
				return "occupied";
			} else { 
				// now the camera is occupied until success or failure of this operation
				occupiedBondiCams.put(id, true);
				mGap.startCamera(quality, width, height, id);
				return "unoccupied";
			}
		} else {
			return "Permission Denied";
		}
	}
	
	/* Return Base64 Encoded String to JavaScript or a fileName*/
	public void processPicture( String js_out, String js_out2, int id )	{	
		// mixed method
		
		if (id != Integer.MAX_VALUE) {
			// We are in BondiMode
			occupiedBondiCams.put(id, false);
			
			// force a media reIndexing
			new MediaScannerNotifier(mAppView.getContext(), js_out2, null);
			
			// return to javascript
			mAppView.loadUrl("javascript:bondi.camera._cams["+id+"].win('" + js_out2 + "');");
		} else {
			// something out of bondi is happening
			mAppView.loadUrl("javascript:navigator.camera.win('" + js_out + "');");			
		}
		
	}
	
	public void failPicture(String err, int id) {
		if (id != Integer.MAX_VALUE) {
			//bondiMode
			occupiedBondiCams.put(id, false);
			mAppView.loadUrl("javascript:bondi.camera._cams['"+ id +"'].fail('" + err + "');");
		} else {
			mAppView.loadUrl("javascript:navigator.camera.fail('" + err + "');");
		}
		
	}
	
}
