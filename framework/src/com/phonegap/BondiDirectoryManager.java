package com.phonegap;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;

import android.os.Environment;
import android.os.StatFs;
import android.util.Log;

/**
 * A BONDI compliant class for handling files and directories
 * @author Andreas
 *
 */
public class BondiDirectoryManager {
	
	/**
	 * method testFileExists
	 * @param fileName an absolute file name
	 * @return file exists
	 */
	protected boolean testFileExists (String fileName){
		boolean status;
		if (!fileName.equals("")){
			File f = new File(fileName);
            status = f.exists();
    	}else{
    		status = false;
    	}
		return status;
	}
	
	/**
	 * @return
	 */
	protected long getFreeDiskSpace_unused(){
		/*
		 * gets the available SD card free space or returns -1 if the SD card is not mounted.
		 */
		String status = Environment.getExternalStorageState();
		long freeSpace = 0;
		if (status.equals(Environment.MEDIA_MOUNTED)) {
			try {
				File path = Environment.getExternalStorageDirectory();
				StatFs stat = new StatFs(path.getPath());
				long blockSize = stat.getBlockSize();
				long availableBlocks = stat.getAvailableBlocks();
				freeSpace = availableBlocks*blockSize/1024;
			} catch (Exception e) {e.printStackTrace(); }
		} else { return -1; }
		return (freeSpace);
	}	
	
	/**
	 * @param directoryName an absolute path
	 * @return directory successfully created
	 */
	protected boolean createDirectory(String directoryName){
		boolean status;
		if ((testSaveLocationExists(directoryName))){
			File newPath = new File(directoryName);
			status = newPath.mkdirs();
			//status = true;
		}else
			status = false;
		return status;
	}
	
	/**
	 * testSaveLocationExists
	 * @param directoryName
	 * @return
	 */
	protected boolean testSaveLocationExists(String directoryName){
		boolean status;
		File f = new File(directoryName);
		if (!f.getName().equals("") && !f.exists()) {
			status = true;
		} else {
			status = false;
		}
		return status;
	}
	
	/**
	 * deleteDirectory
	 * @param fileName
	 * @param recursive
	 * @return
	 */
	protected boolean deleteDirectory(String fileName, boolean recursive){
		boolean status;
		SecurityManager checker = new SecurityManager();
			
		if (!fileName.equals("")){
		
            File newPath = new File(fileName);
			checker.checkDelete(newPath.toString());
			status = deleteDirHelper(newPath, recursive);

		} else {
			status = false;
		}
		return status;
	}
	
    /**
     * Delete directory recursively.
     * @param orig the directory to be deleted
     * @param recurcive
     * @return everything was OK
     */
    protected boolean deleteDirHelper(final File orig, final boolean recurcive) {
    	
    	if (!orig.exists()) {
    		//System.out.println("deleteDirHelper: file does not exist: f=" + orig);
    		return false;
    	}
    	if (!orig.isDirectory()) {
    		//System.out.println("deleteDirHelper: file must be a directory: f=" + orig);
    		return false;
    	}
    	
    	// delete recursively
    	if (recurcive) {
    		File[] childs = orig.listFiles();
    		if (childs != null) {
    			for (int i = 0; i < childs.length; i++) {
    				deleteDirHelper(childs[i], recurcive);
				}
    		}
    	}
    	
    	// delete the file
    	//System.out.println("deleteDirHelper tries to delete f=" + orig);
    	String[] files = orig.list();
    	if (files == null || files.length == 0) {
    		//System.out.println("f=" + orig + " is empty");
    	} else {
    		//System.out.println("f=" + Arrays.toString(files));
    	}
    	boolean result = orig.delete();
    	//System.out.println("delete f=" + orig + " returned " + result);
    	return result;
    }
		
	/**
	 * moveToCheck
	 * Check the moveTo parameter.
	 * @param origFileName name of the file to be moved
	 * @param targetFileName the new fileName
	 * @param overwrite overwrite existing target files
	 * @return an error message; null if the method ran successfully
	 */
	protected String moveToCheck(String origFileName, String targetFileName, boolean overwrite) {

		// check the parameter
		if (origFileName == null || "".equals(origFileName)) {
			return "sourceFileName must not be null or empty";
		}

		File origFile = new File(origFileName);
		if (!origFile.canRead()) {
			return "sourceFile does not exist or is unreadable";
		}
		
		// check the target
		File targetFile = new File(targetFileName);
		File targetDirectory = targetFile.getParentFile();
		
		if (!targetDirectory.exists()) {
			return "targetDirectory does not exist";
		}
		if (!targetDirectory.isDirectory()) {
			return "targetDirectory must be a directory";
		}
		if (targetFile.exists() && !overwrite) {
			return "targetFile already exists";
		}
		return null;
	}
	/**
	 * moveTo
	 * Rename a file.
	 * @param origFileName name of the file to be moved
	 * @param targetFileName the new fileName
	 * @param overwrite overwrite existing target files
	 * @return an error message; null if the method ran successfully
	 */
	protected boolean moveTo(String origFileName, String targetFileName) {
		try {
			File origFile = new File(origFileName);
			File targetDirectory = new File(targetFileName).getParentFile();
			File targetFile = new File(targetDirectory, origFile.getName());
			return origFile.renameTo(targetFile);
		} catch (Exception e) {
			Log.w("FileSystem", "moveToCheck threw exception: "	+ e.getMessage());
			return false;
		}
	}
	
	/**
	 * copyTo
	 * @param origFileName
	 * @param targetFileName
	 * @param overwrite
	 * @return the errorCode, null if method succeeded
	 */
	protected String copyTo(String origFileName, String targetFileName, boolean overwrite) {

		InputStream in = null;
		OutputStream out = null;
		try {
			//System.out.println("Opening Files");
			File f1 = new File(origFileName);
			File f2 = new File(targetFileName);
		
			// check the parameter
			if (origFileName == null || "".equals(origFileName)) {
				return "sourceFileName must not be null or empty";
			}
			if (targetFileName == null || "".equals(targetFileName)) {
				return "targetFileName must not be null or empty";

			}
			if (!f1.canRead()) {
				return "copyTo: sourceFile does not exist or is unreadable";
			}
			File targetFile = new File(f2.getAbsolutePath()); //, f1.getName());
			if (targetFile.canRead() && !overwrite) {
				return "copyTo: targetFile already exists";
			}
			if (!f2.getParentFile().exists()) {
				return "copyTo: targetDirectory does not exist";
			}
			
			// do copy
			in = new FileInputStream(f1);
			out = new FileOutputStream(targetFile);  // For Overwrite the file.
			byte[] buf = new byte[1024]; // the copy buffer
			int len;
			while ((len = in.read(buf)) > 0) {
				out.write(buf, 0, len);
			}
		} catch (FileNotFoundException ex) {
			return ("FileNotFoundException: " + ex.getMessage());
		} catch (IOException e) {
			return ("FileIOException: " + e.getMessage());
		} finally {
			try {
				if (in != null) 
					in.close();
			} catch (Exception ignored) {
			}
			try {
				//System.out.println("try to close out");
				if (out != null) 
					out.close();
			} catch (Exception ignored) {
			}
		}
//		System.out.println("copy successful");
		return null;
	}
	
	/**
	 * delete a File
	 * @param fileName the absolute file name
	 * @return delete was successful
	 */
	protected boolean deleteFile(String fileName){
		boolean status;
		SecurityManager checker = new SecurityManager();
			
		if (!fileName.equals("")){
		
            File newPath = new File(fileName);
			checker.checkDelete(newPath.toString());
			
			if (!newPath.exists()) {
	    		//System.out.println("deleteFile failed: file does not exist: f=" + newPath);
	    		return false;
	    	}
	    	if (!newPath.isFile()) {
	    		//System.out.println("deleteFile failed: file must be a regular file: f=" + newPath);
	    		return false;
	    	}
	    	
	    	// delete the file
	    	status =  newPath.delete();	
		} else {
			status = false;
		}
		return status;
	}
	
	private File constructFilePaths (String file1, String file2){
		File newPath;
		newPath = new File(file1+"/"+file2);
		return newPath;
	}

}