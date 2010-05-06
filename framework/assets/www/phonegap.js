if (typeof(DeviceInfo) != 'object')
	DeviceInfo = {};

/**
 * This represents the PhoneGap API itself, and provides a global namespace for accessing
 * information about the state of PhoneGap.
 * @class
 */
PhoneGap = {
		queue: {
	ready: true,
	commands: [],
	timer: null
},
_constructors: []
};

/**
 * Boolean flag indicating if the PhoneGap API is available and initialized.
 */ // TODO: Remove this, it is unused here ... -jm
PhoneGap.available = DeviceInfo.uuid != undefined;

/**
 * Add an initialization function to a queue that ensures it will run and initialize
 * application constructors only once PhoneGap has been initialized.
 * @param {Function} func The function callback you want run once PhoneGap is initialized
 */
PhoneGap.addConstructor = function(func) {
	var state = document.readyState;
	if ( state == 'loaded' || state == 'complete' )
	{
		func();
	}
	else
	{
		PhoneGap._constructors.push(func);
	}
};

(function() 
		{
	var timer = setInterval(function()
			{

		var state = document.readyState;

		if ( state == 'loaded' || state == 'complete' )
		{
			clearInterval(timer); // stop looking
			// run our constructors list
			while (PhoneGap._constructors.length > 0) 
			{
				var constructor = PhoneGap._constructors.shift();
				try 
				{
					constructor();
				} 
				catch(e) 
				{
					if (typeof(debug['log']) == 'function')
					{
						debug.log("Failed to run constructor: " + debug.processMessage(e));
					}
					else
					{
						alert("Failed to run constructor: " + e.message);
					}
				}
			}
			// all constructors run, now fire the deviceready event
			var e = document.createEvent('Events'); 
			e.initEvent('deviceready');
			document.dispatchEvent(e);
		}
			}, 5);
		})();


/**
 * Execute a PhoneGap command in a queued fashion, to ensure commands do not
 * execute with any race conditions, and only run when PhoneGap is ready to
 * recieve them.
 * @param {String} command Command to be run in PhoneGap, e.g. "ClassName.method"
 * @param {String[]} [args] Zero or more arguments to pass to the method
 */
PhoneGap.exec = function() {
	PhoneGap.queue.commands.push(arguments);
	if (PhoneGap.queue.timer == null)
		PhoneGap.queue.timer = setInterval(PhoneGap.run_command, 10);
};

/**
 * Internal function used to dispatch the request to PhoneGap.  It processes the
 * command queue and executes the next command on the list.  If one of the
 * arguments is a JavaScript object, it will be passed on the QueryString of the
 * url, which will be turned into a dictionary on the other end.
 * @private
 */
PhoneGap.run_command = function() {
	if (!PhoneGap.available || !PhoneGap.queue.ready)
		return;

	PhoneGap.queue.ready = false;

	var args = PhoneGap.queue.commands.shift();
	if (PhoneGap.queue.commands.length == 0) {
		clearInterval(PhoneGap.queue.timer);
		PhoneGap.queue.timer = null;
	}

	var uri = [];
	var dict = null;
	for (var i = 1; i < args.length; i++) {
		var arg = args[i];
		if (arg == undefined || arg == null)
			arg = '';
		if (typeof(arg) == 'object')
			dict = arg;
		else
			uri.push(encodeURIComponent(arg));
	}
	var url = "gap://" + args[0] + "/" + uri.join("/");
	if (dict != null) {
		var query_args = [];
		for (var name in dict) {
			if (typeof(name) != 'string')
				continue;
			query_args.push(encodeURIComponent(name) + "=" + encodeURIComponent(dict[name]));
		}
		if (query_args.length > 0)
			url += "?" + query_args.join("&");
	}
	document.location = url;

};
function Acceleration(x, y, z)
{
	this.x = x;
	this.y = y;
	this.z = z;
	this.timestamp = new Date().getTime();
}

//Need to define these for android
_accel = {};
_accel.x = 0;
_accel.y = 0;
_accel.z = 0;

function gotAccel(x, y, z)
{
	_accel.x = x;
	_accel.y = y;
	_accel.z = z;
}

/**
 * This class provides access to device accelerometer data.
 * @constructor
 */
function Accelerometer() {
	/**
	 * The last known acceleration.
	 */
	this.lastAcceleration = null;
}

/**
 * Asynchronously aquires the current acceleration.
 * @param {Function} successCallback The function to call when the acceleration
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the acceleration data.
 * @param {AccelerationOptions} options The options for getting the accelerometer data
 * such as timeout.
 */
Accelerometer.prototype.getCurrentAcceleration = function(successCallback, errorCallback, options) {
	// If the acceleration is available then call success
	// If the acceleration is not available then call error

	// Created for iPhone, Iphone passes back _accel obj litteral
	if (typeof successCallback == "function") {
		var accel = new Acceleration(_accel.x,_accel.y,_accel.z);
		Accelerometer.lastAcceleration = accel;
		successCallback(accel);
	}
}

/**
 * Asynchronously aquires the acceleration repeatedly at a given interval.
 * @param {Function} successCallback The function to call each time the acceleration
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the acceleration data.
 * @param {AccelerationOptions} options The options for getting the accelerometer data
 * such as timeout.
 */

Accelerometer.prototype.watchAcceleration = function(successCallback, errorCallback, options) {
	// TODO: add the interval id to a list so we can clear all watches
	var frequency = (options != undefined)? options.frequency : 10000;

	Accel.start(frequency);
	return setInterval(function() {
		navigator.accelerometer.getCurrentAcceleration(successCallback, errorCallback, options);
	}, frequency);
}

/**
 * Clears the specified accelerometer watch.
 * @param {String} watchId The ID of the watch returned from #watchAcceleration.
 */
Accelerometer.prototype.clearWatch = function(watchId) {
	Accel.stop();
	clearInterval(watchId);
}

PhoneGap.addConstructor(function() {
	if (typeof navigator.accelerometer == "undefined") navigator.accelerometer = new Accelerometer();
});


/*
 * 
 * 
 * 
 * 
 * 
 */
//bondi
//if (typeof(bondi) != 'object')
//bondi = {};

function GenericError(code, message) {
	this.code = code;
	this.message = message;
}


function DeviceAPIError() {
}
function DeviceAPIError(code, message) {
	this.code = code;
	this.message = message;
}

DeviceAPIError.UNKNOWN_ERROR = 10000;
DeviceAPIError.INVALID_ARGUMENT_ERROR = 10001;
DeviceAPIError.NOT_FOUND_ERROR = 10002;
DeviceAPIError.PENDING_OPERATION_ERROR = 10003;
DeviceAPIError.IO_ERROR = 10004;
DeviceAPIError.NOT_SUPPORTED_ERROR = 10005;

DeviceAPIError.prototype.UNKNOWN_ERROR = DeviceAPIError.UNKNOWN_ERROR;
DeviceAPIError.prototype.INVALID_ARGUMENT_ERROR = DeviceAPIError.INVALID_ARGUMENT_ERROR;
DeviceAPIError.prototype.NOT_FOUND_ERROR = DeviceAPIError.NOT_FOUND_ERROR;
DeviceAPIError.prototype.PENDING_OPERATION_ERROR = DeviceAPIError.PENDING_OPERATION_ERROR;
DeviceAPIError.prototype.IO_ERROR = DeviceAPIError.IO_ERROR;
DeviceAPIError.prototype.NOT_SUPPORTED_ERROR = DeviceAPIError.NOT_SUPPORTED_ERROR;


function SecurityError() {
}
SecurityError.PERMISSION_DENIED_ERROR = 20000;
SecurityError.prototype.PERMISSION_DENIED_ERROR = SecurityError.PERMISSION_DENIED_ERROR;

PendingOperation = function() {
}
PendingOperation.prototype.cancel = function() {
	return false;
}
PendingOperation.prototype.wait = function() {
}

function CameraManager() {
	this._cams = [];
	this._cams.push(new Camera());
}
/**
 * Determines representations of available cameras. The number of cameras that
 * are accessible depends on the number of available hardware devices as well as
 * on the number of cameras that are supported by the implementation. To
 * distinguish between multiple cameras the camera description and properties
 * can be used to select a camera device.
 * 
 * @param successCallback
 *            The callBack handler that is fired when all available cameras were
 *            identified and a list of cameras can be provided.
 * @param errorCallback
 *            The callBack handler that is fired if any error occurs.
 * @return PendingOperation
 * 
 */
CameraManager.prototype.getCameras = function(successCallback, errorCallback) {
	var cams = this._cams;
	setTimeout(function() {
		successCallback(cams);
	}, 1);
	return new PendingOperation();
}

/**
 * The camera error.
 */
function CameraError() {
}
/** Error thrown if the used camera is already in use. */
CameraError.CAMERA_ALREADY_IN_USE_ERROR = 0;
CameraError.prototype.CAMERA_ALREADY_IN_USE_ERROR = CameraError.CAMERA_ALREADY_IN_USE_ERROR;

/**
 * Error thrown if an unpredicted error occurs while a picture or video is being
 * captured or if endRecording is called while no video is currently captured.
 */
CameraError.CAMERA_CAPTURE_ERROR = 1;
CameraError.prototype.CAMERA_CAPTURE_ERROR = CameraError.CAMERA_CAPTURE_ERROR;

/** Error thrown if a camera life video cannot be provided. */
CameraError.CAMERA_LIVEVIEW_ERROR = 2;
CameraError.prototype.CAMERA_LIVEVIEW_ERROR = CameraError.CAMERA_LIVEVIEW_ERROR;



function BondiCameraManager() {
	if (typeof this.counter == "undefined"){
		this.counter = 0;
	}
	this._cams = [];
	this._cams.push(new BondiCamera(this.counter++));
}

//function initCams () {
//var cams = [];
//cams.push(new BondiCamera());
//return cams;
//}

//BondiCameraManager.prototype._cams = initCams(); 

//BondiCameraManager.prototype.__defineSetter__("_cams", function(x) {

//if (typeof this._cams == "undefined"){
//this._cams = x;
//} else {

//var error = new DeviceAPIError();
//error.code = error.NOT_SUPPORTED_ERROR;
//error.message = "Cams are readonly";
//throw error;
//}
//});

/**
 * Determines representations of available cameras. The number of cameras that
 * are accessible depends on the number of available hardware devices as well as
 * on the number of cameras that are supported by the implementation. To
 * distinguish between multiple cameras the camera description and properties
 * can be used to select a camera device.
 * 
 * @param successCallback
 *            The callBack handler that is fired when all available cameras were
 *            identified and a list of cameras can be provided.
 * @param errorCallback
 *            The callBack handler that is fired if any error occurs.
 * @return PendingOperation
 * 
 */
BondiCameraManager.prototype.getCameras = function(successCallback, errorCallback) {
	var cams = this._cams;
	if (typeof successCallback == "function"){
		setTimeout(function() {
			successCallback(cams);
		}, 1);
	} else {
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "successCallback has to be defined and a function";
		if (typeof errorCallback == "function"){
			errorCallback(error);
			return;
		} else {
			throw error;
		}
	}
	return new PendingOperation();
}

/**
 * The camera allows to use features provided by a camera device. Default
 * Constructor.
 */
function BondiCamera(id) {
	this.id = id;
	this.occupied = false;
}
//XXX add constants to phoneGap camera object instead of BondiCamera
//even though they aren't of much use right now anyway
BondiCamera.ZOOM = 0;
BondiCamera.prototype.ZOOM = BondiCamera.ZOOM;
BondiCamera.ZOOM_NOZOOM = 1;
BondiCamera.prototype.ZOOM_NOZOOM = BondiCamera.ZOOM_NOZOOM;
BondiCamera.CONTRAST = 2;
BondiCamera.prototype.CONTRAST = BondiCamera.CONTRAST;
BondiCamera.BRIGHTNESS = 3;
BondiCamera.prototype.BRIGHTNESS = BondiCamera.BRIGHTNESS;
BondiCamera.COLORTEMPERATURE = 4;
BondiCamera.prototype.COLORTEMPERATURE = BondiCamera.COLORTEMPERATURE;
BondiCamera.NIGHTMODE = 5;
BondiCamera.prototype.NIGHTMODE = BondiCamera.NIGHTMODE;
BondiCamera.NIGHTMODE_OFF = 0;
BondiCamera.prototype.NIGHTMODE_OFF = BondiCamera.NIGHTMODE_OFF;
BondiCamera.NIGHTMODE_ON = 1;
BondiCamera.prototype.NIGHTMODE_ON = BondiCamera.NIGHTMODE_ON;
BondiCamera.MANUALFOCUS = 6;
BondiCamera.prototype.MANUALFOCUS = BondiCamera.MANUALFOCUS;
BondiCamera.MANUALFOCUS_ON = 1;
BondiCamera.prototype.MANUALFOCUS_ON = BondiCamera.MANUALFOCUS_ON;
BondiCamera.MANUALFOCUS_OFF = 0;
BondiCamera.prototype.MANUALFOCUS_OFF = BondiCamera.MANUALFOCUS_OFF;
BondiCamera.FOCUS = 7;
BondiCamera.prototype.FOCUS = BondiCamera.FOCUS;
BondiCamera.LIGHT = 8;
BondiCamera.prototype.LIGHT = BondiCamera.LIGHT;
BondiCamera.FLASH = 9;
BondiCamera.prototype.FLASH = BondiCamera.FLASH;
BondiCamera.FLASH_NO_FLASH = 0;
BondiCamera.prototype.FLASH_NO_FLASH = BondiCamera.FLASH_NO_FLASH;
BondiCamera.FLASH_AUTOFLASH = 1;
BondiCamera.prototype.FLASH_AUTOFLASH = BondiCamera.FLASH_AUTOFLASH;
BondiCamera.FLASH_FORCEDFLASH = 2;
BondiCamera.prototype.FLASH_FORCEDFLASH = BondiCamera.FLASH_FORCEDFLASH;
BondiCamera.description = 'androidcam';
BondiCamera.prototype.description = BondiCamera.description;


/**
 * Take a picture.
 * 
 * @param successCallback
 *            The successCallBack
 * @param errorCallback
 *            The errorCallback
 * @param options
 *            The camera options
 * @return PendingOperation
 * @throws SecurityError,
 *             DeviceAPIError, CameraError
 */
BondiCamera.prototype.takePicture = function(successCallback, errorCallback, options) {
	var error;
	if (typeof errorCallback != "function"){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "errorCallback has to be defined and a function";
		throw error;
	} else if (typeof successCallback != "function"){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "successCallback has to be defined and a function";
		errorCallback(error);
		throw error;
	}

	if(typeof(options) != 'object'){
		options = {};
	}
	if (options.quality == 'undefined') {
		options.quality = 80;
	}
	if (options.width == 'undefined'){
		options.width = 480;
	}
	if (options.height == 'undefined'){
		options.height = 640;
	}
	var camStatus = GapCam.takePictureFile(options.quality, options.width, options.height, this.id);

	if (camStatus == "occupied"){
		error = new CameraError();
		error.code = error.CAMERA_ALREADY_IN_USE_ERROR;
		error.message = "camera is already in use please try again later";
		errorCallback(error);
		//throw error;
	} else if (camStatus == "Permission Denied"){
		error = new SecurityError ()
		error.code = error.PERMISSION_DENIED_ERROR;
		error.message = "Permission to take picture was denied";
		errorCallback(error);
		//throw error;
	}

	// only other case: camStatus == "unoccupied"

	this.win=successCallback;
	this.failure=errorCallback;

	return new PendingOperation();
}

/**
 * gets an errorMessage and builds a DeviceAPIError out of it,
 * which is transfered to the current errorCallback for this BondiCamera 
 */
BondiCamera.prototype.fail = function(errorMessage){
	var error = new DeviceAPIError();
	error.code = error.IO_ERROR;
	error.message = errorMessage;
	this.failure(error);
}



/**
 * Gets a list of supported camera features. Provides a list of supported camera
 * features which can be configured with setFeature(). If a camera supports the
 * predefined feature set then they should be configurable with the use of the
 * defined feature names and values. Additional features which are not covered
 * by the predefined camera features can be added by implementations with a lack
 * of semantic meanings for these features. Therefore, the feature name should
 * be a human understandable description of the feature. Using predefined
 * features names and values for other camera features is not allowed because
 * this may change the semantic meaning of a feature which may be important for
 * applications.
 * 
 * The length of the list is 0 if no camera features are configurable.
 * 
 * @return an array of integer values
 */
BondiCamera.prototype.getSupportedFeatures = function() {
	return [];
}

/**
 * Sets the value of a camera feature.
 * 
 * @param featureID:
 *            The identifier of the feature that should be changed.
 * @param valueID:
 *            The identifier that represents the new value of the feature.
 * @throw DeviceAPIError, INVALID_ARGUMENT_ERROR (if input parameters or input
 *        values are invalid)
 * @return void
 */
BondiCamera.prototype.setFeature = function(featureID, valueID) {
	var error = new DeviceAPIError();
	error.code = error.NOT_SUPPORTED_ERROR;
	error.message = "setFeature is not supported";
	throw error;
}

/**
 * Requests a live video.
 * 
 * @param successCallback
 *            The successCallBack
 * @param errorCallback
 *            The errorCallback
 * @return PendingOperation
 */
BondiCamera.prototype.requestLiveVideo = function(successCallback, errorCallback) {
	var error = new DeviceAPIError();
	error.code = error.NOT_SUPPORTED_ERROR;
	error.message = "requestLiveVideo is not supported";
	if (typeof errorCallback == "function"){ 
		setTimeout(errorCallback(error), 1);
	} else {
		throw error;
	}
	return new PendingOperation();
}

/**
 * Start the video.
 * 
 * @param successCallback
 *            The successCallBack
 * @param errorCallback
 *            The errorCallback
 * @param options
 *            non-mandatory options
 * @return PendingOperation
 */
BondiCamera.prototype.startVideo = function(successCallback, errorCallback, options) {
	var error = new DeviceAPIError();
	error.code = error.NOT_SUPPORTED_ERROR;
	error.message = "start Video is not supported";
	if (typeof(errorCallback) == 'function') setTimeout(errorCallback(error), 1);
	return new PendingOperation();
}

/**
 * Stop the video.
 * 
 * @param successCallback
 *            The successCallBack
 * @param errorCallback
 *            The errorCallback
 * @return PendingOperation
 */
BondiCamera.prototype.stopVideo = function(successCallback, errorCallback) {
	var error = new DeviceAPIError();
	error.code = error.NOT_SUPPORTED_ERROR;
	error.message = "stopVideo is not supported";
	if (typeof(errorCallback) == 'function') setTimeout(errorCallback(error), 1);
	return new PendingOperation();
}

/////////////////////////////////////////////////////////////
////////////////////section geoLocation ////////////////////
/////////////////////////////////////////////////////////////

/**
 * Default constructor.
 */
function BondiGeolocation() {
	/**
	 * The last known GPS position.
	 */
	this.lastPosition = null;
	this.lastError = null;
	this.listeners = [];
//	this.callbacks = {
//	onLocationChanged: [],
//	onError:           []
//	};
};


/**
 * Returns the current position. It will throw errors if: successCallback is
 * undefined or null.
 * 
 * Errors are thrown too if: Options is defined and not null and one or more of
 * the following conditions is true: options.timeout is defined not null and
 * options.timeout < 0 options.maximumAge is defined not null and
 * options.maximumAge < 0
 * 
 * @param successCallback
 *            the successCallback
 * @param errorCallback
 *            the errorCallback
 * @param options
 *            the options
 * @throws DeviceAPIError
 */
BondiGeolocation.prototype.getCurrentPosition = function(successCallback, errorCallback, options)
{
	var error;
	var errorCbIsDefined = false;

	if ((typeof errorCallback != 'undefined')  && (errorCallback != null)){
		if (typeof errorCallback != 'function'){
			// check of strange interpretation of "optional parameter" from frauenhofer-focus
			if (typeof errorCallback == 'object' && (typeof options == 'undefined')){
				// errorCallback was just "left out" and is possible meant as options instead...
				options = errorCallback;
				errorCallback = null;
			} else {
				error = new DeviceAPIError();
				error.code = error.INVALID_ARGUMENT_ERROR;
				error.message = "errorCallback must be a function if defined";
				throw error;
			}
		} else {
			errorCbIsDefined = true;
		} 
	}
	if ((typeof successCallback == "undefined") || (successCallback == null) || (typeof successCallback != "function")){
		// Even if we would be successful in retrieving a position there would
		// be no place to send it to
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "SuccessCallback must be defined, a function and not be null";
		throw error;
//		if (errorCbIsDefined) {
//		errorCallback(error);
//		}
		return;
	} 
	// time in milliseconds that the gps-system might potentially rest between
	// updates to conserve power
	var maximumAge = 0;
	var timeout = 1000;
	var isTimeoutSet = false;

	// Check Maximum Age option exists
	if (typeof options != "undefined" && options != null){
		var isValid = false;
		if (typeof options.maximumAge != "undefined" && options.maximumAge != null){
			if (options.maximumAge < 0){
				// maximumAge must be higher than -1.
				// maximumAge = 0 means informations have to be absolutely up to
				// date CAUTION: This will drain the battery quickly
				error = new DeviceAPIError();
				error.code = error.INVALID_ARGUMENT_ERROR;
				error.message = "maximumAge must be higher than -1";
				throw error;
//				if (errorCbIsDefined) {
//				errorCallback(error);
//				}
				return;
			} else if (options.maximumAge != 0){
				isValid = true;
				// old readings might be used, so let's check if our last
				// reading is new enough'
				var location = this.checkAgeOfLastKnownLocation(options.maximumAge);
				if (location != null){
					if (typeof location.code == 'undefined'){
						// location is indeed location
						successCallback(location);
						return;
					} else {
						// location is an positionError instead
						if (errorCbIsDefined) {
							errorCallback(location);
							return;
						} else {
							throw location;
						}
						return;
//						if (errorCbIsDefined) {
//						errorCallback(location);
//						}
					}
				} else {
					maximumAge = options.maximumAge;
				}
			}
		}// END maximumAge
		// Now look if there is a timeout included
		if (typeof options.timeout != "undefined" && options.timeout != null){

			if (options.timeout < -1){
				// A timeout can't be a point in time before this point, so the
				// argument is invalid'
				error = new DeviceAPIError();
				error.code = error.INVALID_ARGUMENT_ERROR;
				error.message = "Timeout can't be a point in time before the present, so it has to be > -1";
				throw error;
//				if (errorCbIsDefined) {
//				errorCallback(error);
//				}
				return;
			} else {
				isValid = true;
			}
			timeout = options.timeout;
			isTimeoutSet = true;
		}
		if ((typeof options.enableHighAccuracy != "undefined") && (options.enableHighAccuracy != null)){
			if (options.enableHighAccuracy == true || options.enableHighAccuracy == false){
				isValid = true;
			}
		}
		if (!isValid){
			error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "if options are defined they have to include at least one valid option";
			throw error;
//			if (errorCbIsDefined) {
//			errorCallback(error);
//			} 
			return;
		} 
	}


	// PositionData was null or to old -> New PositionData has to be acquired
	if (typeof this.listeners == "undefined"){
		this.listeners = [];
	}

	var key = this.listeners.push( {
		"success" : successCallback,
		"fail" : errorCallback,
		"oneShot" : "true",
		"timer" : null,
		"maximumAge" : null,
		"timeout" : null
	}) - 1;
	if (isTimeoutSet){
		var that = this;

		var timer = setTimeout(function() {
			if (typeof that.listeners[key].oneShot != "undefined"){
				if (that.listeners[key].oneShot == "false"){
					// Reply was already done successfully
					clearTimeout(that.listeners[key].timer);
					that.listeners[key].timer = null;
					return;
				}

				// might be another listener was successful meanwhile
				var location = that.checkAgeOfLastKnownLocation(maximumAge);

				if (location != null){
					if (typeof location.code == 'undefined'){
						// timeout reached but another listener updated
						// location data successfully for us
						successCallback(location);
						that.listeners[key].oneShot = "false";
						bGeo.stop(key);
						clearTimeout(that.listeners[key].timer);
						that.listeners[key].timer = null;
						return;
					} else {
						//timeout reached but location is still not available yet
						this.listeners[key].oneShot = "false";
						bGeo.stop(key);
						clearTimeout(that.listeners[key].timer);
						that.listeners[key].timer = null;
						error = new PositionError();
						error.code = PositionError.TIMEOUT;
						error.message = "Timeout without a location avaiable";
						if (errorCbIsDefined) {
							errorCallback(error);
							return;
						} else {
							throw error;
						}
						return;
					}
				} else {
					// timeout reached without adequate young locationData
					error = new PositionError();
					error.code = PositionError.TIMEOUT;
					error.message = "Timeout without a location that was sufficient up to date";
					if (errorCbIsDefined) {
						errorCallback(error);
						return;
					} else {
						throw error;
					}
					that.listeners[key].oneShot = "false";
					bGeo.stop(key);
					clearTimeout(that.listeners[key].timer);
					that.listeners[key].timer = null;
					return;
				}
			} 
		}, options.timeout);
		this.listeners[key].timer = timer;
	}
	bGeo.getCurrentLocation(key);
}


/**
 * deliver lastKnownLocation if age of last position is less then maximumAge,
 * returns null otherwise this function is only meant to be used internal within
 * the Geolocation Object. (private)
 * 
 * @param maximumAge
 *            the maximal age in millis
 */
BondiGeolocation.prototype.checkAgeOfLastKnownLocation = function (maximumAge){
	var loc = this.getLastKnownPosition();
	if (loc != null){
		if (typeof loc.timestamp != 'undefined'){
			var now = new Date();
			var age = now.getTime() - loc.timestamp;
//			alert("Checking Age of last known position \n    age is: " + age + " \n maxAge is " + maximumAge);
			if (age < maximumAge){
				return loc;
			}
		} else {
			return loc;
		}
	}
	return null;
}

/**
 * getLastKnownPosition. returns the cached last known position. GPS isn't used
 * to do that, so it's possibly overAged but without additional energy
 * consumption
 * 
 * @return lastPosition
 */
BondiGeolocation.prototype.getLastKnownPosition = function(){
	if ((typeof this.lastPosition == 'undefined')
			|| (this.lastPosition == null)){
		var loc = bGeo.getLastKnownLocation();
		var coords;
		if (loc == null){			// Position not yet avaiable
			var error = new PositionError();
			error.code = error.POSITION_UNAVAILABLE;
			error.message = "No position received yet";
			return error;	

//			coords = new Coordinates("notReceivedYet", "notReceivedYet", "notReceivedYet", "notReceivedYet", "notReceivedYet", "notReceivedYet", "notReceivedYet");
//			this.lastPosition = new Position(coords, "notReceivedYet");
//			coords = new Coordinates(parseFloat("0"), parseFloat("0"), parseFloat("0"), parseFloat("0"), parseFloat("0"), parseFloat("0"), parseFloat("0"));
//			this.lastPosition = new Position(coords, parseFloat("0"));
		} else {
			/*
			 * altitudeAccuracy: as this value isn't supported seperatedly by the Android.location.Location class
			 * so the general accuracy is used for it
			 */
			coords = new Coordinates(parseFloat(loc.getLatitude()), parseFloat(loc.getLongitude()), parseFloat(loc.getAltitude()), parseFloat(loc.getAccuracy()), parseFloat(loc.getBearing()), parseFloat(loc.getSpeed()), parseFloat(loc.getAccuracy()));
			this.lastPosition = new Position(coords, parseInt(loc.timestamp));
		}
	}
	return this.lastPosition;
}

/**
 * watchPosition. This is creating a subscription though obtaining periodic
 * position updates. A listener will watch changes of the actual location and
 * returning the newest location data whenever it changes. Changes depend on the
 * frequency that can be influenced using the maximumAge.
 * 
 * @param successCallback
 *            the successCallback
 * @param errorCallback
 *            the errorCallback
 * @param options
 *            the options
 * @return a key string (identifies the listener)
 */
BondiGeolocation.prototype.watchPosition = function(successCallback, errorCallback, options)
{
	var timeout = -1;
	var maximumAge = 0;
	var error;

	// BEGIN argument checking and error handling		
	var errorCbIsDefined = false;

	if ((typeof errorCallback != 'undefined')  && (errorCallback != null)){
		if (typeof errorCallback != 'function'){
			// check of strange interpretation of "optional parameter" from frauenhofer-focus
			if (typeof errorCallback == 'object' && (typeof options == 'undefined')){
				// errorCallback was just "left out" and is possible meant as options instead...
				options = errorCallback;
				errorCallback = null;
			} else {
				error = new DeviceAPIError();
				error.code = error.INVALID_ARGUMENT_ERROR;
				error.message = "errorCallback must be a function if defined";
				throw(error);
			}
		} else {
			errorCbIsDefined = true;
		} 
	}
	if ((typeof successCallback == "undefined") || (successCallback == null) || (typeof successCallback != "function")){
		// Even if we would be successful in retrieving a position there would
		// be no place to send it to
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "SuccessCallback must be defined, a function and not be null";
		throw error;
//		if (errorCbIsDefined) {
//		errorCallback(error);
//		}
		return;
	} 

	if ((typeof options != "undefined") && (options != null)){
		var isValid = false;
		if ((typeof options.timeout != "undefined") && (options.timeout != null)){
			if (options.timeout > -2){
				timeout = options.timeout;
				isValid = true;
			} else {
				// timeout must not be < -1
				error = new DeviceAPIError();
				error.code = error.INVALID_ARGUMENT_ERROR;
				error.message = "timeout must not be < -1";
				throw error;
//				if (errorCbIsDefined) {
//				errorCallback(error);
//				}
				return;
			}
		}
		if ((typeof options.maximumAge != "undefined") && (options.maximumAge != null)){
			if (options.maximumAge > -1){
				maximumAge = options.maximumAge;
				isValid = true;
			} else {
				error = new DeviceAPIError();
				error.code = error.INVALID_ARGUMENT_ERROR;
				error.message = "maximumAge has to be > -1";
				throw error;
//				if (errorCbIsDefined) {
//				errorCallback(error);
//				}
				return;
			}
		}
		if ((typeof options.enableHighAccuracy != "undefined") && (options.enableHighAccuracy != null)){
			if (options.enableHighAccuracy == true || options.enableHighAccuracy == false){
				isValid = true;
			}
		}

		if (!isValid){
			error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "if options are defined they have to include at least one valid option";
			throw error;
//			if (errorCbIsDefined) {
//			errorCallback(error);
//			} 
			return;
		} 
	} // END ArgumentChecking and errorHandling



	if (typeof this.listeners == "undefined"){
		this.listeners = [];
	}

	var key = this.listeners.push( {
		"success" : successCallback,
		"fail" : errorCallback,
		"oneShot" : "false",
		"timer" : null,
		"maximumAge" : null,
		"timeout" : null
	}) - 1;

	if (maximumAge > 0){
		this.listeners[key].maximumAge = maximumAge;
	}

	if (timeout > -1){
		this.listeners[key].timeout = timeout;

		var that = this;
		var timer = setInterval(function (){
			// window.confirm("timerinterval is called");
			var loc = that.checkAgeOfLastKnownLocation(timeout);
			if (loc == null){
				// no update during timeoutinterval so let's throw an error'
				var error = new PositionError();
				error.code = PositionError.TIMEOUT;
				error.message = "Timeout reached without appropriate young location-data";
				if (that.listeners[key].fail != null){
					that.listeners[key].fail(error);
				}
			} else if (typeof loc.code != 'undefined') {
				// no update during timeoutinterval
				// loc just seems to be a location and is instead an PositionError.POSITION_UNAVAIABLE
				if (that.listeners[key].fail != null){
					that.listeners[key].fail(loc);
				}
			}
		}, timeout);

		this.listeners[key].timer = timer;

		if (maximumAge > timeout){
			return bGeo.start(timeout, key);
		} else {
			return bGeo.start(maximumAge, key);
		}
	} else {
		return bGeo.start(0, key);
	}
}

Bondi.prototype.alertMessage = function (from, message){
	alert(from + ": " + message);
}

/*
 * This Method is called whenever a new position comes in through
 * 
 */
BondiGeolocation.prototype.success = function(key, lat, lng, alt, acc, altacc, head, vel, stamp)
{
	var coords = new Coordinates(parseFloat(lat), parseFloat(lng), parseFloat(alt), parseFloat(acc), parseFloat(head), parseFloat(vel), parseFloat(altacc));
	var loc = new Position(coords, parseInt(stamp));
	this.lastPosition = loc;

	if (typeof this.listeners[key] != "undefined"){
		if (this.listeners[key] != "deleted"){
			if (this.listeners[key].oneShot == "true"){
				if (this.listeners[key].timer != null){
					clearTimeout(this.listeners[key].timer);
					this.listeners[key].timer = null;
				}
				this.listeners[key].success(this.lastPosition);
				// now let's just delete this listener
				this.listeners[key] = "deleted";
				return;
			} else {
				// listener is periodic subscription... maximumAge shouldn't be a
				// problem with that but somewhere is has to be checked doesn't it?'
				if (typeof this.listeners[key].maximumAge != null){
					if (this.listeners[key].maximumAge > 0){
						// if maximumAge == 0 it would mean that the just newly aquired data coming in here is wanted and no checks are needed
						var periodicLoc = this.checkAgeOfLastKnownLocation(this.listeners[key].maximumAge);
						if (periodicLoc == null){
							// lastKnownPosition is older than maximumAge
							var error = new PositionError();
							error.code = PositionError.POSITION_UNAVAILABLE;
							error.message = "No position avaiable with age < than maximumAge";
							if (this.listeners[key].fail != null){
								this.listeners[key].fail(error);
							}
							return;
						} else if (typeof periodicLoc.code != 'undefined') {
							// or lastKnownPosition does not exist as there was no position available
							if (this.listeners[key].fail != null){
								this.listeners[key].fail(periodicLoc);
							}
							return;
						}
					} 
					// lastPosition is existing and new enough
					this.listeners[key].success(this.lastPosition);
					return;
				}
			}
		}
	}

}

BondiGeolocation.prototype.fail = function(key, message)
{
	if ((typeof this.listeners[key] != 'undefined') && (this.listeners[key] != null)){
		if ((typeof this.listeners[key].fail != 'undefined') && (this.listeners[key].fail != null)){
			var error = new PositionError();
			error.code = error.POSITION_UNAVAILABLE;
			if (message != 'noLoc'){
				error.message = message;
			} else {
				error.message = "There is currently no location available";
			}
			this.listeners[key].fail(error);
		}
	}
}

/**
 * clearWatch. delete watch listeners with watchId from the listener queue.
 * 
 * @param watchId
 *            the Id of the listener
 */
BondiGeolocation.prototype.clearWatch = function(watchId)
{
	// window.confirm("clearWatch");
	bGeo.stop(watchId);
	if (typeof this.listeners[watchId].timer != "undefined"){
		clearInterval(this.listeners[watchId].timer);
		this.listeners[watchId].timer = null;
	}
	this.listeners[watchId]=null;

}


PhoneGap.addConstructor(function() {
	if (typeof bondi == 'undefined') bondi = new Bondi();
});
PhoneGap.addConstructor(function() {
	if (typeof bondi.camera == "undefined") bondi.camera = new BondiCameraManager();
	if (typeof bondi.cameraManager == "undefined") bondi.cameraManager = bondi.camera;
});

PhoneGap.addConstructor(function() {
	if (typeof bondi.geolocation == "undefined") bondi.geolocation = new BondiGeolocation();
});

PhoneGap.addConstructor(function() {
	if (typeof bondi.devicestatus == "undefined") bondi.devicestatus = new DeviceStatusManager();
});

DeviceStatusManager.prototype.BONDI_VOCABULARY = "http://bondi.omtp.org/1.1/apis/vocabulary.htm";
DeviceStatusManager.prototype.BATTERY = "Battery";
DeviceStatusManager.prototype.OS = "OperatingSystem";
DeviceStatusManager.prototype.Device = new Device();

function DeviceStatusManager(){

	this.defaultVocabulary = this.setupBondiVoc();
	this.supportedVocabularies = [];
	this.supportedVocabularies.push(this.defaultVocabulary);
	this.listeners = [];
}

/**
 * Creates a vocabulary as defined on
 * http://bondi.omtp.org/1.0/apis/vocabulary.htm
 */
DeviceStatusManager.prototype.setupBondiVoc = function(){
	// BATTERY DEFINITIONS - BEGIN
	var batteryProps = [];
	batteryProps.push("batteryLevel", "batteryCapacity",
			"batteryTechnology", "batteryTime", "batteryBeingCharged");

	var batteryImplementedProps = [];
	batteryImplementedProps.push("batteryLevel", "batteryBeingCharged", "batteryTechnology");

	var batteryComps = [];
	var batteryComp_primary = new Component("_primary", true);
	var batteryComp_secondary = new Component("_secondary", false);
	batteryComps.push(batteryComp_primary, batteryComp_secondary);
	var battery = new Aspect(this.BATTERY, batteryProps, batteryComps, batteryImplementedProps);
	// Battery Definitions - END

	// BLUETOOTHHARDWARE Definitions - Begin
	var btHProps = [];
	btHProps.push("status", "bluetoothVersion");
	var bluetoothHardware = new Aspect("BluetoothHardware", btHProps, [])
	// BLUETOOTHHARDWARE Definitions - END

	// CPU Definitions - Begin
	var cpuProps = [];
	cpuProps.push("architecture", "currentFrequency", "cacheSize", "model", "name", "maxFrequency", "vendor");
	var cpuComps = [];
	var cpuComp_primary = new Component("_primary", true);
	var cpuComp_secondary = new Component("_secondary", false);
	cpuComps.push(cpuComp_primary, cpuComp_secondary);
	var cpu = new Aspect("CPU", cpuProps, cpuComps);
	// CPU Definitions - END

	// CAMERA Definitions - BEGIN
	var cameraProps = [];
	cameraProps.push("flashOn", "maxZoom", "minZoom", "status", "currentZoom", "supportedFormats",
			"resolutionHeight", "model", "hasFlash", "name", "resolutionWidth", "vendor");
	var cameraComps = [];
	var cameraComp_primary = new Component("_primary", true);
	var cameraComp_secondary = new Component("_secondary", false);
	cameraComps.push(cameraComp_primary, cameraComp_secondary);
	var camera = new Aspect("Camera", cameraProps, cameraComps);
	// CAMERA Definitions - END

	// CELLULARHARDWARE Definitions - BEGIN
	var cellularHProps = [];
	cellularHProps.push("status");
	var callularH = new Aspect("CellularHardware", cellularHProps, []);
	// CELLULARHARDWARE Definitions - END

	// CELLULARNETWORK Definitions - BEGIN
	var cellularNetworkProps = [];
	cellularNetworkProps.push("isInRoaming", "mcc", "signalStrength", "networkStatus",
			"cellID", "networkTechnology", "mnc", "operatorName");
	var cellularNetworkComps = [];
	var cellularNetwork = new Aspect("CellularNetwork", cellularNetworkProps, cellularNetworkComps);
	// CELLULARNETWORK Definitions - END

	// DEVICE Definitions - BEGIN
	var deviceProps = [];
	deviceProps.push("imei", "activeBluetoothProfile", "bluetoothStatus",
			"connectedDevices", "model", "version", "vendor", 
			"keyboardLocked", "inputDevices");
	var deviceComps = [];
	var device = new Aspect("Device", deviceProps, deviceComps);
	// DEVICE Definitions - END

	// DISPLAY Definitions - BEGIN
	var displayProps = [];
	displayProps.push("height", "width", "displayLightIntensity", "currentOrientation",
			"resolutionHeight", "pixelAspectRatio", "supportedOrientations",
			"characterColumns", "characterRows", "dpiY", "resolutionWidth", "dpiX",
	"colorDepth");

	var displayImplementedProps = [];
	displayImplementedProps.push("currentOrientation");

	var displayComps = [];
	var displayComp_active = new Component("_active", true);
	var displayComp_default = new Component("_default", false);
	displayComps.push(displayComp_active, displayComp_default);
	var display = new Aspect("Display", displayProps, displayComps, displayImplementedProps);
	// DISPLAY Definitions - END

	// EMAILCLIENT Definitions - BEGIN
	var emailClientProps = [];
	emailClientProps.push("supportedFormats", "version", "name", "vendor");
	var emailClientComps = [];
	var emailClientComp_default = new Component("_default", true);
	emailClientComps.push(emailClientComp_default);
	var emailClient = new Aspect("EmailClient", emailClientProps, emailClientComps);
	// EMAILCLIENT Definitions - END

	// JavaRuntimeEnvironment Definitions - BEGIN
	var javaRTEProps = [];
	javaRTEProps.push("j2meOptionalPackages", "javaPlatforms", "version", "name", 
			"j2meConfigurations", "vendor", "j2meProfiles");
	var javaRTEComps = [];
	var javaRTEComp_active = new Component("_active", false);
	var javaRTEComp_default = new Component("_default", true);
	javaRTEComps.push(javaRTEComp_active, javaRTEComp_default);
	var javaRTE = new Aspect("JavaRuntimeEnvironment", javaRTEProps, javaRTEComps);
	// JavaRuntimeEnvironment Definitions - END

	// MMSClient Definitions - BEGIN
	var MMSClientProps = [];
	MMSClientProps.push("supportedFormats", "version", "name", "vendor");
	var MMSClientComps = [];
	var MMSClientComp_active = new Component("_active", true);
	var MMSClientComp_default = new Component("_default", false);
	MMSClientComps.push(MMSClientComp_active, MMSClientComp_default);
	var mmsClient = new Aspect("MMSClient", MMSClientProps, MMSClientComps);
	// MMSClient Definitions - END

	// MediaPlayer Definitions - BEGIN
	var mediaPlayerProps = [];
	mediaPlayerProps.push("supportedFormats", "version", "name", "vendor");
	var mediaPlayerComps = [];
	var mediaPlayerComp_active = new Component("_active", false);
	var mediaPlayerComp_default = new Component("_default", true);
	mediaPlayerComps.push(mediaPlayerComp_active, mediaPlayerComp_default);
	var mediaPlayer = new Aspect("MediaPlayer", mediaPlayerProps, mediaPlayerComps);
	// MediaPlayer Definitions - END

	// MediaRecorder Definitions - BEGIN
	var mediaRecorderProps = [];
	mediaRecorderProps.push("supportedFormats", "version", "name", "vendor");
	var mediaRecorderComps = [];
	var mediaRecorderComp_active = new Component("_active", false);
	var mediaRecorderComp_default = new Component("_default", true);
	mediaRecorderComps.push(mediaRecorderComp_active, mediaRecorderComp_default);
	var mediaRecorder = new Aspect("MediaRecorder", mediaRecorderProps, mediaRecorderComps);
	// MediaRecorder Definitions - END

	// MemoryUnit Definitions - BEGIN
	var memoryUnitProps = [];
	memoryUnitProps.push("volatile", "size", "memoryTechnology", "removable", "avaiableSize");
	var memoryUnitComps = [];
	var memoryUnitComp_default = new Component("_default", true);
	memoryUnitComps.push(memoryUnitComp_default);
	var memoryUnit = new Aspect("MemoryUnit", memoryUnitProps, memoryUnitComps);
	// MemoryUnit Definitions - END

	// Microphone Definitions - BEGIN
	var microphoneProps = [];
	microphoneProps.push("status", "volumeLevel", "muted");
	var microphoneComps = [];
	var microphone = new Aspect("Microphone", microphoneProps, microphoneComps);
	// Microphone Definitions - END

	// NetworkBearer Definitions - BEGIN
	var networkBearerProps = [];
	networkBearerProps.push("bearerTechnology", "currentUploadBandwidth", "currentDownloadBandwidth",
			"apn", "ipAddress");
	var networkBearerComps = [];
	var networkBearerComp_current = new Component("_current", true);
	var networkBearerComp_default = new Component("_default", false);
	networkBearerComps.push(networkBearerComp_current, networkBearerComp_default);
	var networkBearer = new Aspect("NetworkBearer", networkBearerProps, networkBearerComps);
	// NetworkBearer Definitions - END

	// OPERATING SYSTEM DEFINITION - BEGIN
	var osProps = [];
	osProps.push("language", "version", "name", "vendor");

	var osImplementedProps = [];
	osImplementedProps.push("language", "version", "name", "vendor");

	var osComps = [];
	var osComp_default = new Component("_default", false);
	var osComp_active = new Component("_active", true);
	osComps.push(osComp_default, osComp_active);

	var os = new Aspect(this.OS, osProps, osComps, osImplementedProps);
	// Operating System definitions - END

	// SimCard Definitions - BEGIN
	var simCardProps = [];
	simCardProps.push("size", "simStatus", "avaiableSize");
	var simCardComps = [];
	var simCard = new Aspect("SimCard", simCardProps, simCardComps);
	// SimCard Definitions - END

	// Speaker Definitions - BEGIN
	var speakerProps = [];
	speakerProps.push("volumeLevel", "muted");
	var speakerComps = [];
	var speaker = new Aspect("Speaker", speakerProps, speakerComps);
	// Speaker Definitions - END

	// StorageUnit Definitions - BEGIN
	var storageUnitProps = [];
	storageUnitProps.push("volatile", "size", "memoryTechnology", "removable",
			"avaiableSize", "filesystem");
	var storageUnitComps = [];
	var storageUnitComp_default = new Component("_default", true);
	storageUnitComps.push(storageUnitComp_default);
	var storageUnit = new Aspect("StorageUnit", storageUnitProps, storageUnitComps);
	// StorageUnit Definitions - END

	// WapPushClient Definitions - BEGIN
	var wapPushClientProps = [];
	wapPushClientProps.push("version", "name", "vendor");
	var wapPushClientComps = [];
	var wapPushClientComp_active = new Component("_active", true);
	var wapPushClientComp_default = new Component("_default", false);
	wapPushClientComps.push(wapPushClientComp_active, wapPushClientComp_default);
	var wapPushClient = new Aspect("WapPushClient", wapPushClientProps, wapPushClientComps);
	// WapPushClient Definitions - END

	// WebBrowser Definitions - BEGIN
	var webBrowserProps = [];
	webBrowserProps.push("supportedFormats", "version", "name", "vendor");
	var webBrowserComps = [];
	var webBrowserComp_current = new Component("_current", true);
	var webBrowserComp_default = new Component("_default", false);
	webBrowserComps.push(webBrowserComp_current, webBrowserComp_default);
	var webBrowser = new Aspect("WebBrowser", webBrowserProps, webBrowserComps);
	// WebBrowser Definitions - END

	// WebRuntime Definitions - BEGIN
	var webRuntimeProps = [];
	webRuntimeProps.push("supportedFormats", "version", "name", "vendor");
	var webRuntimeComps = [];
	var webRuntimeComp_current = new Component("_current", true);
	var webRuntimeComp_default = new Component("_default", false);
	webRuntimeComps.push(webRuntimeComp_current, webRuntimeComp_default);
	var webRuntime = new Aspect("WebRuntime", webRuntimeProps, webRuntimeComps);
	// WebRuntime Definitions - END

	// WiFiHardware Definitions - BEGIN
	var wiFiHardwareProps = [];
	wiFiHardwareProps.push("status");
	var wiFiHardwareComps = [];
	var wiFiHardware = new Aspect("WiFiHardware", wiFiHardwareProps, wiFiHardwareComps);
	// WiFiHardware Definitions - END

	// WiFiNetwork Definitions - BEGIN
	var wiFiNetworkProps = [];
	wiFiNetworkProps.push("ssid", "signalStrength", "networkStatus", "networkTechnology",
	"encriptionType");
	var wiFiNetworkComps = [];
	var wiFiNetwork = new Aspect("WiFiNetwork", wiFiNetworkProps, wiFiNetworkComps);
	// WiFiNetwork Definitions - END

	// SETUP PROCEDURE FOR VOCABULARY
	var aspects = [];

	aspects.push(battery, bluetoothHardware, cpu, camera, callularH, cellularNetwork,
			device, display, emailClient, javaRTE, mmsClient, mediaPlayer, mediaRecorder,
			memoryUnit, microphone, networkBearer, os, simCard, speaker, storageUnit,
			wapPushClient, webBrowser, webRuntime, wiFiHardware, wiFiNetwork
	);

	return new Vocabulary(this.BONDI_VOCABULARY, aspects);

}

/**
 * Representation of a vocabulary
 */
function Vocabulary(name, aspects){
	this.name = name;
	this.aspects = aspects;
}

/**
 * Searches and, if found in this vocabulary, returns an aspect with the given
 * name
 */
Vocabulary.prototype.searchAspect = function(aspectName){
	var aspect = null;

	for (var i = 0; i < this.aspects.length; i++){
		if (this.aspects[i].name == aspectName){
			aspect = this.aspects[i];
			break;
		}
	}

	return aspect;
}

/**
 * checks if an aspect with the given name exists within this vocabulary
 */
Vocabulary.prototype.aspectIsValid = function(aspectName){
	var aspect = this.searchAspect(aspectName);
	return (aspect != null);
}

//Vocabulary.prototype.propertyIsValid = function(aspectName, propertyName){
//var aspect = this.searchAspect(aspectName);
//var property =
//}

/**
 * searches for the first aspect that has a property with the given name
 */
Vocabulary.prototype.searchAspectByProperty = function(propertyName){
	var found = false;
	var aspect = null;

	for (var j = 0; (j < this.aspects.length) && (found != true); j++){
		var propertiesOfAspect = this.aspects[j].properties;
		for (var k = 0; k < propertiesOfAspect.length; k++){
			if (propertiesOfAspect[k] == propertyName){
				aspect = this.aspects[j];
				found = true;
				break;
			}
		}
	}

	return aspect;
}

/**
 * Searches for an aspect with the given name and checks if a property with the
 * given name is implemented for this aspect
 */
Vocabulary.prototype.propertyIsImplemented = function(aspectName, propertyName){
	var aspect = this.searchAspect(aspectName);
	if (aspect == null){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "Aspect is not part of the used vocabulary";
		throw error;
	}

	implementedProps = aspect.implementedProperties;

	for (var i = 0; i < implementedProps.length; i++){
		if (implementedProps[i] == propertyName){
			return true;
		}
	}

	return false;
}

/**
 * This Method does much of the same as propertyIsImplemented, but uses possible
 * knowledge acquired before.
 * 
 * If aspect is already found e.g. by searchAspect this method should be
 * prefered before propertyIsImplemented because it will lead to better
 * performance
 */
Vocabulary.prototype.propertyIsImplementedForAspect = function(aspect, propertyName){

	implementedProps = aspect.implementedProperties;

	for (var i = 0; i < implementedProps.length; i++){
		if (implementedProps[i] == propertyName){
			return true;
		}
	}

	return false;
}

/**
 * Representation of an aspect within a vocabulary
 */
function Aspect(name, properties, components, implementedProperties){
	this.name = name;
	this.components = components;
	this.properties = properties;
	if (typeof implementedProperties == "undefined"){
		this.implementedProperties = [];
	} else {
		this.implementedProperties = implementedProperties;
	}
}

/**
 * Representation of an aspect within a vocabulary
 */
function Component(name, isDefault){
	this.name = name;
	this.isDefault = isDefault;
}

/**
 * lists all supported vocabularies
 */
DeviceStatusManager.prototype.listVocabularies = function() {
	var supportedVocNames = [];
	for (var i = 0; i < this.supportedVocabularies.length; i++){
		supportedVocNames.push(this.supportedVocabularies[i].name);
	}

	return supportedVocNames;
}

/**
 * Lists all aspects of a supported vocabulary with the given Name if no
 * vocabularyName is given the default Vocabulary is used
 */
DeviceStatusManager.prototype.listAspects = function(vocabularyName){
	var aspectIDs = [];
	var aspects = null;
	var i = 0;

	if (typeof vocabularyName == "undefined"){
		aspects = this.defaultVocabulary.aspects;
	} else {	
		var found = false;
		for (i = 0; i < this.supportedVocabularies.length; i++){
			if (this.supportedVocabularies[i].name == vocabularyName){
				aspects = this.supportedVocabularies[i].aspects;
				found = true;
			}
		}

		if (!found){
			var error = new DeviceAPIError();
			error.code = error.NOT_FOUND_ERROR;
			error.message = "Vocabulary is not part of supported vocabularies";
			throw error;
		}
	}

	for (i = 0; i < aspects.length; i++){
		aspectIDs.push(aspects[i].name);
	}

	return aspectIDs;
}



DeviceStatusManager.prototype.getComponents = function(aspectName){

	var vocabularyName = aspectName.vocabulary;
	var aspect = null;
	var error;

	if (typeof vocabularyName == "undefined"){
		aspect = this.defaultVocabulary.searchAspect(aspectName.aspect);
	} else {
		aspect = this.getVocabulary(vocabularyName).searchAspect(aspectName.aspect);
		var found = false;
	}

	if (aspect == null){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "Aspect is not part of the used vocabulary";
		throw error;
	} else if (aspect.implementedProperties.length < 1){
		error = new DeviceAPIError();
		error.code = error.NOT_FOUND_ERROR;
		error.message = "Aspect is valid but not implemented";
		throw error;
	}

	return aspect.components;
}

DeviceStatusManager.prototype.getVocabulary = function(vocabularyName){

	for (var i = 0; i < this.supportedVocabularies.length; i++){
		if (this.supportedVocabularies[i].name == vocabularyName){
			return this.supportedVocabularies[i];
		}
	}

	var error = new DeviceAPIError();
	error.code = error.NOT_FOUND_ERROR;
	error.message = "Vocabulary is not part of supported vocabularies";
	throw error;
}

DeviceStatusManager.prototype.listProperties = function(aspectName){
	var vocabulary = null;
	var error;

	if (typeof aspectName.vocabulary == "undefined"){
		vocabulary = this.defaultVocabulary;
	} else {
		vocabulary = this.getVocabulary(aspectName.vocabulary);
	}

	var aspect = vocabulary.searchAspect(aspectName.aspect);

	if (aspect == null){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "Aspect is not part of the used vocabulary";
		throw error;
	} else if (aspect.implementedProperties.length < 1){
		error = new DeviceAPIError();
		error.code = error.NOT_FOUND_ERROR;
		error.message = "Aspect is valid but not implemented";
		throw error;
	}

	return aspect.properties;
}

DeviceStatusManager.prototype.listImplementedProperties = function(aspectName){
	var vocabulary = null;
	var error;

	if (typeof aspectName.vocabulary == "undefined"){
		vocabulary = this.defaultVocabulary;
	} else {
		vocabulary = this.getVocabulary(aspectName.vocabulary);
	}

	var aspect = vocabulary.searchAspect(aspectName.aspect);

	if (aspect == null){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "Aspect is not part of the used vocabulary";
		throw error;
	} else if (aspect.implementedProperties.length < 1){
		error = new DeviceAPIError();
		error.code = error.NOT_FOUND_ERROR;
		error.message = "Aspect is valid but not implemented";
		throw error;
	}

	return aspect.implementedProperties;
}

/**
 * watchPropertyChange.
 * @param propertyRef the property reference to the property to be notified of changes.
 * @param propertyChangeSuccessCallback callCack to be invoked whenever the event is raised.
 * @param options The set of options which will specify the granularity of notifications.
 */
DeviceStatusManager.prototype.watchPropertyChange = function(propertyRef, propertyChangeSuccessCallback, options){
	var error;
	var property = null;
	var aspect = null;
	var component = null;
	var vocabulary = null; // this.defaultVocabulary;

	var minChangePercent = 0;
	var callCallbackOnRegister = false;

	if (typeof options == "undefined"){
		options = {};
	}

	if (typeof propertyChangeSuccessCallback != 'function' || propertyChangeSuccessCallback == null){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "SuccessCallback has to be defined and a function";
		throw error;
	}

	if (typeof propertyRef.vocabulary != "undefined" && propertyRef.vocabulary != null){
		vocabulary = this.getVocabulary(propertyRef.vocabulary);
	} else {
		vocabulary = this.defaultVocabulary;
	}

	if ((typeof propertyRef.property == "undefined") || (propertyRef.property == null)){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "property must be defined and not be null";
		throw error;
	} else {
		property = propertyRef.property;
	}

	if (typeof propertyRef.aspect != "undefined"){
		// ... check if aspect is available;
		aspect = vocabulary.searchAspect(propertyRef.aspect);

		if (aspect == null){
			error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "Aspect is not part of the used vocabulary";
			throw error;
		} else if (aspect.implementedProperties.length < 1){
			error = new DeviceAPIError();
			error.code = error.NOT_FOUND_ERROR;
			error.message = "Aspect is valid but not implemented";
			throw error;
		}
	}

	if (typeof propertyRef.component != "undefined"){
		component = propertyRef.component;
	}


	if (aspect == null){
		aspect = vocabulary.searchAspectByProperty(property);

		if (aspect == null){
			error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "Aspect is not part of the used vocabulary";
			throw error;
		} else if (aspect.implementedProperties.length < 1){
			error = new DeviceAPIError();
			error.code = error.NOT_FOUND_ERROR;
			error.message = "Aspect is valid but not implemented";
			throw error;
		}
	}

	if(component == null){
		var components = aspect.components;
		for (var l = 0; l < components.length; l++){
			if (components[l].isDefault){
				component = components[l];
			}
		}
	}

	var now = new Date().getTime();
	var key = this.listeners.push({propRef:propertyRef, callBack:propertyChangeSuccessCallback, ops:options, timers:[], propertyChangedFlag:false, lastCallTime:now}) -1;

	if (typeof options.minChangePercent != "undefined"){
		minChangePercent = options.minChangePercent;
	}


	var minTSet = false;
	if (typeof options.minTimeout != "undefined"){
		minTSet = true;
		if (options.minTimeout < 0){
			error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "minTimeout has to be >= 0";
			this.listeners[key] = null;
			throw error;
		}	
	}

	var maxTSet = false;
	if (typeof options.maxTimeout != 'undefined'){
		maxTSet = true;
		if (minTSet){
			if (options.maxTimeout < options.minTimeout){
				error = new DeviceAPIError();
				error.code = error.INVALID_ARGUMENT_ERROR;
				error.message = "maxTimeout has to be greater than minTimeout. \n minTimeout was: " + options.minTimeout;
				this.listeners[key] = null;
				throw error;
			}
		} else {
			if (options.maxTimeout < -1 ){
				error = new DeviceAPIError();
				error.code = error.INVALID_ARGUMENT_ERROR;
				error.message = "maxTimeout has to be greater than -1";
				this.listeners[key] = null;
				throw error;
			}
		}
	}

	if (typeof options.callCallbackOnRegister != "undefined" && options.callCallbackOnRegister != null){
		if (options.callCallbackOnRegister == true || options.callCallbackOnRegister == false){
			callCallbackOnRegister = options.callCallbackOnRegister;
		}else {
			error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "callCallbackOnRegister, if set, must be true or false";
			this.listeners[key] = null;
			throw error;
		}
	}

	if (aspect.name == this.BATTERY){
		if (property == "batteryLevel"){
			DStatus.setupBatteryLevelListener(key, minChangePercent);
			if (callCallbackOnRegister){
				this.propertyChanged(key, DStatus.getBatteryLevel());
			} else {
				this.listeners[key].lastValue = DStatus.getBatteryLevel();
				this.listeners[key].propertyChanged = true;
			}

		} else if (property == "batteryTechnology"){
			DStatus.setupBatteryTechnologyListener(key);
			if (callCallbackOnRegister){
				this.propertyChanged(key, DStatus.getBatteryTechnology());
			} else {
				this.listeners[key].lastValue = DStatus.getBatteryTechnology();
				this.listeners[key].propertyChanged = true;
			}

		} else if (property == "batteryBeingCharged"){
			DStatus.setupBatteryIsChargedListener();
			if (callCallbackOnRegister){
				this.propertyChanged(key, DStatus.batteryIsBeingCharged());
			} else {
				this.listeners[key].lastValue = DStatus.batteryIsBeingCharged();
				this.listeners[key].propertyChanged = true;
			}
		}

	} else if (aspect.name == this.OS){
		error = new DeviceAPIError();
		error.code = error.NOT_FOUND_ERROR;
		error.message = "watchPropertyChange for " + property + " is not implemented";
		throw error;

//		if (property == "version"){
//		return this.Device.version;
//		} else if (property == "name"){
//		return this.Device.name;
//		} else{
//		var error = new DeviceAPIError();
//		error.code = error.NOT_FOUND_ERROR;
//		error.message = "watchPropertyChange for " + property + " is not
//		implemented";
//		throw error;
//		}
	} else if (aspect.name == "Display"){
		if (property == "currentOrientation"){
			if (typeof options != "undefined"){
				if (typeof options.minChangePercentage != "undefined"){
					DStatus.setupDisplayOrientationListener(key, options.minChangePercentage);
					return key;
				}
			}

			DStatus.setupDisplayOrientationListener(key, 0.0);
		}
	}

	var that = this;
	if (minTSet && options.minTimeout > 0){
		//activate minTimer
		var minTimer = {};
		minTimer.time = options.minTimeout;
		minTimer.title = "minTimeout";

		if (options.minTimeout < 2000){
			options.minTimeout = 2000;
		}

		var minTimerID = setTimeout(function(){
			that.propertyChanged(key,null,"minTimeout");			
		}, options.minTimeout); 
		minTimer.id = minTimerID;
		this.listeners[key].timers.push(minTimer);
	}

	if (maxTSet && options.maxTimeout > 0){
		//activate maxTimer
		var maxTimer = {};
		maxTimer.time = options.maxTimeout;
		maxTimer.title = "maxTimeout";

		if (options.maxTimeout < 2000){
			options.maxTimeout = 2000;
		}

		var maxTimerID = setTimeout(function(){
			that.propertyChanged(key,null,"maxTimeout");			
		}, options.maxTimeout); 
		maxTimer.id = maxTimerID;
		this.listeners[key].timers.push(maxTimer);
	}

	// Java Version
//	DStatus.startTimer(key, options.minTimeout, options.maxTimeout);
//	DStatus.startTimer(key, 1000, 5000);

	return key;
}

DeviceStatusManager.prototype.restartTimers = function (key) {

	if ((typeof this.listeners[key] != 'undefined') && this.listeners[key] != null){

		if (typeof this.listeners[key].timers != 'undefined'){
			var timers = this.listeners[key].timers;
			var that = this;

			this.listeners[key].timers = [];
			while (timers.length > 0){
				timer = timers.pop();
				clearTimeout(timer.id);
				var newID = setTimeout(function(){
					that.propertyChanged(key,null,timer.title);
				}, timer.time);
				timer.id = newID;
				this.listeners[key].timers.push(timer);
			}
		}
	}
}


DeviceStatusManager.prototype.propertyChanged = function(key, propertyValue, title){

	var minCall = false;
	var maxCall = false;
	if (typeof title != "undefined"){
		if (title == "minTimeout"){
			minCall = true;
		} else {
			maxCall = true;
		}
	}

	if ((typeof this.listeners[key] != 'undefined') && (this.listeners[key] != null)){
		if (typeof this.listeners[key].callBack != "undefined"){
			var options = this.listeners[key].ops;

			if (propertyValue != null){
				// update value of watched property
				this.listeners[key].lastValue = propertyValue;
				// signal to possible later calls that an update took place since the last callback call
				this.listeners[key].propertyChangedFlag = true;
			}

			if ((minCall && this.listeners[key].propertyChangedFlag) || maxCall){
				// minimal waiting time before next possible call is done and property has changed meanwhile
				this.listeners[key].propertyChangedFlag = false;
				this.listeners[key].lastCallTime = now;
				this.listeners[key].callBack(this.listeners[key].propRef, this.listeners[key].lastValue);
				this.restartTimers(key);
				//DStatus.restartTimer(key);
				return;
			}

			// Check if value can be given to callback or if we have to wait
			if (typeof options.minTimeout != "undefined"){
				var minTimeout = options.minTimeout;
				var lastTime = this.listeners[key].lastCallTime;
				var now = new Date().getTime();
				if ((now - lastTime) > minTimeout){
					// we are allowed to call
					this.listeners[key].callBack(this.listeners[key].propRef, this.listeners[key].lastValue);
					// signal that the property was recently given to callback and has not changed yet
					this.listeners[key].propertyChangedFlag = false;

					// store last time we called
					this.listeners[key].lastCallTime = now;
					this.restartTimers(key);
					//DStatus.restartTimer(key);
				} 
			} else {
				this.listeners[key].callBack(this.listeners[key].propRef, this.listeners[key].lastValue);
				this.listeners[key].lastCallTime = now;
				this.listeners[key].propertyChangedFlag = false;
				this.restartTimers(key);
//				DStatus.restartTimer(key);
			}

		}

	} else if (minCall || maxCall){
//		DStatus.cancelTimer(key);
	}

}


/**
 * clearPropertyChange.
 * @param key - watchHandlerKey returned by DeviceStatusManager::watchPropertyChange()
 * @throws DeviceAPIError INVALID_ARGUMENT_ERROR
 */
DeviceStatusManager.prototype.clearPropertyChange = function(key){
	if (typeof key == "undefined" || key == null){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "Tried to unregister a listener with undefined key or null";
		throw error;
	}

	var propertyRef = this.listeners[key].propRef;

	if (propertyRef.aspect == "Display"){
		if (propertyRef.property == "currentOrientation"){
			DStatus.removeDisplayOrientationListener(key);
		}
	} else if (propertyRef.aspect == "Battery"){
		if (propertyRef.property == "batteryLevel"){
			DStatus.removeBatteryLevelListener(key);
		} else if (propertyRef.property == "batteryTechnology"){
			DStatus.removeBatteryTechnologyListener(key);
		} else if (propertyRef.property == "batteryBeingCharged"){
			DStatus.removeBatteryIsChargedListener(key);
		}
	} else {
		alert("tried to remove a listener, but there was no unregister-procedure in clearPropertyChange for it");
	}
//	if (typeof this.listeners[key].timer != "undefined" && this.listeners[key].timer != null){
//	var timer = this.listeners[key].timer;
//	clearTimeout(timer);
//	}
//	DStatus.cancelTimer(key);
	this.listeners[key] = null;
}

DeviceStatusManager.prototype.clearAllPropertyChange = function(){
	for (var key = 0; key < this.listeners.length; key++){
		if (this.listeners[key] != null){
			this.clearPropertyChange(key);
		}
	}
}



DeviceStatusManager.prototype.getPropertyValue = function(propertyRef){
	var error;
	var property = null;
	var aspect = null;
	var component = null;
	var vocabulary = null; // this.defaultVocabulary;

	if (typeof propertyRef.vocabulary != "undefined" && propertyRef.vocabulary != null){
		vocabulary = this.getVocabulary(propertyRef.vocabulary);
	} else {
		vocabulary = this.defaultVocabulary;
	}

	if ((typeof propertyRef.property == "undefined") || (propertyRef.property == null)){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "property must be defined and not be null";
		throw error;
	} else {
		property = propertyRef.property;
	}

	if (typeof propertyRef.aspect != "undefined"){
		// ... check if aspect is available;
		aspect = vocabulary.searchAspect(propertyRef.aspect);

		if (aspect == null){
			error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "Aspect is not part of the used vocabulary";
			throw error;
		} else if (aspect.implementedProperties.length < 1){
			error = new DeviceAPIError();
			error.code = error.NOT_FOUND_ERROR;
			error.message = "Aspect is valid but not implemented";
			throw error;
		}
	}

	if (typeof propertyRef.component != "undefined"){
		component = propertyRef.component;
	}


	if (aspect == null){
		aspect = vocabulary.searchAspectByProperty(property);

		if (aspect == null){
			error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "Aspect is not part of the used vocabulary";
			throw error;
		} else if (aspect.implementedProperties.length < 1){
			error = new DeviceAPIError();
			error.code = error.NOT_FOUND_ERROR;
			error.message = "Aspect is valid but not implemented";
			throw error;
		}
	}

	if(component == null){
		var components = aspect.components;
		for (var l = 0; l < components.length; l++){
			if (components[l].isDefault){
				component = components[l];
			}
		}
	}

	if (aspect.name == this.BATTERY){
		if (property == "batteryLevel"){
			return DStatus.getBatteryLevel();
		} else if (property == "batteryCapacity"){
			error = new DeviceAPIError();
			error.code = error.NOT_FOUND_ERROR;
			error.message = "batteryCapacity is not implemented";
			throw error;
		} else if (property == "batteryTechnology"){
			var technology = DStatus.getBatteryTechnology();
			if (technology == "unknown"){
				error = new DeviceAPIError();
				error.code = error.UNKNOWN_ERROR;
				error.message = "Unable to determine technology of this battery at the moment";
				throw error;
			} else {
				return technology;
			}
		} else if (property == "batteryTime"){
			error = new DeviceAPIError();
			error.code = error.NOT_FOUND_ERROR;
			error.message = "batteryTime is not implemented";
			throw error;
		} else if (property == "batteryBeingCharged"){
			var charge = DStatus.batteryIsBeingCharged();
			if (charge == "true"){
				return true;
			} else if (charge == "false"){
				return false;
			} else {
				error = new DeviceAPIError();
				error.code = error.UNKNOWN_ERROR;
				error.message = "Unable to determine if battery is being charged at the moment";
				throw error;
			}
		}

	} else if (aspect.name == this.OS){
		if (property == "version"){
			return this.Device.version;
		} else if (property == "name"){
			return this.Device.name;
		} else if (property == "language"){
			return DStatus.getLanguage();
		} else if (property == "vendor"){
			return "Google Inc.";
		} else {
			error = new DeviceAPIError();
			error.code = error.NOT_FOUND_ERROR;
			error.message = "property " + property + " is not implemented";
			throw error;
		}
	}
}

DeviceStatusManager.prototype.setPropertyValue = function(propertyRef){
	var error;
	var property = null;
	var aspect = null;
	var component = null;
	var vocabulary = this.defaultVocabulary;

	if ((typeof propertyRef.property == "undefined") || (propertyRef.property == null)){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "property must be defined and not be null";
		throw error;
	} else {
		property = propertyRef.property;
	}

	if (typeof propertyRef.aspect != "undefined"){
		// ... check if aspect is avaiable;
		aspect = vocabulary.searchAspect(propertyRef.aspect);

		if (aspect == null){
			error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "Aspect is not part of the used vocabulary";
			throw error;
		} else if (aspect.implementedProperties.length < 1){
			error = new DeviceAPIError();
			error.code = error.NOT_FOUND_ERROR;
			error.message = "Aspect is valid but not implemented";
			throw error;
		}
	}

	if (typeof propertyRef.component != "undefined"){
		component = propertyRef.component;
	}


	if (aspect == null){
		aspect = vocabulary.searchAspectByProperty(property);

		if (aspect == null){
			error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "Aspect is not part of the used vocabulary";
			throw error;
		} else if (aspect.implementedProperties.length < 1){
			error = new DeviceAPIError();
			error.code = error.NOT_FOUND_ERROR;
			error.message = "Aspect is valid but not implemented";
			throw error;
		}
	}

	if(component == null){
		var components = aspect.components;
		for (var l = 0; l < components.length; l++){
			if (components[l].isDefault){
				component = components[l];
			}
		}
	}

	error = new DeviceAPIError();
	error.code = error.NOT_SUPPORTED_ERROR;
	error.message = "The value cannot be set";
	throw error;
}


DeviceStatusManager.prototype.setDefaultVocabulary = function(vocabulary){
	var error;
	if (typeof vocabulary == "undefined" || vocabulary == null || vocabulary == ''){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "Vocabulary must be defined, not empty and not be null";
		throw error;
	}


	var set = false;
	for (var i = 0; i < this.supportedVocabularies.length; i++){
		if (this.supportedVocabularies[i].name == vocabulary){
			this.defaultVocabulary = this.supportedVocabularies[i];
			set = true;
		}
	}

	if (!set){
		error = new DeviceAPIError();
		error.code = error.NOT_FOUND_ERROR;
		error.message = "Vocabulary is not part of supported vocabularies";
		throw error;
	}

}

function oc(a)
{
	var o = {};
	for(var i=0;i<a.length;i++)
	{
		o[a[i]]='';
	}
	return o;
}


//PhoneGap.addConstructor(function() {
//if (typeof bondi.devicestatus == "undefined") bondi.devicestatus = new DeviceStatusManager();
//if (typeof bondi.devicestatusManager == "undefined") bondi.devicestatusManager = bondi.devicestatus;
//});


//bondi fileSystem
/**
 * FileSystemManager.
 * Default constructor.
 */
function FileSystemManager(){
	this.maxPathLength = 9999; // should be unlimited (HFS+ or FAT32 depending on OS)
	this.legalLocations = ["wgt:package","wgt:private","wgt:public","wgt:temp","images","videos", "documents","images", "sdcard", "temp"];
	this.eventListener = [];
}
PhoneGap.addConstructor(function() {
	if (typeof bondi.filesystem == "undefined") bondi.filesystem = new FileSystemManager();
});

/**
 * getDefaultLocation.
 * @param specifier the location specifier, see above for supported specifiers.
 * @param minFreeSpace optional, minimum required free disk space in bytes for this location, 0 (default) means no limitation
 * @return the location as a string or null if there is no location for the given specifier or if there is not enough space left for the requested space in bytes.
 * @throws DeviceAPIError, INVALID_ARGUMENT_ERROR
 */
FileSystemManager.prototype.getDefaultLocation = function(specifier, minFreeSpace) {

	var error;

	if (typeof minFreeSpace == 'undefined')
		minFreeSpace = 0;

	if (typeof minFreeSpace != 'number') {
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "minFreeSpace must be a number";
		throw error;
	}

	if (minFreeSpace >= 0 && specifier in oc(this.legalLocations)) {
		var defaultLocation = FileSystem.getDefaultLocation(specifier,minFreeSpace);
		if (typeof defaultLocation == 'undefined') {
			defaultLocation = null;
			error = new DeviceAPIError(10001);
			error.message = "defaultLocation has to be defined";
			throw error;
			return;
		} else {
			defaultLocation = defaultLocation + '';
		}
		return defaultLocation;
	}
	else {
		error = new DeviceAPIError(10001);
		error.message = "minFreeSpace has to be >= 0, and defaultlocation must be legal choice";
		throw error;
		return null;
	}
}

/**
 * mounted.
 * @param listener a path
 */
FileSystemManager.prototype.mounted = function(path) {
	for (var i = 0; i < this.eventListener.length; i++) {
		this.eventListener[i].mountEvent(path);
	}
}

/**
 * unmounted.
 * @param listener a path
 */
FileSystemManager.prototype.unmounted = function(path) {
	for (var i = 0; i < this.eventListener.length; i++) {
		this.eventListener[i].unmountEvent(path);
	}
}


/**
 * Method getRootLocations
 * @return a list of resolvable rootLocations
 */
FileSystemManager.prototype.getRootLocations = function() {
	var files = eval( "(" + FileSystem.getRootLocations() + ")");
	var result = [];
	for (var i=0;i<files.length;i++){
		result.push(files[i] + '');
	}
	return result;
}
/**
 * Resolves a root location.
 * 
 * @param the
 *            location
 * @return an file object representing the location
 * @throws
 */
FileSystemManager.prototype.resolveSynchron = function(location) {
	var returnstring = FileSystem.resolve(location);
	var returnvalue = eval("(" + returnstring + ")");

	if (returnvalue["error"] != null) {
		var error = new DeviceAPIError();
		error.code = returnvalue["error"]; //error.IO_ERROR;
		error.message = "location could not be read -> is no file or directory";
		throw error;
	} else {
		var result = new BondiFile();

		result.readOnly = returnvalue["readonly"];
		result.name = returnvalue["name"];
		result.path = returnvalue["path"];
		result.absolutePath = returnvalue["absolutepath"];
		result.fileSize = returnvalue["filesize"];
		result.created = new Date(returnvalue["created"]);
		result.modified = new Date(returnvalue["modified"]);
		result.isFile = returnvalue["isfile"];
		result.isDirectory = returnvalue["isdirectory"];
		result.parent = returnvalue["parent"];

		return result;
	}
}
/**
 * Resolves a root location.
 * 
 * @param the
 *            location
 * @return an file object representing the location
 * @throws PERMISSION_DENIED_ERROR when access is denied by the security policy.
 * @throws INVALID_ARGUMENT_ERROR if invalid location or invalid mode was given. 
 */
FileSystemManager.prototype.resolve = function(successCallback, errorCallback, location, mode) {
	var error;
	// check the parameter
	if (typeof errorCallback != "function") {
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "errorCallback should be a function";
		throw error;
	}
	if (typeof successCallback != "function") {
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "successCallback should be a function";
		errorCallback(error);
		return;
	}
	if (typeof mode == "undefined") {
		mode = "r";
	} else if (!(mode == 'r' || mode == 'rw' )){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "mode has to be 'r' or 'rw' if defined";
		errorCallback(error);
		return;
	}
	if (typeof location == "undefined" || location == null) {
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "location has to be defined and != null";
		errorCallback(error);
		return;
	}
	setTimeout(function() {
		var mydoc;
		try {
			mydoc = bondi.filesystem.resolveSynchron(location);
			if (mode == "r" && !mydoc.isDirectory) {
				mydoc.readOnly = true;
			}
		} catch (e)	{
			e.code = e.INVALID_ARGUMENT_ERROR;
			errorCallback(e);
			return;
		}
		successCallback(mydoc);
	}, 1);

	return new PendingOperation();
}
/**
 * Registers a fileSystem event listener.
 * 
 * @return void
 * @throws DeviceAPIError
 */
FileSystemManager.prototype.registerEventListener = function(listener) {

	if (typeof listener != 'function'){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "listener has to be defined and a function.";
		throw error;
	}
	this.eventListener.push(listener);
}



/**
 * Unregisters a fileSystem event listener.
 * 
 * @param listener an event listener.
 * @return void
 * @throws DeviceAPIError
 */
FileSystemManager.prototype.unregisterEventListener = function(listener) {

	if (typeof listener != 'function'){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "listener has to be defined and a function.";
		throw error;
	}

	this.eventListener = this.eventListener.filter(
			function(element,index,array) {
				return (listener !== element);
			});
}

/**
 * FileSystem event listener class.
 * Default constructor.
 */
function FileSystemListener(){
}
/**
 * mountEvent.
 * Called when a new root location gets available.
 * @param location the newly available location
 */
FileSystemListener.prototype.mountEvent= function(location) { 
	alert('mounted: ' + location); 
}
/**
 * unmountEvent.
 * Called when a location gets unavailable.
 * @param location the newly available location
 */
FileSystemListener.prototype.unmountEvent= function(location) { 
	alert('unmounted: ' + location); 
}

function BondiFile(){

	// this.initialized = false;
	this.parent = null;
	this.readOnly = false;
	this.isFile = false;
	this.isDirectory = false;
	this.created = new Date();
	this.modified = new Date();
	this.path = "";
	this.name = "";
	this.absolutePath = "";
	this.fileSize;
	this.metadata={};
	this.fail = function(){alert('operation failed');};
	this.success = function(){alert('operation successful');};
}

BondiFile.prototype.asString = function(){
	var out = '';
	out += ' parent=' + this.parent;
	out += ' readOnly=' + this.readOnly;
	out += ' isFile=' + this.isFile;
	out += ' isDirectory=' + this.isDirectory;
	out += ' created =' + this.created;
	out += ' modified=' + this.modified;
	out += ' path =' + this.path;
	out += ' name =' + this.name;
	out += 'absolutePath =' + this.absolutePath;
	return out;
}

/**
 * list the files in the directory
 * 
 * @throws (SecurityError,
 *             DeviceAPIError);
 */
BondiFile.prototype.listFiles = function() {
	var error;
	var returntext = eval( "(" + FileSystem.listFiles(this.absolutePath) + ")");
	if (returntext["error"] != null) {
		if (returnvalue["error"] == SecurityError.PERMISSION_DENIED_ERROR){
			error = new SecurityError();
			error.code = returnvalue["error"];
			error.message = returnvalue["errorMessage"];
		} else {
			error = new DeviceAPIError();
			error.code = error.IO_ERROR;
			error.message = returnvalue["errorMessage"];
		}
		throw error;
	}
	var files = returntext["files"];
	var result = [];
	for (var i=0;i<files.length;i++) {
		result[i] = this.resolve(files[i]);
	}
	return result;
}

/**
 * @param in
 *            DOMString filePath
 * @return File
 * @param throws(SecurityError,
 *            DeviceAPIError)
 */
BondiFile.prototype.resolve = function(location) {
	var returnvalue = eval("(" + FileSystem.resolve(location, this.absolutePath) + ")");
	if (returnvalue["error"] != null) {
		var error = new DeviceAPIError();
		error.code = returnvalue["error"];
		error.message = returnvalue["errorMessage"]; 
		throw error;
	} else {
		var result = new BondiFile();
		result.readOnly = returnvalue["readonly"];
		result.name = returnvalue["name"];
		result.path = returnvalue["path"];
		result.absolutePath = returnvalue["absolutepath"];
		result.fileSize = returnvalue["filesize"];
		result.created = new Date(returnvalue["created"]);
		result.modified = new Date(returnvalue["modified"]);
		result.isFile = returnvalue["isfile"];
		result.isDirectory = returnvalue["isdirectory"];
		result.parent = this;
		return result;
	}
}

/**
 * Opens the file in the given mode supporting the given encoding.
 * 
 * @param in
 *            DOMString mode
 * @param in
 *            DOMString encoding
 * @return FileStream
 * @throws SecurityError,
 *             DeviceAPIError);
 */
BondiFile.prototype.open = function(mode, encoding) {
	var ret = FileSystem.open(this.absolutePath, mode, encoding);
	var retval = eval('(' + ret + ')');
	if (retval["error"] != null) {
		FileSystem.log(this.name + ":" + mode + ":" + encoding + " =>" + retval["error"]);
		var error = new DeviceAPIError();
		error.code = parseInt(retval["error"]);
		error.message = retval["errorMessage"];
		throw error;
	}
	var stream = new FileStream();
	stream.id = retval["fd"];
	stream.position = 0;
	return stream;
}

/**
 * Copies this file.
 * 
 * @param in
 *            FileSystemSuccessCallback successCallback
 * @param in
 *            ErrorCallback errorCallback
 * @param in
 *            DOMString filePath
 * @param in
 *            boolean overwrite
 * @return PendingOperation
 * @throws (SecurityError,
 *             DeviceAPIError);
 */
BondiFile.prototype.copyTo = function(successCallback,errorCallback,filePath,overwrite){
	bondi.filesystem.success = successCallback; 
	bondi.filesystem.fail = errorCallback;
	var result = FileSystem.copyTo(this.absolutePath, filePath,overwrite);
	if (typeof(result) != 'undefined') {
		var error = new DeviceAPIError();
		error.code = error.IO_ERROR;
		error.message = result;
		throw error;
	}
	var pe = new PendingOperation();
	pe.cancel = function() {
		return false;
	}
	return pe;
}

/**
 * Moves this file.
 * 
 * @param in
 *            FileSystemSuccessCallback successCallback,
 * @param in
 *            ErrorCallback errorCallback,
 * @param in
 *            DOMString filePath,
 * @param in
 *            boolean overwrite)
 * @return PendingOperation
 * @throws (SecurityError,
 *             DeviceAPIError)
 */
BondiFile.prototype.moveTo = function(successCallback, errorCallback, filePath, overwrite) {
	var error;

	if (typeof errorCallback != "function"){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "errorCallback has to be defined and a function";
		throw error;
	} else if (typeof successCallback != "function"){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "successCallback has to be defined and a function";
		errorCallback(error);
		return;
	} else if (typeof filePath != "string"){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "filePath has to be defined";
		errorCallback(error);
		return;
	}

	bondi.filesystem.success = successCallback;
	bondi.filesystem.fail = errorCallback;
	var result = FileSystem.moveTo(this.absolutePath, filePath, overwrite);
	if ((typeof result != 'undefined') && result != null) {
		error = new DeviceAPIError();
		error.code = error.IO_ERROR;
		error.message = result;
		errorCallback(error);
		return;
	}
	var pe = new PendingOperation();
	pe.cancel = function() {
		return false;
	}
	return pe;
}


/**
 * Creates a directory.
 * 
 * @param in
 *            DOMString dirPath
 * @return File
 * @throws (SecurityError,
 *             DeviceAPIError)
 */
BondiFile.prototype.createDirectory = function(dirPath) {
	var error;
	var returnstring = FileSystem.createDirectory(this.absolutePath, dirPath);
	var returnvalue = eval("(" + returnstring + ")");
	if (returnvalue["error"] != null) {
		error = new DeviceAPIError();
		error.code = returnvalue["error"];
		error.message = returnvalue["errorMessage"];
		throw error;
	} else {
		var result = new BondiFile();
		result.parent = this;
		result.readOnly = returnvalue["readonly"];
		result.name = returnvalue["name"];
		result.path = returnvalue["path"];
		result.absolutePath = returnvalue["absolutepath"];
		result.fileSize = returnvalue["filesize"];
		result.created = returnvalue["created"];
		result.modified = returnvalue["modified"];
		result.isFile = returnvalue["isfile"];
		result.isDirectory = returnvalue["isdirectory"];

		console.log("isDirectory=" + result.isDirectory);

		console.log("absolutePath=" + result.absolutePath);

		return result;
	}	
}

/**
 * Creates a new empty file.
 * 
 * 
 * @param in
 *            DOMString filePath
 * @return File
 * @throws (SecurityError,
 *             DeviceAPIError)
 */
BondiFile.prototype.createFile = function(filePath){
	var returnstring = FileSystem.createFile(this.absolutePath, filePath);
	var returnvalue = eval("(" + returnstring + ")");
	if (returnvalue["error"] != null) {
		if (returnvalue["error"] != 20000){
			error = new DeviceAPIError();
			error.code = returnvalue["error"];
			error.message = returnvalue["errorMessage"];
			throw error;
		} else {
			error = new SecurityError();
			error.code = returnvalue["error"];
			error.message = returnvalue["errorMessage"];
			throw error;
		}
	} else {
		var result = new BondiFile();
		result.parent = this;
		result.readOnly = returnvalue["readonly"];
		result.name = returnvalue["name"];
		result.path = returnvalue["path"];
		result.absolutePath = returnvalue["absolutepath"];
		result.fileSize = returnvalue["filesize"];
		result.created = returnvalue["created"];
		result.modified = returnvalue["modified"];
		result.isFile = returnvalue["isfile"];
		result.isDirectory = returnvalue["isdirectory"];

		return result;
	}	

}

/**
 * Deletes this directory.
 * 
 * @param in
 *            boolean recursive
 * @return boolean
 * @throws (SecurityError,
 *             DeviceAPIError)
 */
BondiFile.prototype.deleteDirectorySynchron = function(recursive) {
	var myDoc = this;
	var ret = FileSystem.deleteDirectory(myDoc.absolutePath, recursive + '');
	if (ret == 'true' || ret == 'false')
		return ret;
	var returnvalue = eval("(" + ret + ")");
	var error = new DeviceAPIError(returnvalue["error"]);
	error.message = returnvalue["errorMessage"];
	throw error;

}
/**
 * Deletes this directory.
 * 
 * @param in
 *            boolean recursive
 * @return boolean
 * @throws (SecurityError,
 *             DeviceAPIError)
 */
BondiFile.prototype.deleteDirectory = function(successCallback, errorCallback, recursive) {
	var error;
	var myDoc = this;
	// check the parameter
	if (typeof successCallback != "function") {
		error = new DeviceAPIError();
		error.code = DeviceAPIError.INVALID_ARGUMENT_ERROR;
		error.message = "SuccessCallback has to be defined and a function";
		throw error;   
	}
	if (typeof errorCallback != "function") {
		error = new DeviceAPIError();
		error.code = DeviceAPIError.INVALID_ARGUMENT_ERROR;
		error.message = "ErrorCallback has to be defined and a function";
		throw error;
	}
	setTimeout(function() {
		try {
			var ret = myDoc.deleteDirectorySynchron(recursive);
			successCallback(ret);
		} catch (e)	{
			errorCallback(e);
		}
	}, 1);

	return new PendingOperation();
}


/**
 * Deletes this file.
 * 
 * @return boolean
 * @throws (SecurityError,
 *             DeviceAPIError)
 */
BondiFile.prototype.deleteFile= function() {
	var ret = FileSystem.deleteFile(this.absolutePath);
	if (ret == 'true' || ret == 'false')
		return ret;
	var returnvalue = eval("(" + ret + ")");

	var error = new DeviceAPIError(returnvalue["error"]);
	error.message = returnvalue["errorMessage"];
	throw error;
}

/**
 * FileStream.
 * Default Constructor.
 */
function FileStream(){
	// a unique identifier
	this.int_id = null;

	// end of file
	this.int_eof;

	// the current position
	this.int_position = 0;

}

FileStream.prototype.__defineGetter__("id", function() { 
	return this.int_id; 
});
FileStream.prototype.__defineSetter__("id", function(x) {
	if (this.int_id == null)
		this.int_id = x;
});

FileStream.prototype.__defineGetter__("eof", function() { 
	return this.int_eof; 
});

FileStream.prototype.__defineSetter__("eof", function(x) {

});

FileStream.prototype.__defineGetter__("position", function() { 
	return this.int_position; 
});

FileStream.prototype.__defineSetter__("position", function(x) {
	var size = FileSystem.getSize(this.int_id);

	if (size < x)
		throw new DeviceAPIError(DeviceAPIError.IO_ERROR);
	this.int_position = x;
	this.int_eof = (this.int_position == size); 
});

FileStream.prototype.__defineGetter__("bytesAvailable", function() {
	if (this.int_eof)
		return -1;
	return (FileSystem.getSize(this.int_id) - this.int_position); 
});

FileStream.prototype.__defineSetter__("bytesAvailable", function(x) {

});


/**
 * close this fileStream
 */
FileStream.prototype.close = function(){
	FileSystem.close(this.int_id);
}
/**
 * Read characters from the FileStream.
 * 
 * @param in
 *            unsigned long charCount
 * @return a String
 * @throws DeviceAPIError
 */
FileStream.prototype.read = function(charCount) {
	var ret =  FileSystem.read(this.int_id, this.int_position, charCount);
	var returnvalue = eval('(' + ret + ')');
	if (returnvalue["error"] != null){
		var error = new DeviceAPIError();
		error.code = returnvalue["error"];
		error.message = returnvalue["errorMessage"];
		throw error;
	}
	this.position = returnvalue["new_pos"];
	return returnvalue["data"];
}


/**
 * Read bytes from the FileStream.
 * 
 * @param in
 *            unsigned long byteCount
 * @return an array of bytes
 * @throws DeviceAPIError
 */
FileStream.prototype.readBytes = function(byteCount){
	var ret =  FileSystem.readBytes(this.int_id, this.int_position, byteCount);
	var returnvalue = eval('(' + ret + ')');
	if (returnvalue["error"] != null){
		var error = new DeviceAPIError(returnvalue["error"]);
		error.message = returnvalue["errorMessage"];
		throw error;
	}
	this.position = returnvalue["new_pos"];
	var bytes = returnvalue["data"];
	var bytearray = [];
	for (var i = 0; i < bytes.length; i++)
		bytearray[i] = bytes.charAt(i);
	return bytearray;
}
/**
 * Reads bytes and returns them as a Base64 encoded String.
 * 
 * 
 * @param byteCount
 *            the number of bytes to read
 * @return the Base64 String
 * @throws DeviceAPIError
 */
FileStream.prototype.readBase64 = function(byteCount) {
	var ret =  FileSystem.read64(this.int_id, this.int_position, byteCount);
	var returnvalue = eval('(' + ret + ')');
	if (returnvalue["error"] != null){
		var error = new DeviceAPIError(returnvalue["error"]);
		error.message = returnvalue["errorMessage"];
		throw error;
	}
	this.position = returnvalue["new_pos"];
	return returnvalue["data"];	
}

/**
 * Write a String to the fileStream, using the specified encoding on opening the
 * stream.
 * 
 * @param stringData
 *            to be written
 * @return void
 * @throws DeviceAPIError
 */
FileStream.prototype.write = function(stringData) {
	var ret = FileSystem.write(this.int_id, this.int_position, stringData);
	var returnvalue = eval('(' + ret + ')');
	if (returnvalue["error"] != null){
		var error = new DeviceAPIError(returnvalue["error"]);
		error.message = returnvalue["errorMessage"];
		throw error;
	}
	this.position = returnvalue["new_pos"];	
}

/**
 * Write byte data to the fileStream.
 * 
 * @param byteData
 *            to be written
 * @return void
 * @throws DeviceAPIError
 */
FileStream.prototype.writeBytes = function(byteData){
	var t = "";
	for (var i = 0; i < byteData.length; i++) {
		t += byteData[i];
	}
	var ret = FileSystem.writeBytes(this.int_id, this.position, t);
	var returnvalue = eval('(' + ret + ')');
	if (returnvalue["error"] != null) {
		var error = new DeviceAPIError(returnvalue["error"]);
		error.message = returnvalue["errorMessage"];
		throw error;
	}
	this.position = returnvalue["new_pos"];
}
/**
 * Write byte data from a base 64 encoded String to the fileStream.
 * 
 * @param stringData
 *            the Base64 encoded byte data.
 * @return void
 * @throws DeviceAPIError
 */
FileStream.prototype.writeBase64 = function(stringData) {
	var ret = FileSystem.write64(this.int_id, this.int_position, stringData);
	var returnvalue = eval('(' + ret + ')');
	if (returnvalue["error"] != null){
		var error = new DeviceAPIError(returnvalue["error"]);
		error.message = returnvalue["errorMessage"];
		throw error;
	}
	this.position = returnvalue["new_pos"];	
}



/**
 * File system specific success callBack.
 */
function FileSystemSuccessCallback(){
}

/**
 * Method invoked when the asynchronous call completes successfully .
 * 
 * @param in
 *            File file
 */
FileSystemSuccessCallback.prototype.onSuccess = function(file) {
	alert('FileSystemSuccessCallback onSuccess file=' + file);
}


//endsWith
//@param suffix
//@return string ends with suffix
String.prototype.endsWith = function(str)
{return (this.match(str+"$")==str)}


/*
 * Messaging section
 */

//define interface messagingError
function MessagingError() {
}
//There is no coverage
MessagingError.OUT_OF_COVERAGE_ERROR = 1;
MessagingError.prototype.OUT_OF_COVERAGE_ERROR = MessagingError.OUT_OF_COVERAGE_ERROR;

//Media addition is not possible, since the slide already includes a media file
//that cannot coexist with the others.
MessagingError.MMS_VIDEO_SLIDE_ERROR = 2;
MessagingError.prototype.MMS_VIDEO_SLIDE_ERROR = MessagingError.MMS_VIDEO_SLIDE_ERROR;

//Message size would be exceeded by the given operation.
MessagingError.MMS_MESSAGE_SIZE_EXCEEDED_ERROR = 3;
MessagingError.prototype.MMS_MESSAGE_SIZE_EXCEEDED_ERROR = MessagingError.MMS_MESSAGE_SIZE_EXCEEDED_ERROR;

function cancel(){
	// alert("We're sorry, but this feature is not supported");
	return false;
}

function MessagingManager() {
	this.counter = 0;
}

MessagingManager.prototype.INBOX_FOLDER = 0;
MessagingManager.prototype.SENT_FOLDER =1;
MessagingManager.prototype.OUTBOX_FOLDER = 2;
MessagingManager.prototype.DRAFTS_FOLDER = 3;

//array for callBack data to allow reports of success or failure
MessagingManager.prototype.callBacks = [];
//array for smsReceivers
MessagingManager.prototype.smsReceivers = [];
//array stores the ids of smsReceivers that are exclusive listeners
MessagingManager.prototype.smsExclusives = [];

/**
 * Creates an SMS out of the given smsParams
 * @param smsParams the SMS parameter
 * Supported fields are:
 * 	smsParams.body 	the actual message
 * 	smsParams.store	true or false <- should this message be stored?
 * 	smsParams.to	list of recipients for this message, separated by ";"
 * @throws DeviceAPIError
 */
MessagingManager.prototype.createSMS = function(smsParams) {

	var newsms = new SMS();
	var error;

	if (typeof smsParams == "object"){
		if (typeof smsParams.body != "undefined"){
			newsms.setProperty("body", smsParams.body);
		}
		if (typeof smsParams.store != "undefined"){
			newsms.setProperty("store", smsParams.store);
		}
		if (typeof smsParams.to != "undefined"){
			if (smsParams.to.length >= 1){
				for (var i = 0; i < smsParams.to.length; i++){
					newsms.appendRecipient(smsParams.to[i]);
				}
			} else {
				error = new DeviceAPIError();
				error.code = error.INVALID_ARGUMENT_ERROR;
				error.message = "there must be at least one recipient for this sms";
				throw error;
			}
		}

		if (smsParams.store == true){
			mMessageHandler.storeSMS(newsms.datetime, newsms.to, newsms.body, this.DRAFTS_FOLDER);
		}
	} else {
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "smsParams must be a map";
		throw error;
	}
	return newsms;
}


/**
 * Sends a given SMS that was created by the createSMS method and sends it to its recipients.
 * In Case of Success or Failure of this operation the callBacks will be used to commit a result
 * of this operation.
 * 
 * committed success's will be strings
 * 
 * committed errors have the fields:
 * 	error.code
 * 	error.message
 * 
 * @param successCallback the successCallback
 * @param errorCallback the errorCallvack
 * @param sms the SMS
 * @param store store the sms
 * @throws SecurityError, DeviceAPIError, MessagingError
 */
MessagingManager.prototype.sendSMS = function(successCallback, errorCallback, sms, store){
	var error;
	// check the parameter
	if (typeof errorCallback != "function"){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "errorCallback has to be defined and a function";
		throw error;
	} else if (typeof successCallback != "function"){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "successCallback has to be defined and a function";
		errorCallback(error);
		return;
	} else if (typeof sms != "object" || sms == null){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "sms has to be defined";
		errorCallback(error);
		return;
	}
	if (store == true || store == false){
		sms.store = store;
	} else {
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "store has to be boolean";
		errorCallback(error);
		return;
	}

	var callbackData = {};
	callbackData.success = successCallback;
	callbackData.failure = errorCallback;
	callbackData.sms = sms;

	var key = this.callBacks.push(callbackData) -1;

	var message = validateSMS(sms);
	if (message != ""){
		error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "Error during validation of sms: " + message;
		errorCallback(error);
		return;
	}

	for (var i = 0; i < sms.to.length; i++){
		mMessageHandler.sendSMS(sms.to[i], sms.body, sms.id, sms.store, key, sms.datetime);
	}

	sms.folder = this.SENT_FOLDER;

	var newPendingOperation = new PendingOperation();
	newPendingOperation.cancel = cancel;

	return newPendingOperation;
}


/**
 * manages the successCallbacks for committing positive results while 
 * sending or delivering a SMS message
 * 
 * @param key the key
 * @param result the result
 */
MessagingManager.prototype.smsSuccess = function(key, result){
	var callbackData = this.callBacks[key];
	callbackData.success(result);
}

/**
 * manages the failures that might happen during sending or delivery
 * of a SMS
 * 
 * @param key the key
 * @param result the result
 */
MessagingManager.prototype.smsFailure = function(key, result){
	var callbackData = this.callBacks[key];

	var error = {};
	error.code = result;
	error.message = "failure sending sms, with body reading " + this.body;

	callbackData.failure(error);
}

/**
 * Manage the reception of SMS messages
 * All messages received will be stored in the inbox Folder
 * @param key the key
 * @param messagebody the SMS message body
 * @param from the from entry
 */
MessagingManager.prototype.smsReceived = function(key, messagebody, from){
	var sms = new SMS();
	sms.setProperty("body", messagebody);
	sms.setProperty("store", true);
	sms.folder = this.INBOX_FOLDER;
	var subData = this.smsReceivers[key].listener(sms);
}

/**
 * creates and registers a listener that will be listening for incoming SMS
 * @param listener 	a callBackfunction where received SMS should be transfered to
 * @param filter	might have the fields
 * 			filter.port	all messages have to come through this special port. Will be ignored if null
 * 			filter.sender	all messages have to come from this sender or will be ignored. If null
 * 							this filter-condition will be ignored
 * @param exclusive	if true no other listener will be allowed to listen with the same filter conditions
 * 	Caution: using exclusive condition might throw an error if someone is already listening with the same
 * 	filtering conditions
 * 
 * @return key	unique identifier for subscribed listener. Can be used for unsubScription of the same listener
 * @throws SecurityError, DeviceAPIError
 */
MessagingManager.prototype.subscribeToSMSSynchron = function(listener, filter, exclusive) {

	var subscriptionData = {};
	subscriptionData.port = null;
	subscriptionData.sender = null;
	if (typeof filter != "undefined" && filter != null){
		if (typeof filter.port != "undefined"){
			subscriptionData.port = filter.port;
		}
		if (typeof filter.sender != "undefined"){
			subscriptionData.sender = filter.sender;
		}
	}
	if (exclusive == true || exclusive == false){
		subscriptionData.exclusive = exclusive;

		if (exclusive == false){
			/*
			 *  new Listener isn't exclusive so only registered exclusive listeners
			 *  have to be checked for collisions
			 */
			for (var i = 0; i < this.smsExclusives.length; i++){
				var subData;
				if (smsExclusives[i] != -1){
					subData = this.smsReceivers[smsExclusives[i]];
				} else {
					continue;
				}
				var portFound = false;
				var senderFound = false;

				if (subData != null){
					if (subscriptionData.port != null){
						if (subData.port == subscriptionData.port){
							portFound = true;
						}
					}
					if (subscriptionData.sender != null){
						if (subData.sender == subscriptionData.sender){
							senderFound = true;
						}
					}

					if (portFound && senderFound){
						var error = new DeviceAPIError();
						error.code = error.INVALID_ARGUMENT_ERROR;
						error.message = "subscription can't be registered because exclusive subscription is already listening with same options";
						throw error;
					}
				}
			}
		} else {
			// new Listener is exclusive, so every registered listener have to be checked
			for (var i = 0; i < this.smsReceivers.length; i++){
				var subData = this.smsReceivers[i];
				var portFound = false;
				var senderFound = false;

				if (subData != null){
					if (subscriptionData.port != null){
						if (subData.port == subscriptionData.port){
							portFound = true;
						}
					}
					if (subscriptionData.sender != null){
						if (subData.sender == subscriptionData.sender){
							senderFound = true;
						}
					}

					if (portFound && senderFound){
						var error = new DeviceAPIError();
						error.code = error.INVALID_ARGUMENT_ERROR;
						error.message = "subscription can't be registered because another exclusive subscription is already listening with same options";
						throw error;
					}
				}
			}
		}

	} else {
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "exclusive parameter has to be false or true";
		throw error;
	}

	if (typeof listener == "undefined" || listener == null){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "listener must be defined and != null";
		throw error;
	} else {
		subscriptionData.listener = listener;
	}

	// All Parameters have been validated, so let's do the "actual work"
	var key = this.smsReceivers.push(subscriptionData) -1;

	if(exclusive){
		this.smsExclusives.push(key);
	}

	mMessageHandler.subscribeToSMS(key, subscriptionData.port, subscriptionData.sender);
	return key;
}

/**
 * creates and registers a listener that will be listening for incoming SMS
 * @param listener 	a callBackfunction where received SMS should be transfered to
 * @param filter	might have the fields
 * 			filter.port	all messages have to come through this special port. Will be ignored if null
 * 			filter.sender	all messages have to come from this sender or will be ignored. If null
 * 							this filter-condition will be ignored
 * @param exclusive	if true no other listener will be allowed to listen with the same filter conditions
 * 	Caution: using exclusive condition might throw an error if someone is already listening with the same
 * 	filtering conditions
 * 
 * @return key	unique identifier for subscribed listener. Can be used for unsubScription of the same listener
 * @throws SecurityError, DeviceAPIError
 */
MessagingManager.prototype.subscribeToSMS = function(successCallback, errorCallback, listener, filter, exclusive) {
	if (typeof errorCallback != "function"){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "errorCallback has to be defined and a function";
		throw error;
	} else if (typeof successCallback != "function"){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "successCallback has to be defined and a function";
		errorCallback(error);
		return;
	} else if (typeof listener != "function"){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "listener has to be defined and a function";
		errorCallback(error);
		return;
	} else if (typeof filter != "object"){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "filter must be an object";
		errorCallback(error);
		return;
	} else if (exclusive != true && exclusive != false){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "exclusive must be a boolean";
		errorCallback(error);
		return;
	}

	setTimeout(function() {
		try {
			var ret = bondi.messaging.subscribeToSMSSynchron(listener, filter, exclusive);
			successCallback(ret);
		} catch (e)	{
			errorCallback(e);
		}
	}, 1);

	return new PendingOperation();
}
/**
 * unsubscribe a listener and stops it from listening for SMS messages
 * @param subscribeHandler unique identifier for the listener. Must be same id 
 * that was returned using subscribeToSMS
 * @throws SecurityError, DeviceAPIError
 */
MessagingManager.prototype.unsubscribeFromSMS = function(subscribeHandler) {

	if (typeof subscribeHandler == "undefined" || subscribeHandler == null){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "parameter has to be defined and must not be null";
		throw error;
	}
	if (subscribeHandler >= this.smsReceivers.length || subscribeHandler < 0){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "parameter is no valid subscriptionID";
		throw error;
	} else if (this.smsReceivers[subscribeHandler] == null){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "subscription was allready unregistered";
		throw error;
	}

	mMessageHandler.unsubscribeFromSMS(subscribeHandler);

	if (this.smsReceivers[subscribeHandler].exclusive == true){
		for (var i = 0; this.smsExclusives.length; i++){
			if (this.smsExclusives[i] == subscribeHandler){
				// As we can't really delete elements from this array, let's just mark it as obsolete
				this.smsExclusives[i] = -1;
				return;
			}
		}
	}
	return;
}


MessagingManager.prototype.unsubscribeFromAllSMS = function(){

	mMessageHandler.unsubscribeFromAllSMS();
	this.smsReceivers = [];
	this.smsExclusives = [];
	return;
}

/**
 * Validates a SMS
 * @param sms the SMS to be validated
 * @return valid will be empty if the SMS is valid, else it will contain a detailed error message;
 */
function validateSMS(sms){
	var valid = "";
	if (typeof sms.datetime == "undefined" || sms.datetime == null){
		valid = valid + "datetime has to be defined and must not be null \n";
	}

	if (typeof sms.id == "undefined" || sms.id == null){
		valid = valid + "id has to be defined and must not be null \n";
	}

	if (typeof sms.body == "undefined" || sms.body == null || sms.body == ""){
		valid = valid + "messagebody has to be defined and must not be null or empty \n";
	}

	if ((typeof sms.store == "undefined" || sms.store == null) || (typeof sms.read == "undefined" || sms.read == null)){
		valid = valid + "store / read has to be defined and must not be null, but true or false \n";
	} else if ((sms.store != true && sms.store != false) || (sms.read != true && sms.read != false)){
		valid = valid + "store / read has to be defined and must not be null, but true or false \n";
	}

	if (typeof sms.folder != "undefined"){
		if (
				sms.folder == bondi.messaging.DRAFTS_FOLDER ||
				sms.folder == bondi.messaging.INBOX_FOLDER ||
				sms.folder == bondi.messaging.OUTBOX_FOLDER ||
				sms.folder == bondi.messaging.SENT_FOLDER){

		} else {
			valid = valid + "folder must be one of INBOX_FOLDER, OUTBOX_FOLDER, SENT_FOLDER, DRAFTS_FOLDER defined in bondi.messaging \n";
		}
	} else {
		valid = valid + "folder has to be defined and must not be null \n";
	}

	if (sms.to.length < 1){
		valid = valid + " sms has no phoneNumber to send to \n";
	}

	for (var i = 0; i < sms.to.length; i++){
		if (!mMessageHandler.isPhoneNumber(sms.to[i])){
			valid = valid + sms.to[i] + "is not a valid phonenumber \n";
		}

		if (sms.to[i] == "" || sms.to[i].length == 0 || sms.to[i] == null){
			valid = valid + "all phone numbers must not be empty or null";
		}
	}
	return valid;
}


/**
 * The SMS dataType in accordance to the BONDI-specification.
 * constructor.
 * @param id the id
 * @param datetime the date
 * @param body the SMS body
 * @param store store the SMS
 * @param folder the folder ID
 * @param read SMS read
 */
function SMS(id, datetime, body, store, folder, read)
{	
	if (typeof datetime == "undefined" || datetime == null){
		this.datetime = new Date();
	} else {
		this.datetime=datetime;
	}

	if (typeof id == "undefined" || id == null){
		this.id = bondi.messaging.counter++ + "-" + this.datetime.getTime(); // unique id
	} else {
		this.id=id;
	}

	if (typeof store == "undefined" || store == null){
		this.store = true; // should this message be stored in sent folder?
	} else {
		if (store == true || store == false){
			this.store=store;
		} else {
			var error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "store has to be true or false! If store is null or undefined store will be set to true";
			throw error;
		}
	}

	if (typeof body == "undefined" || body == null){
		this.body = ""; // actual text of message
	} else {
		this.body=body;
	}

	if (typeof folder == "undefined" || folder == null){
		this.folder = bondi.messaging.DRAFTS_FOLDER; // reference to folder in which message will be stored (if store == true)
		// folder must be one of INBOX_FOLDER, OUTBOX_FOLDER, SENT_FOLDER, DRAFTS_FOLDER defined in MessagingManager). 
	} else {

		if (
				folder == bondi.messaging.DRAFTS_FOLDER ||
				folder == bondi.messaging.INBOX_FOLDER ||
				folder == bondi.messaging.OUTBOX_FOLDER ||
				folder == bondi.messaging.SENT_FOLDER){
			this.folder=folder;
		} else {
			var error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "folder must be one of INBOX_FOLDER, OUTBOX_FOLDER, SENT_FOLDER, DRAFTS_FOLDER defined in bondi.messaging";
			throw error;
		}
	}

	if (typeof read == "undefined" || read == null){
		this.read = false; // if message was already read
	} else {
		if (read == true || read == false){
			this.read=read;
		} else {
			var error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "read has to be true or false! If read is null or undefined read will be set to false";
			throw error;
		}
	}

	this.to = [];	
}

/**
 * sets properties of this smsObject.
 * @param propertyName the property name
 * Allowed propertyNames are:
 * 	body 	the actual message
 * 	store	must be true or false <- Answer to "should this SMS be stored?"
 * No other propertyNames are allowed
 * @param propertyValue the property value
 * @throws DeviceAPIError
 */
SMS.prototype.setProperty = function(propertyName, propertyValue) {


	if (typeof propertyName == "undefined" || typeof propertyValue == "undefined" || propertyName == null){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "propertyName and propertyValue have to be defined and PropertyName must not be null";
		throw error;
	}

	if (propertyName == "body"){

		if (propertyValue == "" || propertyValue == null){
			var error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "messagebody must not be empty or null";
			throw error;
		} else {
			this.body = propertyValue;
		}
	} else if (propertyName = "store"){
		if (propertyValue == true || propertyValue == false){
			this.store = propertyValue;
		} else {
			var error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "propertyValue has to be true or false";
			throw error;
		}
	} else {
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "propertyName has to be body or store";
		throw error;
	}
	return; // void
}

/**
 * Returns the value of the given property
 * @param propertyName the property name
 * allowed propertyNames are:
 * 	body 	the actual message
 * 	to	returns a list of phoneNumbers to that this message shall be sent separated by ";"
 * 	id		the unique id of this message
 * 	read	true or false <- was this message already read?
 * 	store	true or false <- should this message be stored?
 * 	folder	an integer constant showing where this message is stored at the moment
 * 	dateTime	the time on that this SMS was created
 * no other propertyNames are allowed
 * @throws DeviceAPIError
 */
SMS.prototype.getProperty = function(propertyName) {

	if (propertyName == "body"){
		return this.body;
	} else if (propertyName == "to"){

		var reciList = "";
		for (var i = 0; i < this.to.length; i++){
			reciList = to[i] + ";";
		}
		return reciList;

	} else if (propertyName == "id"){
		return this.id;
	} else if (propertyName == "read"){
		return this.read;
	} else if (propertyName == "store"){
		return this.store;
	} else if (propertyName == "folder"){
		return this.folder;
	} else if (propertyName == "dateTime"){
		return this.datetime;
	} else {
		var error = new DeviceAPIError();
		error.code = DeviceAPIError.INVALID_ARGUMENT_ERROR;
		error.message = "propertyName has to be one of these: body, to, id, read, store, folder, dateTime";
		throw error;

		return null;
	}
}

/**
 * Getter for recipients.
 * returns an array of all recipients this message will be sent to
 */
SMS.prototype.getRecipients = function() {
	return this.to;
}

/**
 * get a special recipient out of the list of recipients
 * @param index the index of the recipient.
 */
SMS.prototype.getRecipient = function(index) {
	if ((index >= this.to.length) || (index < 0)){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "index ( " + index + " ) is out of bounds. MaxIndex at the moment is: " + (this.to.length - 1);
		throw error;
	} else {
		return this.to[index];
	}
}

/**
 * Appends the list of recipients for this message by the given phoneNumber
 * DeviceAPIErrorphoneNumber
 * @param phoneNumber the phoneNumber of the added recipient
 * @throws DeviceAPIError 
 */
SMS.prototype.appendRecipient = function(phoneNumber) {

	if (phoneNumber == "" || phoneNumber.length == 0 || phoneNumber == null){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "phoneNumber must not be empty or null";
		throw error;
	}

	if (!mMessageHandler.isPhoneNumber(phoneNumber)){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "phoneNumber is no valid phonenumber or exceeds length conditions";
		throw error;
	}


	this.to.push(phoneNumber);
	return; // void
}

/**
 * Delete all recipients currently listed for this message.
 */
SMS.prototype.clearRecipients = function() {
	to = [];
	return; // void
}
///////////

PhoneGap.addConstructor(function() {
	if (typeof bondi.messaging == "undefined") bondi.messaging = new MessagingManager();
	if (typeof bondi.messagingManager == "undefined") bondi.messagingManager = bondi.messaging;
});

//PhoneGap.addConstructor(function() {
//if (typeof bondi.messagingmanager == "undefined") bondi.messagingmanager = new MessagingManager();
//});

/**
 * cuts a list that uses ";" as separator and returns an array with the snippets
 * @param 	a string of recipients separated by ";"
 * @returns an array of recipients 
 */
function snippTheRecipients(sms, to){
	var from = 0;
	var toPos = -1;

	while (to.length > 0){
		toPos = to.indexOf(";");
		if (toPos == -1){
			sms.appendRecipient(to);
			to = "";
		} else {
			var newRecepient = to.substring(from, toPos);
			sms.appendRecipient(newRecipient);
			to = to.substring(toPos + 1, to.length);
		}
	}	
}

function Bondi(){

}

/**
 * returns an array of the IRIs of all supported features
 * @return stringarray with IRIs of all supported features
 */
Bondi.prototype.getFeatures = function() {
	var features = [];
	features.push("http://bondi.omtp.org/api/1.1/messaging");
	features.push("http://bondi.omtp.org/api/1.1/messaging.sms.send");
	features.push("http://bondi.omtp.org/api/1.1/messaging.sms.subscribe");
	features.push("http://bondi.omtp.org/api/1.1/devicestatus");
	features.push("http://bondi.omtp.org/api/1.1/geolocation.position");
	features.push("http://bondi.omtp.org/api/1.1/geolocation");
	features.push("http://bondi.omtp.org/api/1.1/camera");
	features.push("http://bondi.omtp.org/api/1.1/camera.access");
	features.push("http://bondi.omtp.org/api/1.1/camera.capture");
	features.push("http://bondi.omtp.org/api/1.1/filesystem");
	features.push("http://bondi.omtp.org/api/1.1/filesystem.read");
	features.push("http://bondi.omtp.org/api/1.1/filesystem.write");
	return features;
}

/**
 * Instantiates (and returns references to) implementation objects from the bondi specification
 */
Bondi.prototype.requestFeature = function (successCallback, errorCallback, name){

	var po = new PendingOperation();

	if (typeof errorCallback != 'function'){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "ErrorCallback has to be defined and a function.";
		throw error;
		return po;
	} else if (typeof successCallback != 'function'){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "SuccessCallback has to be defined and a function.";
		errorCallback(error);
		return po;
	} 

	// Including Messaging API
	if ((name == "http://bondi.omtp.org/api/1.1/messaging.sms.send") ||
			(name == "http://bondi.omtp.org/api/1.1/messaging.sms.subscribe") ||
			(name == "http://bondi.omtp.org/api/1.1/messaging")){
		if (typeof bondi.messaging == "undefined") bondi.messaging = new MessagingManager();
		if (typeof bondi.messagingManager == "undefined") bondi.messagingManager = bondi.messaging;
		successCallback(bondi.messaging);
		return po;
	} 

	// Including DeviceStatus API

	if ( name == "http://bondi.omtp.org/api/1.1/devicestatus" ){
		if (typeof bondi.devicestatus == "undefined") bondi.devicestatus = new DeviceStatusManager();
		if (typeof bondi.deviceStatusManager == "undefined") bondi.deviceStatusManager = bondi.devicestatus;
		successCallback(bondi.devicestatus);
		return po;
	}

	// Including GeoLocation API
	if (( name == "http://bondi.omtp.org/api/1.1/geolocation.position") ||
			(name == "http://bondi.omtp.org/api/1.1/geolocation")){
		if (typeof bondi.geolocation == "undefined") bondi.geolocation = new BondiGeolocation();
		successCallback(bondi.geolocation);
		return po;
	}

	// Including CameraManager API
	if ( name == "http://bondi.omtp.org/api/1.1/camera.access" ||
			name == "http://bondi.omtp.org/api/1.1/camera.capture" ||
			name == "http://bondi.omtp.org/api/1.1/camera"){
		if (typeof bondi.camera == "undefined") bondi.camera = new BondiCamera();
		if (typeof bondi.cameraManager == "undefined") bondi.cameraManager = bondi.camera;

		successCallback(bondi.camera);
		return po;
	}

	// Including FileIO API
	if ( name == "http://bondi.omtp.org/api/1.1/filesystem.read" ||
			name == "http://bondi.omtp.org/api/1.1/filesystem.write" ||
			name == "http://bondi.omtp.org/api/1.1/filesystem"){
		if (typeof bondi.filesystem == "undefined") bondi.filesystem = new FileSystemManager();
		if (typeof bondi.fileSystemManager  == "undefined") bondi.fileSystemManager = bondi.filesystem;

		successCallback(bondi.filesystem);
		return po;
	}

	// Feature not found -> error
	var error = new DeviceAPIError();
	error.code = error.NOT_FOUND_ERROR;
	error.message = "feature was not found and is probably not supported";
	errorCallback(error);
	return po;
}

/**
 * BinaryMessage.
 * Default constructor.
 */
function BinaryMessage(){
	this.payload = [];
	this.port = 0;
	this.to = [];
}

/**
 * sets properties of this smsObject.
 * @param propertyName the property name
 * Allowed propertyNames are:
 * 	port 	the port to send this message to
 * 	payLoad	ByteArray that contains the data to send with this message
 * No other propertyNames are allowed
 * @param propertyValue the property value
 * @throws DeviceAPIError
 */
BinaryMessage.prototype.setProperty = function(propertyName, propertyValue) {


	if (typeof propertyName == "undefined" || typeof propertyValue == "undefined" || propertyName == null){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "propertyName and propertyValue have to be defined and PropertyName must not be null";
		throw error;
	}

	if (propertyName == "port"){
		this.port = propertyValue;
	} else if (propertyName = "payload"){
		this.payload = propertyValue;
	} else {
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "propertyName has to be port or payload";
		throw error;
	}
	return; // void
}

/**
 * Returns the value of the given property
 * @param propertyName the property name
 * allowed propertyNames are:
 * 	payLoad: ByteArray. This represents the payLoad of the binary message
 * 	recipients: String. Semicolon(;) separated string containing the recipients list
 * 	port: integer. Port to which the binary message is to be addressed.
 * no other propertyNames are allowed
 * @throws DeviceAPIError
 */
BinaryMessage.prototype.getProperty = function(propertyName) {

	if (propertyName == "port"){
		return this.port;
	} else if (propertyName == "to"){

		var reciList = "";
		for (var i = 0; i < this.to.length; i++){
			reciList = to[i] + ";";
		}
		return reciList;

	} else if (propertyName == "payload"){
		return this.payload;
	} else {
		var error = new DeviceAPIError();
		error.code = DeviceAPIError.INVALID_ARGUMENT_ERROR;
		error.message = "propertyName has to be one of these: port, to, payload";
		throw error;

		return null;
	}
}

/**
 * Getter for recipients.
 * returns an array of all recipients this message will be sent to
 */
BinaryMessage.prototype.getRecipients = function() {
	return this.to;
}

/**
 * get a special recipient out of the list of recipients
 * @param index the index of the recipient.
 */
BinaryMessage.prototype.getRecipient = function(index) {
	if ((index >= this.to.length) || (index < 0)){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "index ( " + index + " ) is out of bounds. MaxIndex at the moment is: " + (this.to.length - 1);
		throw error;
	} else {
		return this.to[index];
	}
}

/**
 * Appends the list of recipients for this message by the given phoneNumber
 * DeviceAPIErrorphoneNumber
 * @param phoneNumber the phoneNumber of the added recipient
 * @throws DeviceAPIError 
 */
BinaryMessage.prototype.appendRecipient = function(phoneNumber) {

	if (phoneNumber == "" || phoneNumber.length == 0 || phoneNumber == null){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "phoneNumber must not be empty or null";
		throw error;
	}

	if (!mMessageHandler.isPhoneNumber(phoneNumber) || phoneNumber.length > 15){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "phoneNumber is no valid phonenumber or exceeds length conditions";
		throw error;
	}


	this.to.push(phoneNumber);
	return; // void
}

/**
 * Delete all recipients currently listed for this message.
 */
BinaryMessage.prototype.clearRecipients = function() {
	this.to = [];
	return; // void
}


/* it turned out this didn't had to be implemented

MessagingManager.prototype.createMMS = function(mmsParams) {
// raises(DeviceAPIError);

	var mms = new MMS();

	if (typeof mmsParams == "object" && mmsParams != null){

		if (typeof mmsParams.body != "undefined"){
			mms.body = body;
		}
		if (typeof mmsParams.to != "undefined"){
			mms.to = snippTheRecipients(mmsParams.to);
		}
		if (typeof mmsParams.attachments != "undefined"){
			mms.attachments = snippTheRecipients(mmsParams.attachments);
			//mms.attachments = mmsParams.attachments;
		}
		if (typeof mmsParams.store != "undefined"){
			if (mmsParams.store == true || mmsParams.store == false){
				mms.store = mmsParams.store;
			} else {
				var error = new DeviceAPIError();
				error.code = error.INVALID_ARGUMENT_ERROR;
				error.message = "store has to be true or false";
				throw error;
			}
		}
	} else if (typeof mmsParams == "undefined"){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "mmsParams must be defined but may be null";
		throw error;
	}

	return mms;
}

MessagingManager.prototype.createEmail = function(emailParams) {
// raises(DeviceAPIError);
	return new EMail();
} 

MessagingManager.prototype.sendEmail = function(successCallback, errorCallback, email) {
// raises(SecurityError, DeviceAPIError, MessagingError);
	return new PendingOperation();
}

MessagingManager.prototype.createBinaryMessage = function(binaryParams) {
// raises(DeviceAPIError);
	 return new BinaryMessage();
}
MessagingManager.prototype.sendBinaryMessage = function(successCallback,errorCallback, binary) {
// raises(SecurityError, DeviceAPIError, MessagingError);
		return new PendingOperation();
}
MessagingManager.prototype.getAvailableEmailAccounts = function(successCallback,errorCallback) {
	// raises(SecurityError, DeviceAPIError);
	return new PendingOperation();
}  

MessagingManager.prototype.sendMMS = function(successCallback, errorCallback, mms){
	var callbackData = {};
	callbackData.success = successCallback;
	callbackData.failure = errorCallback;
	callbackData.mms = mms;

	var key = this.callBacks.push(callbackData) -1;
	//TODO check if mms is actual mms...
	for (var i = 0; i < mms.to.length; i++){
		(String phoneNo, String subject, String message, String attachment, String messageID){
		mMessageHandler.sendMMS(mms.to[i], mms.subject, mms.body, key);
	}
	return new PendingOperation();
}

MessagingManager.prototype.subscribeToMMS = function(listener, filter, exclusive) {
// raises(SecurityError, DeviceAPIError);
	return 0;
}
MessagingManager.prototype.unsubscribeFromMMS = function(subscribeHandler) {
// raises(SecurityError, DeviceAPIError);
}
MessagingManager.prototype.subscribeToEmail = function(listener,filter,exclusive) {
// raises(SecurityError, DeviceAPIError);
	return 0;
}
MessagingManager.prototype.unsubscribeFromEmail = function(subscribeHandler) {
// raises(SecurityError, DeviceAPIError);
};


//////////////////////////////////
function MMSSlide(){
	this.duration=0; // unsigned long 
	this.image="DOMString"; //DOMString
	this.imageBegin=0; // unsigned long 
	this.imageEnd=1; // unsigned long 
	this.audio="DOMString"; // DOMString

	this.audioBegin = 0; // unsigned long 
	this.audioEnd = 0; //unsigned long 
	this.text = "DOMString"; // DOMString

	this.textBegin = 0; // unsigned long 
	this.textEnd = 0; // unsigned long 
	this.video = "DOMString";  //DOMString
	this.videoBegin = 0; // unsigned long 
	this.videoEnd=1; // unsigned long
}

MMSSlide.prototype.setImage= function(image){
 	//raises(MessagingError)
	this.image = image;
	return; // void
}
MMSSlide.prototype.setAudio= function(audio){// raises(MessagingError)
	this.audio = audio;
	return; // void
}
MMSSlide.prototype.setText= function(text){ //	raises(MessagingError)
	this.text = text;
	return; // void
}
MMSSlide.prototype.setVideo= function(text){ //	raises(MessagingError)
	this.video = video;
	return; // void
}

function MMS() {
	this.datetime = new Date();
	this.id = bondi.messaging.counter++ + "-" + this.datetime.getTime(); // unique id
	this.store = true; // should this message be stored in sent folder?
	this.read = false; // if message was already read
	this.folder = bondi.messaging.DRAFTS_FOLDER; // reference to folder in which message will be stored (if store == true)
	// folder must be one of INBOX_FOLDER, OUTBOX_FOLDER, SENT_FOLDER, DRAFTS_FOLDER defined in MessagingManager). 

	this.subject = "newSubject";
	this.body = "body"; // actual text of message
	this.to = [];
	this.slides = []; // MMSSlideArray
	this.attachments = [];

	// this.multipartMixedBody = ???
	// this.messageType = ???

}

MMS.prototype.MULTIPART_MIXED = 0;

MMS.prototype.MULTIPART_RELATED = 1;

MMS.prototype.setProperty = function(propertyName, propertyValue){
	//raises(DeviceAPIError);


	if (typeof propertyName == "undefined" || typeof propertyValue == "undefined" || propertyName == null){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "propertyName and propertyValue have to be defined and PropertyName must not be null";
		throw error;
	}


	if (propertyName == "body"){
		this.body = propertyValue;
	} else if (propertyName = "store"){
		if (propertyValue == true || propertyValue == false){
			this.store = propertyValue;
		} else if (propertyName == "subject"){
			this.subject = propertyValue;
		} else if (propertyName == "to"){
			this.to = snippTheRecipients(propertyValue);
		} else if (propertyName == "attachment"){
			// TODO handle attachment



		} else {
			var error = new DeviceAPIError();
			error.code = error.INVALID_ARGUMENT_ERROR;
			error.message = "propertyValue has to be true or false";
			throw error;
		}
	} else {
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "propertyName has to be body, subject, to, attachment or store";
		throw error;
	}
	return; // void
}

MMS.prototype.getProperty = function(){
	// raises(DeviceAPIError);

	// TODO attachment: DOMString. File with info about the mms attachment. 

	if (propertyName == "body"){
		return this.body;
	} else if (propertyName == "subject"){
		return this.subject;
	} else if (propertyName == "to"){

		var reciList = "";
		for (var i = 0; i < this.to.length; i++){
			reciList = to[i] + ";";
		}
		return reciList;

	} else if (propertyName == "id"){
		return this.id;
	} else if (propertyName == "read"){
		return this.read;
	} else if (propertyName == "store"){
		return this.store;
	} else if (propertyName == "folder"){
		return this.folder;
	} else if (propertyName == "dateTime"){
		return this.datetime;
	} else if (propertyName == "attachment"){
		return; // <--- TODO Insert Code here
	} else {
		var error = new DeviceAPIError();
		error.code = DeviceAPIError.INVALID_ARGUMENT_ERROR;
		error.message = "propertyName has to be one of these: body, to, id, read, store, folder, dateTime";
		throw error;

		return null;
	}
}

MMS.prototype.getRecipients = function() {
	return this.to;
}
MMS.prototype.getRecipient = function(index) {
	if ((index >= this.to.length) || (index < 0)){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "index ( " + index + " ) is out of bounds. MaxIndex at the moment is: " + (this.to.length - 1);
		throw error;
	} else {
		return this.to[index];
	}
}

MMS.prototype.appendRecipient = function(phoneNumber) {
	// raises(DeviceAPIError);
	// TODO check if phoneNumber is "phoneNumber format" and smaller than maxAvaiableSize for that format

	this.to.push(phoneNumber);
	return; // void
}

MMS.prototype.clearRecipients = function() {
	to = [];
	return; // void
}

MMS.prototype.getAttachments = function(){
	// returns StringArray
	var attachs = "";
	for (var i = 0; i < this.attachments.length; i++){
		attachs = attachs + mMessageHandler.getMimegetMimeType(this.attachments[i]) + " " + this.attachments[i]; + ";";
	}
	return attachs;
}


MMS.prototype.getAttachment = function(index){
        // raises(DeviceAPIError);
		//returns DOMString

	if ((index >= this.attachments.length) || (index < 0)){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "index ( " + index + " ) is out of bounds. MaxIndex at the moment is: " + (this.attachments.length - 1);
		throw error;
	} else {
		return mMessageHandler.getMimegetMimeType(this.attachments[index]) + " " + this.attachments[index];
	}

}

MMS.prototype.appendAttachment = function(myAttachment){
        //raises(SecurityError, DeviceAPIError);

	if (typeof myAttachment == "undefined" || myAttachment == null){
		var error = new DeviceAPIError();
		error.code = error.INVALID_ARGUMENT_ERROR;
		error.message = "myAttachment has to be defined and must not be null";
		throw error;
	}

	this.attachments.push(myAttachment);

}


MMS.prototype.clearAttachments = function(){
        //raises(DeviceAPIError);
	this.attachments = [];
		return; //void
}



function Email() {
}

function Object(){
}
function BinaryMessage() {
}

 */




/**
 * This class provides access to the device camera.
 * @constructor
 */
function Camera() {

}

/**
 * 
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @param {Object} options
 */
Camera.prototype.getPicture = function(successCallback, errorCallback, options) {

	this.winCallback = successCallback;
	this.failCallback = errorCallback;
	if (options.quality)
	{
		GapCam.takePicture(options.quality);
	}
	else 
	{
		GapCam.takePicture(80);
	}
}

Camera.prototype.win = function(picture)
{
	this.winCallback(picture);
}

Camera.prototype.fail = function(err)
{
	this.failCallback(err);
}

PhoneGap.addConstructor(function() {
	if (typeof navigator.camera == "undefined") navigator.camera = new Camera();
});


/**
 * This class provides access to device Compass data.
 * @constructor
 */
function Compass() {
	/**
	 * The last known Compass position.
	 */
	this.lastHeading = null;
	this.lastError = null;
	this.callbacks = {
			onHeadingChanged: [],
			onError:           []
	};
};

/**
 * Asynchronously aquires the current heading.
 * @param {Function} successCallback The function to call when the heading
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the heading data.
 * @param {PositionOptions} options The options for getting the heading data
 * such as timeout.
 */
Compass.prototype.getCurrentHeading = function(successCallback, errorCallback, options) {
	if (this.lastHeading == null) {
		this.start(options);
	}
	else 
		if (typeof successCallback == "function") {
			successCallback(this.lastHeading);
		}
};

/**
 * Asynchronously aquires the heading repeatedly at a given interval.
 * @param {Function} successCallback The function to call each time the heading
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the heading data.
 * @param {HeadingOptions} options The options for getting the heading data
 * such as timeout and the frequency of the watch.
 */
Compass.prototype.watchHeading= function(successCallback, errorCallback, options) {
	// Invoke the appropriate callback with a new Position object every time the implementation 
	// determines that the position of the hosting device has changed. 

	this.getCurrentHeading(successCallback, errorCallback, options);
	var frequency = 100;
	if (typeof(options) == 'object' && options.frequency)
		frequency = options.frequency;

	var self = this;
	return setInterval(function() {
		self.getCurrentHeading(successCallback, errorCallback, options);
	}, frequency);
};


/**
 * Clears the specified heading watch.
 * @param {String} watchId The ID of the watch returned from #watchHeading.
 */
Compass.prototype.clearWatch = function(watchId) {
	clearInterval(watchId);
};


/**
 * Called by the geolocation framework when the current heading is found.
 * @param {HeadingOptions} position The current heading.
 */
Compass.prototype.setHeading = function(heading) {
	this.lastHeading = heading;
	for (var i = 0; i < this.callbacks.onHeadingChanged.length; i++) {
		var f = this.callbacks.onHeadingChanged.shift();
		f(heading);
	}
};

/**
 * Called by the geolocation framework when an error occurs while looking up the current position.
 * @param {String} message The text of the error message.
 */
Compass.prototype.setError = function(message) {
	this.lastError = message;
	for (var i = 0; i < this.callbacks.onError.length; i++) {
		var f = this.callbacks.onError.shift();
		f(message);
	}
};

PhoneGap.addConstructor(function() {
	if (typeof navigator.compass == "undefined") navigator.compass = new Compass();
});


var Contact = function(){
	this.name = new ContactName();
	this.emails = [];
	this.phones = [];
}

var ContactName = function()
{
	this.formatted = "";
	this.familyName = "";
	this.givenName = "";
	this.additionalNames = [];
	this.prefixes = [];
	this.suffixes = [];
}


var ContactEmail = function()
{
	this.types = [];
	this.address = "";
}

var ContactPhoneNumber = function()
{
	this.types = [];
	this.number = "";
}


var Contacts = function()
{
	this.records = [];  
}

Contacts.prototype.find = function(obj, win, fail)
{
	if(obj.name != null)
	{
		// Build up the search term that we'll use in SQL, based on the structure/contents of the contact object passed into find.
		var searchTerm = '';
		if (obj.name.givenName && obj.name.givenName.length > 0) {
			searchTerm = obj.name.givenName.split(' ').join('%');
		}
		if (obj.name.familyName && obj.name.familyName.length > 0) {
			searchTerm += obj.name.familyName.split(' ').join('%');
		}
		if (!obj.name.familyName && !obj.name.givenName && obj.name.formatted) {
			searchTerm = obj.name.formatted;
		}
		ContactHook.search(searchTerm, "", ""); 
	}
	this.win = win;
	this.fail = fail;
}

Contacts.prototype.droidFoundContact = function(name, npa, email)
{
	var contact = new Contact();
	contact.name = new ContactName();
	contact.name.formatted = name;
	contact.name.givenName = name;
	var mail = new ContactEmail();
	mail.types.push("home");
	mail.address = email;
	contact.emails.push(mail);
	phone = new ContactPhoneNumber();
	phone.types.push("home");
	phone.number = npa;
	contact.phones.push(phone);
	this.records.push(contact);
}

Contacts.prototype.droidDone = function()
{
	this.win(this.records);
}

PhoneGap.addConstructor(function() {
	if(typeof navigator.contacts == "undefined") navigator.contacts = new Contacts();
});


var Crypto = function()
{
}

Crypto.prototype.encrypt = function(seed, string, callback)
{
	GapCrypto.encrypt(seed, string);
	this.encryptWin = callback;
}

Crypto.prototype.decrypt = function(seed, string, callback)
{
	GapCrypto.decrypt(seed, string);
	this.decryptWin = callback;
}

Crypto.prototype.gotCryptedString = function(string)
{
	this.encryptWin(string);
}

Crypto.prototype.getPlainString = function(string)
{
	this.decryptWin(string);
}

PhoneGap.addConstructor(function() {
	if (typeof navigator.Crypto == "undefined")
	{
		navigator.Crypto = new Crypto();
	}
});



/**
 * this represents the mobile device, and provides properties for inspecting the model, version, UUID of the
 * phone, etc.
 * @constructor
 */
function Device() {
	this.available = PhoneGap.available;
	this.platform = null;
	this.version  = null;
	this.name     = null;
	this.gap      = null;
	this.uuid     = null;
	try {
		if (window.DroidGap) {
			this.available = true;
			this.uuid = window.DroidGap.getUuid();
			this.version = window.DroidGap.getOSVersion();
			this.gapVersion = window.DroidGap.getVersion();
			this.platform = window.DroidGap.getPlatform();
			this.name = window.DroidGap.getProductName();  
		} 
	} catch(e) {
		this.available = false;
	}
}

PhoneGap.addConstructor(function() {
	navigator.device = window.device = new Device();
});





PhoneGap.addConstructor(function() { if (typeof navigator.fileMgr == "undefined") navigator.fileMgr = new FileMgr();});


/**
 * This class provides iPhone read and write access to the mobile device file system.
 * Based loosely on http://www.w3.org/TR/2009/WD-FileAPI-20091117/#dfn-empty
 */
function FileMgr() 
{
	this.fileWriters = {}; // empty maps
	this.fileReaders = {};

	this.docsFolderPath = "../../Documents";
	this.tempFolderPath = "../../tmp";
	this.freeDiskSpace = -1;
	this.getFileBasePaths();
}

//private, called from Native Code
FileMgr.prototype._setPaths = function(docs,temp)
{
	this.docsFolderPath = docs;
	this.tempFolderPath = temp;
}

//private, called from Native Code
FileMgr.prototype._setFreeDiskSpace = function(val)
{
	this.freeDiskSpace = val;
}


//FileWriters add/remove
//called internally by writers
FileMgr.prototype.addFileWriter = function(filePath,fileWriter)
{
	this.fileWriters[filePath] = fileWriter;
}

FileMgr.prototype.removeFileWriter = function(filePath)
{
	this.fileWriters[filePath] = null;
}

//File readers add/remove
//called internally by readers
FileMgr.prototype.addFileReader = function(filePath,fileReader)
{
	this.fileReaders[filePath] = fileReader;
}

FileMgr.prototype.removeFileReader = function(filePath)
{
	this.fileReaders[filePath] = null;
}

/*******************************************
 *
 *	private reader callback delegation
 *	called from native code
 */
FileMgr.prototype.reader_onloadstart = function(filePath,result)
{
	this.fileReaders[filePath].onloadstart(result);
}

FileMgr.prototype.reader_onprogress = function(filePath,result)
{
	this.fileReaders[filePath].onprogress(result);
}

FileMgr.prototype.reader_onload = function(filePath,result)
{
	this.fileReaders[filePath].result = unescape(result);
	this.fileReaders[filePath].onload(this.fileReaders[filePath].result);
}

FileMgr.prototype.reader_onerror = function(filePath,err)
{
	this.fileReaders[filePath].result = err;
	this.fileReaders[filePath].onerror(err);
}

FileMgr.prototype.reader_onloadend = function(filePath,result)
{
	this.fileReaders[filePath].onloadend(result);
}

/*******************************************
 *
 *	private writer callback delegation
 *	called from native code
 */
FileMgr.prototype.writer_onerror = function(filePath,err)
{
	this.fileWriters[filePath].onerror(err);
}

FileMgr.prototype.writer_oncomplete = function(filePath,result)
{
	this.fileWriters[filePath].oncomplete(result); // result contains bytes written
}


FileMgr.prototype.getFileBasePaths = function()
{
	//PhoneGap.exec("File.getFileBasePaths");
}

FileMgr.prototype.testFileExists = function(fileName, successCallback, errorCallback)
{
	var test = FileUtil.testFileExists(fileName);
	test ? successCallback() : errorCallback();
}

FileMgr.prototype.testDirectoryExists = function(dirName, successCallback, errorCallback)
{
	this.successCallback = successCallback;
	this.errorCallback = errorCallback;
	var test = FileUtil.testDirectoryExists(dirName);
	test ? successCallback() : errorCallback();
}

FileMgr.prototype.createDirectory = function(dirName, successCallback, errorCallback)
{
	this.successCallback = successCallback;
	this.errorCallback = errorCallback;
	var test = FileUtils.createDirectory(dirName);
	test ? successCallback() : errorCallback();
}

FileMgr.prototype.deleteDirectory = function(dirName, successCallback, errorCallback)
{
	this.successCallback = successCallback;
	this.errorCallback = errorCallback;
	var test = FileUtils.deleteDirectory(dirName);
	test ? successCallback() : errorCallback();
}

FileMgr.prototype.deleteFile = function(fileName, successCallback, errorCallback)
{
	this.successCallback = successCallback;
	this.errorCallback = errorCallback;
	FileUtils.deleteFile(fileName);
	test ? successCallback() : errorCallback();
}

FileMgr.prototype.getFreeDiskSpace = function(successCallback, errorCallback)
{
	if(this.freeDiskSpace > 0)
	{
		return this.freeDiskSpace;
	}
	else
	{
		this.successCallback = successCallback;
		this.errorCallback = errorCallback;
		this.freeDiskSpace = FileUtils.getFreeDiskSpace();
		(this.freeDiskSpace > 0) ? successCallback() : errorCallback();
	}
}


//File Reader


function FileReader()
{
	this.fileName = "";
	this.result = null;
	this.onloadstart = null;
	this.onprogress = null;
	this.onload = null;
	this.onerror = null;
	this.onloadend = null;
}


FileReader.prototype.abort = function()
{
	// Not Implemented
}

FileReader.prototype.readAsText = function(file)
{
	if(this.fileName && this.fileName.length > 0)
	{
		navigator.fileMgr.removeFileReader(this.fileName,this);
	}
	this.fileName = file;
	navigator.fileMgr.addFileReader(this.fileName,this);

	return FileUtil.read(fileName);
}

//File Writer

function FileWriter()
{
	this.fileName = "";
	this.result = null;
	this.readyState = 0; // EMPTY
	this.result = null;
	this.onerror = null;
	this.oncomplete = null;
}

FileWriter.prototype.writeAsText = function(file,text,bAppend)
{
	if(this.fileName && this.fileName.length > 0)
	{
		navigator.fileMgr.removeFileWriter(this.fileName,this);
	}
	this.fileName = file;
	if(bAppend != true)
	{
		bAppend = false; // for null values
	}
	navigator.fileMgr.addFileWriter(file,this);
	this.readyState = 0; // EMPTY
	var call = FileUtil.write(file, text, bAppend);
	this.result = null;
}


/**
 * This class provides access to device GPS data.
 * @constructor
 */
function Geolocation() {
	/**
	 * The last known GPS position.
	 */
	this.lastPosition = null;
	this.lastError = null;
	this.callbacks = {
			onLocationChanged: [],
			onError:           []
	};
};

Geolocation.prototype.getCurrentPosition = function(successCallback, errorCallback, options)
{
	alert("Phonegap CurrentPos");
	var position = Geo.getCurrentLocation();
	this.global_success = successCallback;
	this.fail = errorCallback;
}

/**
 * Asynchronously aquires the position repeatedly at a given interval.
 * @param {Function} successCallback The function to call each time the position
 * data is available
 * @param {Function} errorCallback The function to call when there is an error 
 * getting the position data.
 * @param {PositionOptions} options The options for getting the position data
 * such as timeout and the frequency of the watch.
 */
Geolocation.prototype.watchPosition = function(successCallback, errorCallback, options) {
	// Invoke the appropriate callback with a new Position object every time the implementation 
	// determines that the position of the hosting device has changed. 

	this.getCurrentPosition(successCallback, errorCallback, options);
	var frequency = 10000;
	if (typeof(options) == 'object' && options.frequency)
		frequency = options.frequency;

	var that = this;
	return setInterval(function() {
		that.getCurrentPosition(successCallback, errorCallback, options);
	}, frequency);
};


/**
 * Clears the specified position watch.
 * @param {String} watchId The ID of the watch returned from #watchPosition.
 */
Geolocation.prototype.clearWatch = function(watchId) {
	clearInterval(watchId);
};

/**
 * Called by the geolocation framework when the current location is found.
 * @param {PositionOptions} position The current position.
 */
Geolocation.prototype.setLocation = function(position) {
	this.lastPosition = position;
	for (var i = 0; i < this.callbacks.onLocationChanged.length; i++) {
		var f = this.callbacks.onLocationChanged.shift();
		f(position);
	}
};

/**
 * Called by the geolocation framework when an error occurs while looking up the current position.
 * @param {String} message The text of the error message.
 */
Geolocation.prototype.setError = function(message) {
	this.lastError = message;
	for (var i = 0; i < this.callbacks.onError.length; i++) {
		var f = this.callbacks.onError.shift();
		f(message);
	}
};

//Run the global callback
Geolocation.prototype.gotCurrentPosition = function(lat, lng, alt, altacc, head, vel, stamp)
{
	if (lat == "undefined" || lng == "undefined")
	{
		this.fail();
	}
	else
	{
		coords = new Coordinates(lat, lng, alt, altacc, head, vel);
		loc = new Position(coords, stamp);
		this.lastPosition = loc;
		this.global_success(loc);
	}
}

/*
 * This turns on the GeoLocator class, which has two listeners.
 * The listeners have their own timeouts, and run independently of this process
 * In this case, we return the key to the watch hash
 */

Geolocation.prototype.watchPosition = function(successCallback, errorCallback, options)
{
	var frequency = (options != undefined)? options.frequency : 10000;

	if (!this.listeners)
	{
		this.listeners = [];
	}

	var key = this.listeners.push( {"success" : successCallback, "fail" : failCallback }) - 1;

	// TO-DO: Get the names of the method and pass them as strings to the Java.
	return Geolocation.start(frequency, key);
}

/*
 * Retrieve and stop this listener from listening to the GPS
 *
 */
Geolocation.prototype.success = function(key, lat, lng, alt, altacc, head, vel, stamp)
{
	var coords = new Coordinates(lat, lng, alt, altacc, head, vel);
	var loc = new Position(coords, stamp);
	this.listeners[key].success(loc);
}

Geolocation.prototype.fail = function(key)
{
	this.listeners[key].fail();
}

Geolocation.prototype.clearWatch = function(watchId)
{
	Geo.stop(watchId);
}
//Taken from Jesse's geo fix (similar problem) in PhoneGap iPhone. Go figure, same browser!
function __proxyObj(origObj, proxyObj, funkList) {
	for (var v in funkList) {
		origObj[funkList[v]] = proxyObj[funkList[v]];
	}
}
PhoneGap.addConstructor(function() {
	navigator._geo = new Geolocation();
	__proxyObj(navigator.geolocation, navigator._geo,
			["setLocation", "getCurrentPosition", "watchPosition",
			 "clearWatch", "setError", "start", "stop", "gotCurrentPosition"]
	);
});

function KeyEvent() 
{
}

KeyEvent.prototype.menuTrigger = function()
{
	var e = document.createEvent('Events');
	e.initEvent('menuKeyDown');
	document.dispatchEvent(e);
}

KeyEvent.prototype.searchTrigger= function()
{
	var e = document.createEvent('Events');
	e.initEvent('searchKeyDown');
	document.dispatchEvent(e);
}

if (document.keyEvent == null || typeof document.keyEvent == 'undefined')
{
	window.keyEvent = document.keyEvent = new KeyEvent();
}


/**
 * This class provides access to the device media, interfaces to both sound and video
 * @constructor
 */
function Media(src, successCallback, errorCallback) {
	this.src = src;
	this.successCallback = successCallback;
	this.errorCallback = errorCallback;												
}

Media.prototype.record = function() {
}

Media.prototype.play = function() {
}

Media.prototype.pause = function() {
}

Media.prototype.stop = function() {
}


/**
 * This class contains information about any Media errors.
 * @constructor
 */
function MediaError() {
	this.code = null,
	this.message = "";
}

MediaError.MEDIA_ERR_ABORTED 		= 1;
MediaError.prototype.MEDIA_ERR_ABORTED 		= MediaError.MEDIA_ERR_ABORTED;
MediaError.MEDIA_ERR_NETWORK 		= 2;
MediaError.prototype.MEDIA_ERR_NETWORK 		= MediaError.MEDIA_ERR_NETWORK;
MediaError.MEDIA_ERR_DECODE 		= 3;
MediaError.prototype.MEDIA_ERR_DECODE 		= MediaError.MEDIA_ERR_DECODE;
MediaError.MEDIA_ERR_NONE_SUPPORTED = 4;
MediaError.prototype.MEDIA_ERR_NONE_SUPPORTED = MediaError.MEDIA_ERR_NONE_SUPPORTED;



//if (typeof navigator.audio == "undefined") navigator.audio = new Media(src);

/**
 * This class provides access to the device media, interfaces to both sound and video
 * @constructor
 */

Media.prototype.play = function() {
	DroidGap.startPlayingAudio(this.src);  
}

Media.prototype.stop = function() {
	DroidGap.stopPlayingAudio();
}

Media.prototype.startRecord = function() {
	DroidGap.startRecordingAudio(this.src);
}

Media.prototype.stopRecordingAudio = function() {
	DroidGap.stopRecordingAudio();
}




/**
 * This class contains information about any NetworkStatus.
 * @constructor
 */
function NetworkStatus() {
	this.code = null;
	this.message = "";
}

NetworkStatus.NOT_REACHABLE = 0;
NetworkStatus.REACHABLE_VIA_CARRIER_DATA_NETWORK = 1;
NetworkStatus.REACHABLE_VIA_WIFI_NETWORK = 2;

/**
 * This class provides access to device Network data (reachability).
 * @constructor
 */
function Network() {
	/**
	 * The last known Network status.
	 * { hostName: string, ipAddress: string, 
		remoteHostStatus: int(0/1/2), internetConnectionStatus: int(0/1/2), localWiFiConnectionStatus: int (0/2) }
	 */
	this.lastReachability = null;
};

/**
 * 
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @param {Object} options  (isIpAddress:boolean)
 */
Network.prototype.isReachable = function(hostName, successCallback, options) {
}

/**
 * Called by the geolocation framework when the reachability status has changed.
 * @param {Reachibility} reachability The current reachability status.
 */
Network.prototype.updateReachability = function(reachability) {
	this.lastReachability = reachability;
};

PhoneGap.addConstructor(function() {
	if (typeof navigator.network == "undefined") navigator.network = new Network();
});
Network.prototype.isReachable = function(uri, win, options)
{
	var status = new NetworkStatus();
	if(NetworkManager.isReachable(uri))
	{
		if (NetworkManager.isWifiActive)
			status.code = 2;
		else
			status.code = 1;
	}
	else
		status.code = 0;
	win(status);
}


/**
 * This class provides access to notifications on the device.
 */
function Notification() {

}

/**
 * Open a native alert dialog, with a customizable title and button text.
 * @param {String} message Message to print in the body of the alert
 * @param {String} [title="Alert"] Title of the alert dialog (default: Alert)
 * @param {String} [buttonLabel="OK"] Label of the close button (default: OK)
 */
Notification.prototype.alert = function(message, title, buttonLabel) {
	// Default is to use a browser alert; this will use "index.html" as the title though
	alert(message);
};

/**
 * Start spinning the activity indicator on the statusbar
 */
Notification.prototype.activityStart = function() {
};

/**
 * Stop spinning the activity indicator on the statusbar, if it's currently spinning
 */
Notification.prototype.activityStop = function() {
};

/**
 * Causes the device to blink a status LED.
 * @param {Integer} count The number of blinks.
 * @param {String} colour The colour of the light.
 */
Notification.prototype.blink = function(count, colour) {

};

/**
 * Causes the device to vibrate.
 * @param {Integer} mills The number of milliseconds to vibrate for.
 */
Notification.prototype.vibrate = function(mills) {

};

/**
 * Causes the device to beep.
 * @param {Integer} count The number of beeps.
 * @param {Integer} volume The volume of the beep.
 */
Notification.prototype.beep = function(count, volume) {

};

//TODO: of course on Blackberry and Android there notifications in the UI as well

PhoneGap.addConstructor(function() {
	if (typeof navigator.notification == "undefined") navigator.notification = new Notification();
});

Notification.prototype.vibrate = function(mills)
{
	DroidGap.vibrate(mills);
}

/*
 * On the Android, we don't beep, we notify you with your 
 * notification!  We shouldn't keep hammering on this, and should
 * review what we want beep to do.
 */

Notification.prototype.beep = function(count, volume)
{
	DroidGap.beep(count);
}


/**
 * This class contains position information.
 * @param {Object} lat
 * @param {Object} lng
 * @param {Object} acc
 * @param {Object} alt
 * @param {Object} altacc
 * @param {Object} head
 * @param {Object} vel
 * @constructor
 */
function Position(coords, timestamp) {
	this.coords = coords;
	if (typeof timestampParam == "undefined" || timestampParam == null){
		this.timestamp = new Date().getTime();
	} else {
		this.timestamp = timestampParam;
	}
}


function Coordinates(lat, lng, alt, acc, head, vel, altacc) {
	/**
	 * The latitude of the position.
	 */
	this.latitude = lat;
	/**
	 * The longitude of the position,
	 */
	this.longitude = lng;
	/**
	 * The accuracy of the position.
	 */
	this.accuracy = acc;

	/**
	 * The accuracy of the altitude of this position.
	 */
	this.altitudeAccuracy = altacc;

	/**
	 * The altitude of the position.
	 */
	this.altitude = alt;
	/**
	 * The direction the device is moving at the position.
	 */
	this.heading = head;
	/**
	 * The velocity with which the device is moving at the position.
	 */
	this.speed = vel;
}

/**
 * This class specifies the options for requesting position data.
 * @constructor
 */
function PositionOptions() {
	/**
	 * Specifies the desired position accuracy.
	 */
	this.enableHighAccuracy = true;
	/**
	 * The timeout after which if position data cannot be obtained the errorCallback
	 * is called.
	 */
	this.timeout = 10000;
}

/**
 * This class contains information about any GSP errors.
 * @constructor
 */
function PositionError() {
	this.code = null;
	this.message = "";
}

PositionError.UNKNOWN_ERROR = 0;
PositionError.prototype.UNKNOWN_ERROR = PositionError.UNKNOWN_ERROR;
PositionError.PERMISSION_DENIED = 1;
PositionError.prototype.PERMISSION_DENIED = PositionError.PERMISSION_DENIED;
PositionError.POSITION_UNAVAILABLE = 2;
PositionError.prototype.POSITION_UNAVAILABLE = PositionError.POSITION_UNAVAILABLE;
PositionError.TIMEOUT = 3;
PositionError.prototype.TIMEOUT = PositionError.TIMEOUT;



/*
 * This is purely for the Android 1.5/1.6 HTML 5 Storage
 * I was hoping that Android 2.0 would deprecate this, but given the fact that 
 * most manufacturers ship with Android 1.5 and do not do OTA Updates, this is required
 */

var DroidDB = function()
{
	this.txQueue = [];
}

DroidDB.prototype.addResult = function(rawdata, tx_id)
{
	eval("var data = " + rawdata);
	var tx = this.txQueue[tx_id];
	tx.resultSet.push(data);
}

DroidDB.prototype.completeQuery = function(tx_id)
{
	var tx = this.txQueue[tx_id];
	var r = new result();
	r.rows.resultSet = tx.resultSet;
	r.rows.length = tx.resultSet.length;
	tx.win(r);
}

DroidDB.prototype.fail = function(reason, tx_id)
{
	var tx = this.txQueue[tx_id];
	tx.fail(reason);
}

var DatabaseShell = function()
{

}

DatabaseShell.prototype.transaction = function(process)
{
	tx = new Tx();
	process(tx);
}

var Tx = function()
{
	droiddb.txQueue.push(this);
	this.id = droiddb.txQueue.length - 1;
	this.resultSet = [];
}

Tx.prototype.executeSql = function(query, params, win, fail)
{
	droidStorage.executeSql(query, params, this.id);
	tx.win = win;
	tx.fail = fail;
}

var result = function()
{
	this.rows = new Rows();
}

var Rows = function()
{
	this.resultSet = [];
	this.length = 0;
}

Rows.prototype.item = function(row_id)
{
	return this.resultSet[id];
}

var dbSetup = function(name, version, display_name, size)
{
	droidStorage.openDatabase(name, version, display_name, size)
	db_object = new DatabaseShell();
	return db_object;
}

PhoneGap.addConstructor(function() {
	if (typeof navigator.openDatabase == "undefined") 
	{
		navigator.openDatabase = window.openDatabase = dbSetup;
		window.droiddb = new DroidDB();
	}
});



