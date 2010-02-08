package com.phonegap;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.hardware.Camera;
import android.hardware.Camera.Parameters;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

public class CameraSetFeature extends Activity implements SurfaceHolder.Callback{

    private static final String TAG = "CameraSetFeature";
    private SurfaceView mSurfaceView;
    private SurfaceHolder mSurfaceHolder;
    
    Camera mCamera;
    boolean mPreviewRunning = false;
    
    int featureID;
    int valueID;
    Intent mIntent;
    
    public void onCreate(Bundle icicle)
    {
        super.onCreate(icicle);

        Log.e(TAG, "onCreate");

        getWindow().setFormat(PixelFormat.TRANSLUCENT);

        setContentView(R.layout.setparameter);
        mSurfaceView = (SurfaceView)findViewById(R.id.surface);

        mSurfaceHolder = mSurfaceView.getHolder();
        mSurfaceHolder.addCallback(this);
        mSurfaceHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);                    
        mIntent = this.getIntent();
        
        featureID = mIntent.getIntExtra("featureID", -1);
        valueID = mIntent.getIntExtra("valueID", -1);
        
        EditText et = (EditText) findViewById(R.id.editText);
        //et.setInputType(InputType.TYPE_CLASS_TEXT);
        et.setText("Do you want to set the featureID=" + featureID + " to the valueID: " + valueID + "?");
        
        Button stopButton = (Button) findViewById(R.id.ok);
        stopButton.setOnClickListener(mSnapListener);
        
        Button cancelButton = (Button) findViewById(R.id.cancel);
        cancelButton.setOnClickListener(mCancelListener);      
    }
    
    private OnClickListener mSnapListener = new OnClickListener() {
        public void onClick(View v) {

        	//System.out.println("setting the parameters");
        	Parameters params = mCamera.getParameters();
        	mCamera.setParameters(params);
        	storeAndExit();
        }
    };
    private OnClickListener mCancelListener = new OnClickListener() {
        public void onClick(View v) {

        	//System.out.println("mCancelListener called");
    		try {
    			mIntent.putExtra("newFeatureID", featureID);
    			mIntent.putExtra("newValueID", valueID);
    			setResult(RESULT_OK, mIntent);
    		} catch(Exception e) {
         	   Log.e("MyLog", e.toString());
            } 
        	finish();
        }
    };

    public boolean onCreateOptionsMenu(android.view.Menu menu) {
    	//System.out.println("in onCreateOptionsMenu");
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
/*    
    Camera.PictureCallback mPictureCallback = new Camera.PictureCallback() {
        public void onPictureTaken(byte[] data, Camera c) {
            Log.e(TAG, "PICTURE CALLBACK: data.length = " + data.length);
            storeAndExit();
        }
    };
*/
    /*
     * We can't just store and exit, because Android freezes up when we try to cram a picture across a process in a Bundle.
     * We HAVE to compress this data and send back the compressed data  
     */
    public void storeAndExit()
    {
		try {
			mIntent.putExtra("newFeatureID", featureID);
			mIntent.putExtra("newValueID", valueID);
			setResult(RESULT_OK, mIntent);
		} catch(Exception e) {
     	   Log.e("MyLog", e.toString());
        } 
				
		Context context = mSurfaceView.getContext();
		CharSequence text = "Values successfully set";
		int duration = Toast.LENGTH_LONG;

		Toast toast = Toast.makeText(context, text, duration);
		toast.setGravity(Gravity.TOP|Gravity.LEFT, 0, 0);
		toast.show();
		
        finish();
    }
    
    public boolean onKeyDown(int keyCode, KeyEvent event)
    {
        if (keyCode == KeyEvent.KEYCODE_BACK) {        	
            return super.onKeyDown(keyCode, event);
        }
 
        if (keyCode == KeyEvent.KEYCODE_CAMERA || keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_SEARCH) {
            //System.out.println("onKeyDown");
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
    }

    public void surfaceChanged(SurfaceHolder holder, int format, int w, int h)
    {
        Log.e(TAG, "surfaceChanged");

        // XXX stopPreview() will crash if preview is not running
        //Camera.Parameters p = mCamera.getParameters();
        //p.setPreviewSize(w, h);
        //mCamera.setParameters(p);
    }

    public void surfaceDestroyed(SurfaceHolder holder)
    {
        Log.e(TAG, "surfaceDestroyed");
        mCamera.stopPreview();
        mPreviewRunning = false;
        mCamera.release();
    }

}
