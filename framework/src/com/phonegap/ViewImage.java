package com.phonegap;

import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.Arrays;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Bitmap.CompressFormat;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.widget.ImageView;
import android.widget.Toast;

public class ViewImage extends Activity {
    private ImageView mIV;
    private Bitmap mBitmap;
    private int picw = 320;
    private int pich = 240;
    NotificationManager nm;
    
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle icicle) {

        super.onCreate(icicle);
        setContentView(R.layout.viewimage);
        
        nm = (NotificationManager)getSystemService(
                Context.NOTIFICATION_SERVICE);	
        
        String imageName = "defaultImage";
        try {
        	// search the last picture
        	File f = new File(Environment.getExternalStorageDirectory().getAbsolutePath());
        	f = f.getAbsoluteFile();
        	File[] files = f.listFiles(new FileFilter() {
				
				public boolean accept(File pathname) {
					return pathname.canRead() && pathname.isFile() && pathname.getAbsolutePath().endsWith("jpg");
				}
			});

        	if (files != null && files.length > 0) {
        		Arrays.sort(files);
        		//System.out.println("using: " + files[files.length-1]);
        		
            	FileInputStream fIn = new FileInputStream(files[files.length-1]);
            	imageName = files[files.length-1].getAbsolutePath();
            	
            	//InputStreamReader isr = new InputStreamReader(fIn);
            	mBitmap = BitmapFactory.decodeStream(fIn);
            	//BitmapFactory.Options opt = new BitmapFactory.Options();
            	//mBitmap = BitmapFactory.decodeFile("/data/data/com.phonegap.demo/files/picture109_10_3__10__16_0.bmp", opt);
        	}
        	
        } catch (Exception e) {
        	Log.e("MyLog", e.toString());
        }

        Context context = getApplicationContext();
		CharSequence text = "loaded the image: " +  imageName;
		int duration = Toast.LENGTH_LONG;

		Toast toast = Toast.makeText(context, text, duration);
		toast.setGravity(Gravity.BOTTOM|Gravity.CENTER, 0, 0);
		toast.show();
        if (mBitmap == null) {
        	mBitmap = BitmapFactory.decodeResource(getResources(), R.drawable.pic1);  
        }
        picw = mBitmap.getWidth();
        pich = mBitmap.getHeight();
        
        mIV = (ImageView)findViewById(R.id.picview);
        if (mIV != null) {
        	mIV.setImageBitmap(mBitmap);
        	mIV.invalidate();
        	mIV.invalidate();
        	mIV.refreshDrawableState();
        	//System.out.println("image painted: " + imageName + " w=" + picw + " h=" + pich);
        }
        
    }
    
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
	    if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER) {
		
		// Perform the tinting operation
		TintThePicture(20);	

		// Display a short message on screen
		//mm.notifyWithText(56789, new Notification("Picture was tinted", 1, null);

		// Save the result
		SaveThePicture();					        		     		         
		
	        return (true);
	    }
	    
	    return super.onKeyDown(keyCode, event);
	}
    
    // Implement the tinting algorithm
    private void TintThePicture(int deg) {		       
	int[] pix = new int[picw * pich];	
	mBitmap.getPixels(pix, 0, picw, 0, 0, picw, pich);
	        	        
	int RY, GY, BY, RYY, GYY, BYY, R, G, B, Y;	        
	double angle = (3.14159d * (double)deg) / 180.0d;	        
	int S = (int)(256.0d * Math.sin(angle));	        
	int C = (int)(256.0d * Math.cos(angle));
	
	for (int y = 0; y < pich; y++)	    
	for (int x = 0; x < picw; x++)
	    {	    	    	
	    int index = y * picw + x;	    	    	
	    int r = (pix[index] >> 16) & 0xff;	    
	    int g = (pix[index] >> 8) & 0xff;	    	    	
	    int b = pix[index] & 0xff;	    	    	
	    RY = (70 * r - 59 * g - 11 * b) / 100;	    	    	
	    GY = (-30 * r + 41 * g - 11 * b) / 100;	    	    	
	    BY = (-30 * r - 59 * g + 89 * b) / 100;	    	    	
	    Y = (30 * r + 59 * g + 11 * b) / 100; 	        	
	    RYY = (S * BY + C * RY) / 256;	    	    	
	    BYY = (C * BY - S * RY) / 256;	    	    	
	    GYY = (-51 * RYY - 19 * BYY) / 100;	    	    	
	    R = Y + RYY;	    	    	
	    R = (R < 0) ? 0 : ((R > 255) ? 255 : R);	    	    	
	    G = Y + GYY;	    	    	
	    G = (G < 0) ? 0 : ((G > 255) ? 255 : G);	    	    	
	    B = Y + BYY;	    	    	
	    B = (B < 0) ? 0 : ((B > 255) ? 255 : B);	   	    	
	    pix[index] = 0xff000000 | (R << 16) | (G << 8) | B;   	    		
	    }
	        
	Bitmap bm = Bitmap.createBitmap(picw, pich, null);
	bm.setPixels(pix, 0, picw, 0, 0, picw, pich); 	

	// Put the updated bitmap into the main view
	mIV.setImageBitmap(bm);	        
	mIV.invalidate();
	
	mBitmap = bm;
	pix = null;
    }
    
    // Save the result onto a file
    private void SaveThePicture() {		  
	try { 	            
	    FileOutputStream fos = super.openFileOutput("output.jpg", MODE_WORLD_READABLE);
   
	    mBitmap.compress(CompressFormat.JPEG, 75, fos);
	            		          
	    fos.flush();	           
	    fos.close();	           
	} catch (Exception e) {	        
	    Log.e("MyLog", e.toString());	           
	} 	    
    }
}
