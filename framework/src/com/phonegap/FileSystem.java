package com.phonegap;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.commons.codec.binary.Base64;
import org.json.JSONArray;
import org.json.JSONObject;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Environment;
import android.os.StatFs;
import android.util.Log;
import android.webkit.WebView;

/**
 * The file system interface implementation for Java Script. It provides several
 * helpers for accessing files on Android.
 * 
 * @author gorski
 * 
 */
public class FileSystem {

	/**
	 * Compile time option: set true if opening files in 'append' and not
	 * 'write' mode should prevent any access to existing data.<br>
	 * 
	 * Default: true.
	 */
	private static final boolean CHECK_APPEND_ORIGINAL_SIZE = true;

	/**
	 * Compile time option: set true if reads and writes should advance the
	 * current position in the file.<br>
	 * 
	 * Default: true.
	 */
	private static final boolean IO_OPERATIONS_MODIFY_POSITION = true;

	/**
	 * Container class for holding the file stream state.
	 * 
	 * @author Jonas Gorski
	 * 
	 */
	private static class FileStreamData {
		RandomAccessFile target;
		String encoding;
		boolean read = false;
		boolean write = false;
		boolean append = false;
		long size = 0L;
	}

	/**
	 * This class is responsible for propagating mount events to the listeners
	 * in java script.
	 * 
	 * @author Jonas Gorski
	 * 
	 */
	private static class MountEventReceiver extends BroadcastReceiver {
		WebView mView;

		@Override
		public void onReceive(Context context, Intent intent) {
			if ("android.intent.action.MEDIA_MOUNTED"
					.equals(intent.getAction())) {
				mView.loadUrl("javascript:Bondi.filesystem.mounted('sdcard')");
			} else {
				mView
						.loadUrl("javascript:Bondi.filesystem.unmounted('sdcard')");
			}
		}
	}

	/**
	 * The Filter for Mount and Unmount events.
	 */
	private static final IntentFilter MOUNT_EVENTS;

	private static final String PERMISSION_DENIED_ERROR;
	private static final String IO_ERROR;
	private static final String INVALID_ARGUMENT;

	static {
		// create common error codes.

		Map<String, Object> result = new HashMap<String, Object>();
		result.put("error", Short.valueOf((short) 20000));
		PERMISSION_DENIED_ERROR = new JSONObject(result).toString();
		result.put("error", Short.valueOf((short) 10004));
		IO_ERROR = new JSONObject(result).toString();
		result.put("error", Short.valueOf((short) 10001));
		INVALID_ARGUMENT = new JSONObject(result).toString();
		MOUNT_EVENTS = new IntentFilter();
		MOUNT_EVENTS.addAction("android.intent.action.MEDIA_MOUNTED");
		MOUNT_EVENTS.addAction("android.intent.action.MEDIA_UNMOUNTED");
		MOUNT_EVENTS.addDataScheme("file");

	}

	/**
	 * The actual Receiver.
	 */
	private MountEventReceiver receiver;

	private WebView mAppView;
	private Context mCtx;

	/**
	 * Locations available when the external storage is mounted.
	 */
	private Map<String, String> locationsMounted = new HashMap<String, String>();
	/**
	 * Locations available when the external storage is unmounted.
	 */
	private Map<String, String> locationsUnmounted = new HashMap<String, String>();

	BondiDirectoryManager fileManager;

	private static Map<Integer, FileStreamData> openFiles = new HashMap<Integer, FileStreamData>();
	private AtomicInteger nextFD = new AtomicInteger(0);

	/**
	 * Default Constructor for the FileSystem.
	 * 
	 * @param ctx
	 * @param appView
	 */
	public FileSystem(Context ctx, WebView appView) {
		this.fileManager = new BondiDirectoryManager();
		this.mAppView = appView;
		this.mCtx = ctx;
		this.receiver = new MountEventReceiver();
		this.receiver.mView = this.mAppView;

		this.locationsMounted.put("documents", Environment
				.getExternalStorageDirectory().getAbsolutePath());
		this.locationsMounted.put("sdcard", Environment
				.getExternalStorageDirectory().getAbsolutePath());
		this.locationsMounted.put("images", Environment
				.getExternalStorageDirectory().getAbsolutePath() + "/DCIM/Camera/");
		this.locationsMounted.put("temp", Environment
				.getDownloadCacheDirectory().getAbsolutePath());
//		this.locationsUnmounted.put("wgt-private", Environment
//				.getExternalStorageDirectory().getAbsolutePath());
//		this.locationsUnmounted.put("wgt-public", Environment
//				.getExternalStorageDirectory().getAbsolutePath());
//		this.locationsUnmounted.put("wgt-tmp", Environment
//				.getDownloadCacheDirectory().getAbsolutePath());
//		this.locationsUnmounted.put("wgt-package", Environment
//				.getExternalStorageDirectory().getAbsolutePath());
//		this.locationsUnmounted.put("video", Environment
//				.getExternalStorageDirectory().getAbsolutePath());
	}

	/**
	 * Registers the Broadcast Receiver for the mount events.
	 */
	void registerReceiver() {
		this.mCtx.registerReceiver(receiver, MOUNT_EVENTS);
	}

	/**
	 * Unregisters the Broadcast Receiver for the mount events.
	 */
	void unregisterReceiver() {
		this.mCtx.unregisterReceiver(receiver);
	}

	/**
	 * Closes the File Stream associated with the given id. Always succeeds.
	 * 
	 * @param id
	 *            the id of the file stream.
	 */
	public void close(String id) {
		FileStreamData fsd = openFiles.remove(Integer.valueOf(id));
		if (fsd != null) {
			try {
				fsd.target.close();
			} catch (IOException e) {
				Log.w("FileSystem", "Closing fid=" + id + " threw exception: "
						+ e.getMessage());
			}
		}
	}

	/**
	 * Returns the default Location, or null if not existent or not enough free
	 * space.
	 * 
	 * @param location
	 * @param size
	 *            free space
	 * @return the location, or null
	 */
	public String getDefaultLocation(String location, long size) {
		String target = null;
		if (Environment.getExternalStorageState().equals(
				Environment.MEDIA_MOUNTED)) {
			target = locationsMounted.get(location);
		} else {
			target = locationsUnmounted.get(location);
		}
		if (target != null && size > 0) {
			StatFs stat = new StatFs(target);
			long free = stat.getAvailableBlocks() * stat.getBlockSize();
			if (free < size) {
				return null;
			}
		}
		
		// create location if location does not exist
		try {
			File targetFile = new File(target);
			if (!targetFile.exists()) {
				targetFile.mkdirs();
			}
		} catch (Exception e) {
			//Log.w("FileSystem", e.getMessage());
			e.printStackTrace();
		}
		return target;
	}

	public String getRootLocations() {

		try {
			if (Environment.getExternalStorageState().equals(
					Environment.MEDIA_MOUNTED))
				return new JSONArray(this.locationsMounted.keySet()).toString();
			else
				return new JSONArray(this.locationsUnmounted.keySet())
						.toString();

		} catch (SecurityException e) {
			return null;
		}
	}

	/**
	 * @param location
	 * @return
	 */
	public String resolve(String location) {
		Map<String, Object> result = new HashMap<String, Object>();
		File temp = new File(location);
		boolean canRead = false;
		try {
			if (!temp.isDirectory()) {
				canRead = temp.canRead();
			} else {
 				canRead = true;
			}
		} catch (Exception se) {
			canRead = false;
		}
		if (!canRead) {
			return getIO_Error("Could not read location " + location + " possibly this location does not exist");
//			return IO_ERROR;
		} else {
			if (temp.isDirectory()) {
				result.put("readonly", Boolean.valueOf(false));
			} else {
				result.put("readonly", Boolean.valueOf(!temp.canWrite()));
			}
			result.put("name", temp.getName() + "");
			result.put("path", temp.getParentFile().getAbsolutePath() + "");
			result.put("absolutepath", temp.getAbsolutePath() + "");
			result.put("filesize", Long.valueOf(temp.length()));
			result.put("created", Long.valueOf(temp.lastModified()));
			result.put("modified", Long.valueOf(temp.lastModified()));
			result.put("isfile", Boolean.valueOf(temp.isFile()));
			result.put("isdirectory", Boolean.valueOf(temp.isDirectory()));
			result.put("parent", temp.getParent());
		}
		String rslt = new JSONObject(result).toString();
		return rslt;

	}

	/**
	 * @param location
	 * @param basePath
	 * @return
	 */
	public String resolve(String location, String basePath) {
		Map<String, Object> result = new HashMap<String, Object>();

		File temp = new File(basePath, location);
		boolean canReadInfo = true;
		try {
			canReadInfo = temp.exists();
			//canReadInfo = true;
		} catch (SecurityException se) {
			canReadInfo = false;
			Log.w("FileSystem", se.getMessage());
			result.put("error", Short.valueOf((short) 20000));
		}
		if (canReadInfo) {
			result.put("error", null);
			result.put("readonly", Boolean.valueOf(!temp.canWrite()));
			result.put("name", temp.getName());
			result.put("path", temp.getParentFile().getAbsolutePath());
			result.put("absolutepath", temp.getAbsolutePath());
			result.put("filesize", Long.valueOf(temp.length()));
			result.put("created", Long.valueOf(temp.lastModified()));
			result.put("modified", Long.valueOf(temp.lastModified()));
			result.put("isfile", Boolean.valueOf(temp.isFile()));
			result.put("isdirectory", Boolean.valueOf(temp.isDirectory()));
			result.put("parent", temp.getParent());
		} else {
			result.put("error", Short.valueOf((short) 10004));
		}
		String rslt = new JSONObject(result).toString();
		// Log.w("FileSystem", rslt == null ? "null!" : rslt);
		return rslt;
	}

	public String listFiles(String location) {
		try {
			if (!new File(location).isDirectory()) {
				return getIO_Error("Location " + location + " is no directory");
//				return IO_ERROR;
			}
			Map<String, Object> result = new HashMap<String, Object>();
			result.put("files", new JSONArray(Arrays.asList(new File(location).list())));
			return new JSONObject(result).toString();
		} catch (SecurityException e) {
			return getSecurityError(e.getMessage());
//			return PERMISSION_DENIED_ERROR;
		}
	}

	/**
	 * copyTo
	 * 
	 * @param orig
	 * @param target
	 * @param overwerite
	 * @return
	 */
	public void copyTo(final String orig, final String target,
			final boolean overwrite) {
		Log.w("FileSystem", "copyTo " + orig + " target:" + target);

		String status = "";
		
		// check for invalid chars
		if (target == null || !target.matches("[A-z,0-9_\\-\\/\\ ]+")) {
			mAppView.loadUrl("javascript:bondi.filesystem.fail(new DeviceAPIError(10004,'invalid filename'));");
			return;
		}
		
		// do copy
		try {
			status = fileManager.copyTo(orig, target, overwrite);
		} catch (SecurityException e) {
			status = e.getMessage();
		}
		
		// callBack to javaScript
		if (status == null) {
			// System.out.println("Load success");
			mAppView.loadUrl("javascript:bondi.filesystem.success(bondi.filesystem.resolveSynchron('" + target + "'));");
		} else {
			// System.out.println("Load fail"); // maybe forward the status
			// message should be forwarded;
			mAppView.loadUrl("javascript:bondi.filesystem.fail(new DeviceAPIError(10004,'" + status + "'));");
		}
	}

	/**
	 * moveTo
	 * 
	 * @param orig
	 * @param target
	 * @param overwerite
	 * @return
	 */
	public String moveTo(final String orig, final String target,
			final boolean overwrite) {
		Log.w("FileSystem", "moveTo " + orig + " target:" + target);
		String status = fileManager.moveToCheck(orig, target, overwrite);
		if (status != null) {
			return status;
		}
		
		if (target == null || !target.matches("[A-z,0-9_\\-\\/\\ ]+")) {
			mAppView.loadUrl("javascript:bondi.filesystem.fail(new DeviceAPIError(10004,'invalid filename'));");
			return null;
		}
		
		Thread t = new Thread() {
			public void run() {
				Log.w("FileSystemThread", "moveTo Thread running! " + orig + " target:" + target);
				boolean success;
				String error = "";
				try {
					success = fileManager.moveTo(orig, target);
				} catch (SecurityException e) {
					Log.w("FileSystemThread moveTo failed", e);
					success = false;
				}
				if (success) {
					mAppView.loadUrl("javascript:bondi.filesystem.success(bondi.filesystem.resolveSynchron('" + target + "'));");
				} else {
					mAppView.loadUrl("javascript:bondi.filesystem.fail(new DeviceAPIError(10004,'could not move file'));");
				}
			}
		};
		t.start();
		return null;
	}

	/**
	 * Create a rafObject and store it in the global hashMap.
	 * 
	 * @param fileName
	 * @param mode
	 * @param encoding
	 * @return
	 */
	public String open(String fileName, String mode, String encoding) {
		Log.d("FileSystem", "open(" + fileName + "," + mode + "," + encoding
				+ ")");
		if ("".equals(fileName)) {
			//System.out.println("fileName must not be empty");
			return "";
		}
		
		// check whether the file already exists and is a directory
		File dirCheckFile = new File(fileName);
		if (dirCheckFile.exists() && dirCheckFile.isDirectory()) {
			return getIO_Error(fileName + " could not be opend. This is no file, but a directory");
//			return IO_ERROR;
		}
		
		FileStreamData fsd = new FileStreamData();
		char[] modes = mode.toCharArray();
		for (char m : modes) {
			switch (m) {
			case 'r':
				fsd.read = true;
				break;
			case 'w':
				fsd.write = true;
				break;
			case 'a':
				fsd.append = true;
				break;
			default:
				Log.e("FileSystem", "open: invalid mode: " + m);
				return getINVALID_ARGUMENT_ERROR("mode has to be r, w or a");
//				return INVALID_ARGUMENT;
			}
		}
		if (!(fsd.read || fsd.write || fsd.append)) {
			Log.e("FileSystem", "open: no mode specified");
			return getINVALID_ARGUMENT_ERROR("FileSystem, open: no mode specified");
//			return INVALID_ARGUMENT;
		}

		if (encoding == null) {
			return getINVALID_ARGUMENT_ERROR("missing encoding");
//			return INVALID_ARGUMENT;
		}
		if (!"UTF-8".equals(encoding) && !"ISO8859-1".equals(encoding)) {
			return getINVALID_ARGUMENT_ERROR("Encoding has to be UTF-8 or ISO8859-1");
//			return INVALID_ARGUMENT;
		}			

		RandomAccessFile raf = null;
		try {
			raf = new RandomAccessFile(fileName,
					("r" + ((fsd.write || fsd.append) ? "w" : "")));
			// need to know the original size for 'append'
			fsd.size = raf.length();
			fsd.target = raf;

		} catch (FileNotFoundException e) {
			return getIO_Error("File with name " + fileName + " was not found. Exception: " + e.getMessage());
//			return IO_ERROR;
		} catch (IOException e) {
			return getIO_Error("IO Exception: " + e.getMessage());
//			return IO_ERROR;
		}
		// create a UID

		fsd.encoding = encoding;
		// store the fileDiscriptor
		String fid = createFID(fsd);
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("fd", fid);
		return new JSONObject(map).toString();
	}

	/**
	 * Generator for FileIDs.
	 * 
	 * @param fsd
	 * @return
	 */
	private String createFID(FileStreamData fsd) {
		Integer fid = nextFD.incrementAndGet();
		openFiles.put(fid, fsd);
		return fid.toString();
	}

	/**
	 * Returns the file size of the file behind the stream.
	 * 
	 * @param id
	 *            the id of the stream
	 * @return the size, or -1
	 */
	public long getSize(String id) {
		FileStreamData fsd = openFiles.get(Integer.valueOf(id));
		if (fsd == null)
			return -1;
		try {
			return fsd.target.length();
		} catch (IOException e) {
			return -1;
		}
	}

	public String read(String id, long position, long charCount) {
		FileStreamData fsd = openFiles.get(Integer.valueOf(id));
		if (fsd == null) {
			return getIO_Error("invalid fileID, could not find file");
//			return IO_ERROR;
		}
		RandomAccessFile target = fsd.target;
		if (target == null) {
			return getIO_Error("invalid fileAccess");
//			return IO_ERROR;
		}
		try {
			if (charCount == 0)
				charCount = Long.MAX_VALUE;
			String result = null;
			target.seek(position);
			if ("UTF-8".equals(fsd.encoding)) {
				int read = 0;

				while (read < charCount) {
					int readByte = target.read();
					if (readByte == -1)
						break;
					read++;
					if (readByte < 128) {
						continue;
					}
					if (readByte >= 192 && readByte < 224) {
						// beginning 2-byte char
						target.skipBytes(1);
						continue;
					}
					if (readByte >= 224 && readByte < 240) {
						// beginning 3-byte char
						target.skipBytes(2);
						continue;
					}
					Log.w("FileSystem", "Invalid unicode Char!");
					return getIO_Error("Invalid unicode Char!");
//					return IO_ERROR;
				}

				long newpos = target.getFilePointer();
				int toRead = (int) (newpos - position);
				byte raw[] = new byte[toRead];
				target.seek(position);
				target.readFully(raw);
				result = new String(raw, "UTF-8");
			} else {
				int toRead = (int) Math.min(target.length() - position,
						charCount);
				byte raw[] = new byte[toRead];
				Log.d("FileSystem", "Reading " + charCount + " bytes..");
				target.readFully(raw);
				Log.d("FileSystem", "Read.");
				result = new String(raw, "ISO8859-1");
				Log.d("FileSystem", "Converted to String.");
			}
			Map<String, Object> data = new HashMap<String, Object>();
			data.put("data", result);
			data.put("new_pos", IO_OPERATIONS_MODIFY_POSITION ? Long
					.valueOf(target.getFilePointer()) : Long.valueOf(position));
			return new JSONObject(data).toString();
		} catch (IOException io) {
			return getIO_Error(io.getMessage());
//			return IO_ERROR;
		}
	}

	/**
	 * The encoding is ignored, we read bytes.
	 * 
	 * @param id
	 * @param byteCount
	 * @return
	 */
	public String readBytes(String id, long position, long byteCount) {
		FileStreamData fsd = openFiles.get(Integer.valueOf(id));
		if (fsd == null)
			return getIO_Error("Could not open stream to file " + id);
//			return IO_ERROR;
		RandomAccessFile target = fsd.target;
		if (target == null)
			return getIO_Error("Could not open file " + id);
//			return IO_ERROR;
		try {
			if (byteCount == 0)
				byteCount = Long.MAX_VALUE;
			byteCount = Math.min(target.length() - position, byteCount);
			byte[] bytes = new byte[(int) byteCount];
			target.seek(position);
			target.readFully(bytes);
			Map<String, Object> data = new HashMap<String, Object>();
			char[] bytesAsChar = new char[(int) byteCount];
			for (int i = 0; i < byteCount; i++) {
				bytesAsChar[i] = (char) (bytes[i] & 0xFF);
			}
			data.put("data", String.valueOf(bytesAsChar));
			data.put("new_pos", IO_OPERATIONS_MODIFY_POSITION ? Long
					.valueOf(target.getFilePointer()) : Long.valueOf(position));
			return new JSONObject(data).toString();
		} catch (IOException io) {
			return getIO_Error("IOException: " + io.getMessage());
//			return IO_ERROR;
		}
	}

	public String read64(String id, long position, long byteCount) {
		FileStreamData fsd = openFiles.get(Integer.valueOf(id));
		if (fsd == null)
			return getIO_Error("Could not open filestream with id " + id);
//			return IO_ERROR;
		RandomAccessFile target = fsd.target;
		if (target == null)
			return getIO_Error("Could not open file " + id);
//			return IO_ERROR;
		try {
			if (byteCount == 0)
				byteCount = Long.MAX_VALUE;
			byteCount = Math.min(target.length() - position, byteCount);
			byte[] bytes = new byte[(int) byteCount];
			target.seek(position);
			target.readFully(bytes);
			Map<String, Object> data = new HashMap<String, Object>();
			byte[] base64 = Base64.decodeBase64(bytes);
			data.put("data", new String(base64, "ISO8859-1"));
			data.put("new_pos", IO_OPERATIONS_MODIFY_POSITION ? Long
					.valueOf(target.getFilePointer()) : Long.valueOf(position));
			return new JSONObject(data).toString();
		} catch (IOException io) {
			return getIO_Error("IO Exception " + io.getMessage());
//			return IO_ERROR;
		}
	}

	/**
	 * Writes an string to the steam using the character encoding specified on
	 * creation of the stream.
	 * 
	 * @param id
	 *            the id of the stream
	 * @param position
	 *            the position
	 * @param stringData
	 *            the string
	 * @return the new position, or an error code.
	 */
	public String write(String id, long position, String stringData) {
		FileStreamData fsd = openFiles.get(Integer.valueOf(id));
		if (fsd == null)
			return getIO_Error("Could not open filestream with id " + id);
//			return IO_ERROR;
		RandomAccessFile target = fsd.target;
		if (target == null)
			return getIO_Error("Could not open file " + id);
//			return IO_ERROR;
		try {
			if (CHECK_APPEND_ORIGINAL_SIZE) {
				if (fsd.append && !fsd.write && position < fsd.size)
					return getIO_Error("Could not write to file file " + id + " at position " + position + " while filesize was " + fsd.size);
//					return IO_ERROR;
			}
			target.seek(position);
			target.write(stringData.getBytes(fsd.encoding));
			Map<String, Object> data = new HashMap<String, Object>();
			data.put("new_pos", IO_OPERATIONS_MODIFY_POSITION ? Long
					.valueOf(target.getFilePointer()) : Long.valueOf(position));
			return new JSONObject(data).toString();
		} catch (IOException io) {
			return getIO_Error("IO Exception: " + io.getMessage());
//			return IO_ERROR;
		}

	}

	/**
	 * write Bytes to the file stream.
	 * 
	 * @param id
	 *            the id of the file stream.
	 * @param position
	 *            the position in the file stream
	 * @param byteData
	 *            the bytes to write
	 * @return the new position or an error
	 */
	public String writeBytes(String id, long position, String byteData) {
		FileStreamData fsd = openFiles.get(Integer.valueOf(id));
		if (fsd == null)
			return getIO_Error("Could not open filestream " + id);
//			return IO_ERROR;
		RandomAccessFile target = fsd.target;
		if (target == null)
			return getIO_Error("Could not open file " + id);
//			return IO_ERROR;
		try {
			if (CHECK_APPEND_ORIGINAL_SIZE) {
				if (fsd.append && !fsd.write && position < fsd.size)
					return getIO_Error("Could not write to file " + id + " at position " + position + " while filesize was " + fsd.size);
//					return IO_ERROR;
			}
			target.seek(position);
			target.writeBytes(byteData);
			Map<String, Object> data = new HashMap<String, Object>();
			data.put("new_pos", IO_OPERATIONS_MODIFY_POSITION ? Long
					.valueOf(target.getFilePointer()) : Long.valueOf(position));
			return new JSONObject(data).toString();

		} catch (IOException io) {
			return getIO_Error("IO Exception: " + io.getMessage());
//			return IO_ERROR;
		}
	}

	/**
	 * Writes base64 encoded bytes to the file.
	 * 
	 * @param id
	 *            the file stream id
	 * @param position
	 *            the position
	 * @param base64Data
	 *            the encoded bytes
	 * @return the new position, or an error.
	 */
	public String write64(String id, long position, String base64Data) {
		FileStreamData fsd = openFiles.get(Integer.valueOf(id));
		if (fsd == null)
			return getIO_Error("Could not open filestream to " + id);
//			return IO_ERROR;
		RandomAccessFile target = fsd.target;
		if (target == null)
			return getIO_Error("Could not open file " + id);
//			return IO_ERROR;
		try {
			if (CHECK_APPEND_ORIGINAL_SIZE) {
				if (fsd.append && !fsd.write && position < fsd.size)
					return getIO_Error("Could not write to file " + id + " at position " + position + " while filesize was " + fsd.size);
//					return IO_ERROR;
			}
			target.seek(position);
			byte base64[] = base64Data.getBytes("ISO8859-1");
			if (!Base64.isArrayByteBase64(base64))
				return getIO_Error("File " + id + " is not a ByteBase64 array");
//				return IO_ERROR;

			target.write(Base64.encodeBase64(base64));
			Map<String, Object> data = new HashMap<String, Object>();
			data.put("new_pos", IO_OPERATIONS_MODIFY_POSITION ? Long
					.valueOf(target.getFilePointer()) : Long.valueOf(position));
			return new JSONObject(data).toString();
		} catch (IOException io) {
			return getIO_Error("IO Exception: " + io.getMessage());
//			return IO_ERROR;
		}

	}

	public int testSaveLocationExists_unused(String fileName) {
		if (fileManager.testSaveLocationExists(fileName)) {
			return 0;
		} else {
			return 1;
		}
	}

	public long getFreeDiskSpace_unused() {
		long freeDiskSpace = fileManager.getFreeDiskSpace_unused();
		return freeDiskSpace;
	}

	public int testFileExists(String file) {
		if (fileManager.testFileExists(file))
			return 0;
		else
			return 1;
	}

	public int testDirectoryExists(String file) {
		if (fileManager.testFileExists(file))
			return 0;
		else
			return 1;
	}

	/**
	 * Delete a specific directory. Everything in side the directory would be
	 * gone. <br>
	 */
	public String deleteDirectory(String dir, String recursive) {

		if (!new File(dir).exists())
			return "false";

		boolean recursiveDelete = Boolean.parseBoolean(recursive);
		try {
			File testFile = new File(dir);
			if (!testFile.isDirectory()) {
				return getIO_Error("Method deleteDirectoy expected " + dir + " to be a directory.");
//				return IO_ERROR;
			}
			
			if (recursiveDelete) {
				LinkedList<File> toDelete = new LinkedList<File>();
				toDelete.add(new File(dir));
				while (!toDelete.isEmpty()) {
					File filePeek = toDelete.peek();
					File[] contents = filePeek.listFiles();
					if (contents != null) {
						for (File target : contents) {
							if (target.isDirectory()) {
								toDelete.add(0, target);
							} else {
								if (!target.delete()) {
									return getIO_Error("Directory " + dir + " could not be deleted");
//									return IO_ERROR;
								}
							}
						}
					}

					if (toDelete.peek() == filePeek) {
						toDelete.poll();
						if (!filePeek.delete()) {
							return getIO_Error("System was unable to delete " + filePeek.getName() + " at " + filePeek.getAbsolutePath());
//							return IO_ERROR;
						}
					}
				}
			} else {
				File f = new File(dir);
				if (!f.delete())
					return getIO_Error("System was unable to delete file " + f.getName() + " in " + f.getAbsolutePath());
//					return IO_ERROR;
			}
		} catch (SecurityException se) {
			return getSecurityError(se.getMessage());
//			return PERMISSION_DENIED_ERROR;
		}

		return "true";

	}

	/**
	 * Delete a specific file.<br>
	 * 
	 */
	public String deleteFile(String file) {
		File f = new File(file);
		if (!f.exists())
			return "false";
		try {
			if (!f.delete()) {
				return getIO_Error("File " + file + " could not be deleted");
//				return IO_ERROR;
			}
		} catch (SecurityException se) {
			return getSecurityError(se.getMessage());
//			return PERMISSION_DENIED_ERROR;
		}
		return "true";
	}

	/**
	 * Create a new directory.
	 * 
	 * @param the
	 *            absolute directory name
	 * @return a JSON object representing the created directory
	 */
	public String createDirectory(String path, String name) {
		// Throw IO Error if the path tries to traverse directories.
		if (name.contains("..")) {
			return getIO_Error("Directoryname must not include ..");
//			return IO_ERROR;
		}
		
		// check for invalid chars
		if (name == null || !name.matches("[A-z,0-9_\\-\\/\\ ]+")) {
			return getIO_Error("Directoryname is only allowed to consist of these signs [A-z,0-9_\\-\\/\\ ]+");
//			return IO_ERROR;
		}
		
		// all path must be relative
		if (name.startsWith("/")) {
			name = name.substring(1);
		}

		String target = (path.endsWith("/") ? path : path + "/") + name;
		if (fileManager.createDirectory(target))
			return resolve(target);
		else
			return getIO_Error("System was not able to create directory " + name + " at location " + path);
//			return IO_ERROR;
	}

	/**
	 * Creates a file in the file system, or throw an error if it already
	 * exists.
	 * 
	 * @param path
	 *            the base path
	 * @param name
	 *            the file name
	 * @return either the file meta data or an error
	 */
	public String createFile(String path, String name) {
		// Throw IO Error if the path is not relative or tries to traverse
		// directories.
		
		
		
		if (name.contains("..") || name.startsWith("/"))
			return getIO_Error("Filename must not begin with .. or /");
//			return IO_ERROR;
		if (!new File(path).isDirectory())
			return getIO_Error("path to filelocation must be a directory");
//			return IO_ERROR;
		File target = new File(path, name);
		try {
			if (target.createNewFile())
				return resolve(target.getAbsolutePath());
			else
				return getIO_Error("System was unable to create file with name " + name + " on path " + path);
//				return IO_ERROR;
		} catch (IOException io) {
			return getIO_Error(io.getMessage());
//			return IO_ERROR;
		} catch (SecurityException se) {
			return getSecurityError(se.getMessage());
//			return PERMISSION_DENIED_ERROR;
		}

	}
	
	
	private String getINVALID_ARGUMENT_ERROR(String message){
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("error", Short.valueOf((short) 10001));
		result.put("errorMessage", message);
		return new JSONObject(result).toString();
	}
	
	private String getIO_Error(String message){
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("error", Short.valueOf((short) 10004));
		result.put("errorMessage", message);
		return new JSONObject(result).toString();
	}
	
	private String getSecurityError(String message){
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("error", Short.valueOf((short) 20000));
		result.put("errorMessage", message);
		return new JSONObject(result).toString();
	}

	public void log(String string) {
		Log.d("FileSystem", string);
	}
}
