package com.phonegap;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Date;

import org.apache.commons.codec.binary.Base64;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.PixelFormat;
import android.graphics.Bitmap.CompressFormat;
import android.hardware.Camera;
import android.hardware.Camera.Parameters;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MenuItem;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.Toast;

public class CameraPreview extends Activity implements SurfaceHolder.Callback{

    private static final String TAG = "PhoneGapCamera";
    private SurfaceView mSurfaceView;
    private SurfaceHolder mSurfaceHolder;
    
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

        setContentView(R.layout.preview);
        mSurfaceView = (SurfaceView)findViewById(R.id.surface);

        mSurfaceHolder = mSurfaceView.getHolder();
        mSurfaceHolder.addCallback(this);
        mSurfaceHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);                    
        mIntent = this.getIntent();
        
        quality = mIntent.getIntExtra("quality", 80);
        width = mIntent.getIntExtra("width", 240);
        height = mIntent.getIntExtra("height", 320);
        
        Button stopButton = (Button) findViewById(R.id.go);
        stopButton.setOnClickListener(mSnapListener);
    }
    
    private OnClickListener mSnapListener = new OnClickListener() {
        public void onClick(View v) {
        	// System.out.println("View: " + v.getWidth() + " " + v.getHeight()); 
        	Parameters params = mCamera.getParameters();
        	params.setPictureSize(width, height);
        	params.setPreviewSize(width, height);
        	try {
        		mCamera.setParameters(params);
        		mCamera.takePicture(null, null, mPictureCallback);
        	} catch (Throwable e) {
        		// System.out.println("onClick error:" + e);
    			
    			Log.e("MyLog3", e.toString());
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
		String dateString =  1900 + myDate.getYear() + "";
		if (myDate.getMonth() < 9) {
			dateString += "0";
		}
		dateString += myDate.getMonth() + 1;
		if (myDate.getDate() < 10) {
			dateString += "0";
		}
		dateString += myDate.getDate() + "_";
		if (myDate.getHours() < 10) {
			dateString += "0";
		}
		dateString += myDate.getHours();
		if (myDate.getMinutes() < 10) {
			dateString += "0";
		}
		dateString += myDate.getMinutes();
		if (myDate.getSeconds() < 10) {
			dateString += "0";
		}
		dateString += myDate.getSeconds();
		
		// determine the target directory
		String mediaState = Environment.getExternalStorageState();
		// System.out.println("mediaState=" + mediaState);
		boolean storeInternal = !"mounted".equals(mediaState);
		String fileNameExt = Environment.getExternalStorageDirectory() + "/picture" + dateString + ".jpg";
		String fileNameInt = "picture" + dateString + ".jpg";
		String fileName = "defaultFileName";
    	
		// store the image in an ByteArray
    	ByteArrayOutputStream jpeg_data = new ByteArrayOutputStream();
		Bitmap myMap = null;
		try {
			myMap = BitmapFactory.decodeByteArray(data, 0, data.length);
		} catch (Throwable e) {
			//e.printStackTrace();
    		mIntent.putExtra("picture", "");
			mIntent.putExtra("path", "");
			mIntent.putExtra("error", e.toString());
			setResult(RESULT_OK, mIntent); 
			finish();
			return;
		}
		
		// store the image of the disk
		try {
			if (myMap.compress(CompressFormat.JPEG, quality, jpeg_data))
			{		
				FileOutputStream stream = null;
				// System.out.println("storeInternal=" + storeInternal);
				try {
            	   if (storeInternal) {
   						// store the picture in the file system /data/data/package/files
            		   mIntent.putExtra("picture", "");
            		   mIntent.putExtra("path", "");
            		   mIntent.putExtra("error", "cannot store on SD-Card, possibly no SD-Card is present");
            		   setResult(RESULT_OK, mIntent); 
            		   finish();

            		   // Store picture into the preference directory
//                   		stream = super.openFileOutput(fileNameInt, MODE_WORLD_READABLE); // MODE_PRIVATE
//                   		fileName = fileNameInt;
            	   } else {
            		   stream = new FileOutputStream(fileNameExt, false);
            		   fileName = fileNameExt;
            	   }
                    myMap.compress(CompressFormat.JPEG, 100, stream);
                    stream.flush();
                    stream.close();
				} catch (Exception e) {
					Log.e("MyLog1", e.toString());
					//e.printStackTrace();
					mIntent.putExtra("picture", "");
					mIntent.putExtra("path", "");
					mIntent.putExtra("error", e.getMessage());
					setResult(RESULT_OK, mIntent);
					finish();
					return;
				}
			}
		
			// prepare the result data structure
			try {
				if (myMap.compress(CompressFormat.JPEG, quality, jpeg_data))
				{
					byte[] code  = jpeg_data.toByteArray();
					byte[] output = Base64.encodeBase64(code);
					String js_out = new String(output);
					mIntent.putExtra("picture", js_out);
					mIntent.putExtra("path", fileName);
					mIntent.putExtra("error", "");
					setResult(RESULT_OK, mIntent);
					finish();
					return;
				}
			} catch(Exception e) {
	     	   Log.e("MyLog2", e.toString());
	        } 

			
			// read the stored image from the file system
        	FileInputStream fIn = null;
        	if (storeInternal) {
        		fIn = openFileInput(fileName);
        	} else {
        		fIn =new FileInputStream(fileName);
        	}
        	Bitmap inBitmap = null;
        	try {
        		inBitmap = BitmapFactory.decodeStream(fIn);
        	} catch (Throwable e) {
        		mIntent.putExtra("picture", "");
				mIntent.putExtra("path", "");
				mIntent.putExtra("error", e.toString());
				setResult(RESULT_OK, mIntent);
				finish();
				return;
			}

        	// try to show the image - if no image was found, show the ByteArrayImage
			ImageView imView = (ImageView)findViewById(R.id.picview);
			if (imView != null) {
				if (inBitmap != null) {
					imView.setImageBitmap(inBitmap);
				} else {
					imView.setImageBitmap(myMap);
				}

				
				Context context = mSurfaceView.getContext();
				CharSequence text = R.string.imageStored + fileName;
				int duration = Toast.LENGTH_LONG;

				Toast toast = Toast.makeText(context, text, duration);
				toast.setGravity(Gravity.TOP|Gravity.LEFT, 0, 0);
				toast.show();
				
			}
		}
		catch(Throwable e)
		{
			//e.printStackTrace();
			Log.e("MyLog3", e.toString());
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
        Parameters p = mCamera.getParameters();
// unComment this to prevent interlacing?     
//        p.setPreviewSize(176, 144);
//        holder.setFixedSize(176, 144);
        mCamera.setParameters(p);
//        try {
//			mCamera.setPreviewDisplay(holder);
//		} catch (IOException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
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
        p.setPreviewSize(w, h);
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
