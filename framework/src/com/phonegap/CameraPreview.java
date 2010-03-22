package com.phonegap;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.reflect.Method;
import java.util.Date;
import java.util.List;

import org.apache.commons.codec.binary.Base64;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.PixelFormat;
import android.graphics.Bitmap.CompressFormat;
import android.hardware.Camera;
import android.hardware.Camera.Parameters;
import android.hardware.Camera.Size;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import android.view.KeyEvent;
import android.view.MenuItem;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

public class CameraPreview extends Activity implements SurfaceHolder.Callback{

    private static final String TAG = "PhoneGapCamera";
    private SurfaceView mSurfaceView;
    private SurfaceHolder mSurfaceHolder;

    private RelativeLayout root;
    
    Camera mCamera;
    boolean mPreviewRunning = false;
    
    int quality;
    int width;
    int height;
    Intent mIntent;
    
    public void onCreate(Bundle icicle)
    {
        super.onCreate(icicle);

        Log.e(TAG, "onCreate");

        getWindow().setFormat(PixelFormat.TRANSLUCENT);
        
        RelativeLayout.LayoutParams containerParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.FILL_PARENT, 
        		ViewGroup.LayoutParams.FILL_PARENT);
        LinearLayout.LayoutParams surfaceParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.FILL_PARENT, 
        		ViewGroup.LayoutParams.FILL_PARENT, 0.0F);
        RelativeLayout.LayoutParams buttonParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, 
        		ViewGroup.LayoutParams.WRAP_CONTENT);
        
        root = new RelativeLayout(this);
        root.setLayoutParams(containerParams);
        
        mSurfaceView = new SurfaceView(this);
        mSurfaceView.setLayoutParams(surfaceParams);
        root.addView(mSurfaceView);
        
        Button stopButton = new Button(this);
        stopButton.setText("click");
        buttonParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        buttonParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        buttonParams.rightMargin = 5;
        buttonParams.topMargin = 5;
        
        stopButton.setLayoutParams(buttonParams);
        root.addView(stopButton);
        
        setContentView(root);
        
        mSurfaceHolder = mSurfaceView.getHolder();
        mSurfaceHolder.addCallback(this);
        mSurfaceHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);                    
        mIntent = this.getIntent();
            	        
        quality = mIntent.getIntExtra("quality", 80);
        width = mIntent.getIntExtra("width", 240);
        height = mIntent.getIntExtra("height", 320);
        
        stopButton.setOnClickListener(mSnapListener);        
    }
    
    /**
     * Chooses the best-fitting size out of a list, that means the size that
     * has the least distance to what we originally wished for.
     * 
     * @param pSizes List of Sizes to choose from
     * @param width  the width we want to be as near as possible too
     * @param height the height we want to be as near as possible too.
     * @return the size that has the least overall distance to the size described 
     * by our parameters or null if the list was empty. If the parameters describe a picturesize
     * that is greater than the biggest avaiable size the biggest one will be choosen.
     */
    private Size getBestSize(List<Size> pSizes, int width, int height){
    	Size resSize = null;
    	int bestDist = Integer.MAX_VALUE;

    	if (pSizes != null){
    		for (Size pSize : pSizes){
    			int hDist = Math.abs(pSize.height - height);
    			int wDist = Math.abs(pSize.width - width);
    			if ( bestDist > (hDist + wDist)){
    				bestDist = hDist + wDist;
    				resSize = pSize;
    			}
    		}
    	}
    	return resSize;
    }
    
   private OnClickListener mSnapListener = new OnClickListener() {
        public void onClick(View v) {
        	// System.out.println("View: " + v.getWidth() + " " + v.getHeight()); 
        	Parameters params = mCamera.getParameters();
        	
        	// due to interface changes in Android 2.0, we use reflection to invoke the method getSupportedPreviewSizes
        	// this prevents verificationErrors and allows us to invoke the method when the methd is available
        	// on some device, supportedPreviewSizes is might null, but getBestSize handles this case
        	List<Size> supportedPreviewSizes = null;
        	try {
        		Method methodGetSupportedPreviewSizes = Camera.Parameters.class.getMethod("getSupportedPreviewSizes", new Class[0]);
        		supportedPreviewSizes = (List<Size>) methodGetSupportedPreviewSizes.invoke(params, new Object[0]);
			} catch (Exception e) {
	            		Log.e(TAG, "getSupportedPreviewSizes failed");
	   		}
        	
        	Size bestSize = getBestSize(supportedPreviewSizes, width, height);
        	if (bestSize != null){
        		// if the camera provides a list of previewSizes, take the one that fits best our parameters
        		// else just leave all at it is at the moment to prevent crashes
        		params.setPreviewSize(bestSize.width, bestSize.height);
        	}
        	
        	// due to interface changes in Android 2.0, we use reflection to invoke the method getSupportedPreviewSizes
        	// this prevents verificationErrors and allows us to invoke the method when the method is available
        	// on some device, supportedPictureSizes is might null, but getBestSize handles this case
        	List<Size> supportedPictureSizes = null;
			try {
				Method methodGetSupportedPictureSizes = Camera.Parameters.class.getMethod("getSupportedPictureSizes", new Class[0]);
				supportedPictureSizes = (List<Size>) methodGetSupportedPictureSizes.invoke(params, new Object[0]);
			} catch (Exception e) {
				Log.e(TAG, "getSupportedPictureSizes failed");
    		}       	
        		
        	bestSize = getBestSize(supportedPictureSizes, width, height);

        	if (bestSize != null){
        		// if the camera provides a list of picturesizes, take the one that fits best our parameters
        		// else just leave all at it is at the moment to prevent crashs
        		params.setPictureSize(bestSize.width, bestSize.height);
        	}
        	
        	try {
        		
        		mCamera.setParameters(params);
        		mCamera.takePicture(null, null, mPictureCallback);
        	} catch (Throwable e) {
    			Log.e(TAG, e.toString(), e);
    			mIntent.putExtra("picture", "");
    			mIntent.putExtra("path", "");
    			mIntent.putExtra("error", e.toString());
    			setResult(RESULT_OK, mIntent);
    			finish();
        	}
        }
    };

    public boolean onCreateOptionsMenu(android.view.Menu menu) {
        MenuItem item = menu.add(0, 0, 0, "goto gallery");
        item.setOnMenuItemClickListener(new MenuItem.OnMenuItemClickListener() {
            public boolean onMenuItemClick(MenuItem item) {
                Uri target = Uri.parse("content://media/external/images/media");
                Intent intent = new Intent(Intent.ACTION_VIEW, target);
                startActivity(intent);
                return true;
            }
        });
        return true;
    }
    
    @Override
    protected void onRestoreInstanceState(Bundle savedInstanceState)
    {
        super.onRestoreInstanceState(savedInstanceState);
    }

    /*
     * We got the data, send it back to PhoneGap to be handled and processed.
     * 
     */
    
    Camera.PictureCallback mPictureCallback = new Camera.PictureCallback() {
        public void onPictureTaken(byte[] data, Camera c) {
            Log.e(TAG, "PICTURE CALLBACK: data.length = " + data.length);
            storeAndExit(data);
        }
    };

    /*
     * We can't just store and exit, because Android freezes up when we try to cram a picture across a process in a Bundle.
     * We HAVE to compress this data and send back the compressed data  
     */
    public void storeAndExit(byte[] data)
    {
		// generate a valid file name
    	Date myDate = new Date();
		String dateString =  1900 + myDate.getYear() + "-";
		if (myDate.getMonth() < 9) {
			dateString += "0";
		}
		dateString += myDate.getMonth() + 1;
		dateString += "-";
		if (myDate.getDate() < 10) {
			dateString += "0";
		}
		dateString += myDate.getDate() + "_";
		if (myDate.getHours() < 10) {
			dateString += "0";
		}
		dateString += myDate.getHours();
		dateString += ".";
		if (myDate.getMinutes() < 10) {
			dateString += "0";
		}
		dateString += myDate.getMinutes();
		dateString += ".";
		if (myDate.getSeconds() < 10) {
			dateString += "0";
		}
		dateString += myDate.getSeconds();
		
		// determine the target directory
		String mediaState = Environment.getExternalStorageState();
		// System.out.println("mediaState=" + mediaState);
		boolean sdCardAvail = !"mounted".equals(mediaState);
		String fileNameExt = Environment.getExternalStorageDirectory() + "/DCIM/Camera/" + dateString + ".jpg";
		String fileName = "defaultFileName";
    	
		// store the image in an ByteArray
		ByteArrayOutputStream jpeg_data = new ByteArrayOutputStream();
		Bitmap myMap = null;
		try {
			myMap = BitmapFactory.decodeByteArray(data, 0, data.length);
		} catch (Throwable e) {
			Log.e(TAG, "cannot decode bitmap", e);
    		mIntent.putExtra("picture", "");
			mIntent.putExtra("path", "");
			mIntent.putExtra("error", e.toString());
			setResult(RESULT_OK, mIntent); 
			finish();
			return;
		}
		
		// store the image of the disk
		try {
			if (myMap.compress(CompressFormat.JPEG, quality, jpeg_data)) {		
				FileOutputStream stream = null;
				try {
            	   if (sdCardAvail) {
            		   mIntent.putExtra("picture", "");
            		   mIntent.putExtra("path", "");
            		   mIntent.putExtra("error", "cannot store on SD-Card, possibly no SD-Card is present");
            		   setResult(RESULT_OK, mIntent); 
            		   finish();
            	   } else {
            		   // if the image directory does not exist, try to create it
            		   File imageDirectory = new File(fileNameExt).getParentFile();
            		   if (!imageDirectory.exists()) {
            			   imageDirectory.mkdirs();
            		   }
            		   // store the image in the image directory
            		   stream = new FileOutputStream(fileNameExt, false);
            		   fileName = fileNameExt;
            	   }
                    if ( myMap.compress(CompressFormat.JPEG, 100, stream) ) {
                    	Log.i(TAG, "wrote image to "+fileNameExt);
                    } else {
                    	Log.e(TAG, "error writing image to "+fileNameExt);
                    }
                    if ( stream != null ) {
                    	stream.flush();
                    }
				} catch (Exception e) {
					Log.e(TAG, "error storing image to "+fileNameExt, e);
					mIntent.putExtra("picture", "");
					mIntent.putExtra("path", "");
					mIntent.putExtra("error", e.getMessage());
					setResult(RESULT_OK, mIntent);
					finish();
					return;
				} finally {
					if ( stream != null) {
						try {
						stream.close();
						} catch ( IOException e) {
							Log.e(TAG, "cannot close stream", e);
						}
					}
				}
			} else {
				Log.e(TAG, "cannot compress image");
			}
		
			// prepare the result data structure
			try {
				if (myMap.compress(CompressFormat.JPEG, quality, jpeg_data)) {
					byte[] code  = jpeg_data.toByteArray();
					byte[] output = Base64.encodeBase64(code);
					String js_out = new String(output);
					mIntent.putExtra("picture", js_out);
					mIntent.putExtra("path", fileName);
					mIntent.putExtra("error", "");
					setResult(RESULT_OK, mIntent);
				} else {
					Log.e(TAG, "cannot compress the stream");
				}
			} catch(Exception e) {
	     	   Log.e(TAG, "error while encoding Base64", e);
			}
		} catch(Throwable e) {
			// TODO: do better exception handling here......
			Log.e(TAG, "something went wrong", e);
			mIntent.putExtra("picture", "");
			mIntent.putExtra("path", "");
			mIntent.putExtra("error", e.toString());
			setResult(RESULT_OK, mIntent);
			finish();
			return;
		}
        finish();
        return;
    }
    
    public boolean onKeyDown(int keyCode, KeyEvent event)
    {
        if (keyCode == KeyEvent.KEYCODE_BACK) {        	
            return super.onKeyDown(keyCode, event);
        }
 
        if (keyCode == KeyEvent.KEYCODE_CAMERA || keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_SEARCH) {
            mCamera.takePicture(null, null, mPictureCallback);
            return true;
        }

        return false;
    }

    protected void onResume()
    {
        Log.e(TAG, "onResume");
        super.onResume();
    }

    protected void onSaveInstanceState(Bundle outState)
    {
        super.onSaveInstanceState(outState);
    }

    protected void onStop()
    {
        Log.e(TAG, "onStop");
        super.onStop();
    }

    public void surfaceCreated(SurfaceHolder holder)
    {
        Log.e(TAG, "surfaceCreated");
        mCamera = Camera.open();
        //mCamera.startPreview();
    }

    public void surfaceChanged(SurfaceHolder holder, int format, int w, int h)
    {
        Log.e(TAG, "surfaceChanged");

        // XXX stopPreview() will crash if preview is not running
        if (mPreviewRunning) {
            mCamera.stopPreview();
        }

        Camera.Parameters p = mCamera.getParameters();
        
        // due to interface changes in Android 2.0, we use reflection to invoke the method getSupportedPreviewSizes
        // this prevents verificationErrors and allows us to invoke the method when the methd is available
        // on some device, supportedPreviewSizes is might null, but getBestSize handles this case
        List<Size> supportedPreviewSizes = null;
        try {
        	Method methodGetParameters = Camera.Parameters.class.getMethod("getSupportedPreviewSizes", new Class[0]);
        	supportedPreviewSizes = (List<Size>) methodGetParameters.invoke(p, new Object[0]);
        } catch (Exception e) {
        	Log.e(TAG, "getSupportedPreviewSizes failed");
        }
        
        Size bestSize = getBestSize(supportedPreviewSizes, w, h);

    	if (bestSize != null){
    		// if the camera provides a list of picturesizes, take the one that fits best our parameters
    		// else just leave all at it is at the moment to prevent crashs
    		p.setPreviewSize(bestSize.width, bestSize.height);
    	}
    	
        mCamera.setParameters(p);
        try {
			mCamera.setPreviewDisplay(holder);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        mCamera.startPreview();
        mPreviewRunning = true;
    }

    public void surfaceDestroyed(SurfaceHolder holder)
    {
        Log.e(TAG, "surfaceDestroyed");
        mCamera.stopPreview();
        mPreviewRunning = false;
        mCamera.release();
    }

}
