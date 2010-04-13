package com.phonegap;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.telephony.PhoneNumberUtils;
import android.telephony.TelephonyManager;
import android.telephony.gsm.SmsManager;
import android.telephony.gsm.SmsMessage;
import android.webkit.WebView;
import android.widget.Toast;



/**
 * 
 * This class handles the message traffic for the BONID-messaging module
 * 
 * @author loeffelholz
 *
 */
public class MessageHandler {

	/**
	 * The webView of the Activity that instantiated this Handler
	 */
	private WebView mAppView;

	/**
	 * The Activity that instantiated this handler
	 */
	private Activity mCtx;
	
	/**
	 * A manager-class for sending sms
	 */
	private SmsManager smsM;
	
	/**
	 * the sourceAddress that will be used for sent sms
	 */
	private String ownNumber = null;
	
	/**
	 * unique ID, used as part of the monitoring of sent sms
	 */
	private String SENT = "com.phonegap.MessageHandler#SMS_Sent";
	
	/**
	 * unique ID, used as part of the monitoring of delivered sms
	 */
	private String DELIVERED = "com.phonegap.MessageHandler#SMS_Delivered";
	
	/**
	 * HashMap used to store and retrieve smsReceivers. See subscribeToSms and unsubscribeToSms
	 */
	private Map<Long, SmsReceiver> smsReceivers = Collections.synchronizedMap(new HashMap<Long, SmsReceiver>());
	
	/**
	 * String constant for monitoring the sending of an sms
	 * In this case: All went fine
	 */
	public static final String SMS_SENT = "SMS_SENT_RESULT_OK";
	/**
	 * String constant for monitoring the sending of an sms
	 * In this case: Something didn't went fine
	 */
	public static final String SMS_ERROR_GENERIC_FAILURE = "SMS_RESULT_ERROR_GENERIC_FAILURE";
	/**
	 * String constant for monitoring the sending of an sms
	 * In this case: There was no service available to send the sms
	 */
	public static final String SMS_ERROR_NO_SERVICE = "SMS_RESULT_ERROR_NO_SERVICE";
	/**
	 * String constant for monitoring the sending of an sms
	 * In this case:  for this sms, no content was provided to generate the pdu
	 */
	public static final String SMS_ERROR_NULL_PDU = "SMS_RESULT_ERROR_NULL_PDU";
	/**
	 * String constant for monitoring the sending of an sms
	 * In this case:  The sms couldn't be sent because the antenna/radio was turned off
	 */
	public static final String SMS_ERROR_RADIO_OFF = "SMS_RESULT_ERROR_RADIO_OFF";
	
	/**
	 * String constant for monitoring the delivery of an sms
	 * In this case: All went fine
	 */
	public static final String SMS_DELIVERED = "SMS_DELIVERED_OK";
	/**
	 * String constant for monitoring the delivery of an sms
	 * In this case: SMS couldn't be delivered because the delivery was canceled
	 */
	public static final String SMS_DELIVERY_CANCEL = "SMS_RESULT_CANCELED";

	
	/**
	 * Constructor, set content and appView
	 * @param ctx		The Activity in which this Handler was instantiated
	 * @param appView	the Webview of the Activity in which this Handler was instantiated
	 */
	public MessageHandler(Activity ctx, WebView appView) {
		this.mCtx = ctx;
		this.mAppView = appView;
		this.smsM = SmsManager.getDefault();
		TelephonyManager mTelephonyMgr = (TelephonyManager) mCtx.getSystemService(Context.TELEPHONY_SERVICE);
		ownNumber = mTelephonyMgr.getLine1Number();
	}
	
	
	/**
	 * method for sending sms
	 * 
	 * @param phoneNo 	the phone number to sent the sms to
	 * @param message	the messageBody of the sms to send
	 * @param messageID	a unique id of this message to make it possible to monitor the sending and delivery of this sms
	 * @param store		true if sms should be stored, false if not
	 * @param key		listenerID for callbackmanagement within messaging.js
	 */
	synchronized public void sendSMS(String phoneNo, String message, String messageID, boolean store, String key, long datetime){

		ArrayList<String> messageParts = new ArrayList<String>();

		// checks if the messageBody is possibly to long and splits it into parts of maximal length
		messageParts = smsM.divideMessage(message);		

		// sentIntent is used to monitor the sending procedure
		// the pendingIntent sentPI will broadcast status-messages using sentIntent as key to check for registered listeners
		Intent sentIntent = new Intent(messageID + "#" + SENT);
		PendingIntent sentPI = PendingIntent.getBroadcast(mCtx, 0, sentIntent, 0);

		// deliveryIntent is used to monitor the delivery procedure
		// the pendingIntent sentPI will broadcast status-messages using deliveryIntent as key to check for registered listeners
		Intent deliveryIntent = new Intent(messageID + "#" + DELIVERED);
		PendingIntent deliveredPI = PendingIntent.getBroadcast(mCtx, 0, deliveryIntent, 0);

		// registering the listeners that will be monitoring this sms on its way to it's target address
		this.mCtx.registerReceiver(new SentReceiver(key), new IntentFilter(messageID + "#" + SENT));
		this.mCtx.registerReceiver(new DeliveryReceiver(key), new IntentFilter(messageID + "#" + DELIVERED));

		// now let's see how big the message got and send it's parts
		if (messageParts.size() > 1){

			// Code was commented out because of problems with text-encoding within sendMultipartTextMessage nobody in the community seems to have even a clue what's the problem with android here
//			ArrayList<PendingIntent> sentPIs = new ArrayList<PendingIntent>();
//			ArrayList<PendingIntent> deliveryPIs = new ArrayList<PendingIntent>();
			 
//			 for (int i = 0; i < messageParts.size(); i++){
//				 sentPIs.add(PendingIntent.getBroadcast(mCtx, 0, sentIntent, 0));
//				 deliveryPIs.add(PendingIntent.getBroadcast(mCtx, 0, deliveryIntent, 0));
//				 System.out.println("Sending: " + messageParts.get(i));
//			 }
//			 smsM.sendMultipartTextMessage(phoneNo, ownNumber, messageParts, sentPIs, deliveryPIs);
			 
			for (String messagePart : messageParts){
				smsM.sendTextMessage(phoneNo, ownNumber, messagePart, sentPI, deliveredPI);
				 
				deleteSMS(datetime, phoneNo, message);
				
				if (store){
					storeSMS(datetime, phoneNo, messagePart, 2);
				}
			 }
			 
		 } else {
			 smsM.sendTextMessage(phoneNo, ownNumber, message, sentPI, deliveredPI);
			 
			 deleteSMS(datetime, phoneNo, message);
			 
			 if (store){
				 storeSMS(datetime, phoneNo, message, 2);
			 }
		 }
	}
	
	
	/**
	 * Deletes a sms from the android database
	 * 
	 * @param datetime 	current timestamp of the sms to delete
	 * @param phoneNo	recipients of this sms
	 * @param message	the message-body of the sms to delete
	 */
	private void deleteSMS(long datetime, String phoneNo, String message){
		ContentValues values = new ContentValues();
		values.put("date", datetime);
		values.put("address", phoneNo);
		values.put("body", message);
		
		mCtx.getContentResolver().delete(Uri.parse("content://sms/"), "date='" + datetime + "' AND body='" + message + "'", null);
	}
	
	/**
	 * Stores a sms within the android database
	 * 
	 * @param datetime 	current timestamp of the sms to delete
	 * @param phoneNo	recipients of this sms
	 * @param message	the message-body of the sms to delete
	 * @param folder	the folder to store the sms into. allowed values: <br/>
	 * 					bondi.messaging.INBOX_FOLDER	<br/>
	 * 					bondi.messaging.OUTBOX_FOLDER   <br/>
	 * 					bondi.messaging.SENT_FOLDER		<br/>
	 * 					bondi.messaging.DRAFTS_FOLDER	<br/>
	 * @return			uri of the stored sms
	 */
	private Uri storeSMS(long datetime, String phoneNo, String message, int folder){
		Uri place = null;
		switch(folder){
		case 0:
			//inbox
			place = Uri.parse("content://sms/inbox");
			break;
		case 1:
			//outbox
			place = Uri.parse("content://sms/outbox");
			break;
		case 2:
			//sent
			place = Uri.parse("content://sms/sent");
			break;
		case 3:
			//drafts
			place = Uri.parse("content://sms/drafts");
			break;
		default:
			// do nothing
			break;
		}
		
		ContentValues values = new ContentValues();
		values.put("date", new Date().getDate());
		values.put("address", phoneNo);
		values.put("body", message);
		return mCtx.getContentResolver().insert(place, values);
	}
	
	
	/**
	 * validates a phoneNumber by checking if all characters within the number are dialable
	 * 
	 * @param phoneNo 	phone number to validate
	 * @return			true, if all characters are dialable (checked conditions: ISO-LATIN characters 0-9, *, # , + (no WILD)), false otherwise
	 */
	public boolean isPhoneNumber(String phoneNo){
		
		boolean isValid = true;
			
		for (int i = 0; i < phoneNo.length(); i++){
			if (!PhoneNumberUtils.isReallyDialable(phoneNo.charAt(i)) || phoneNo.length() > 15){
				isValid = false;
				break;
			}
		}
		return isValid;
	}
	
	
	/* it turned out this hadn't to be implemented
	 
	synchronized public void sendMMS(String phoneNo, String subject, String message, String attachment, String messageID){
//		 Toast.makeText(mCtx.getBaseContext(), "SendSMS: MessageID=" + messageID, Toast.LENGTH_LONG).show();
		

		Intent sentIntent = new Intent(messageID + "#" + SENT);
		PendingIntent sentPI = PendingIntent.getBroadcast(mCtx, 0, sentIntent, 0);

		Intent deliveryIntent = new Intent(messageID + "#" + DELIVERED);
		PendingIntent deliveredPI = PendingIntent.getBroadcast(mCtx, 0, deliveryIntent, 0);

		this.mCtx.registerReceiver(new SentReceiver(), new IntentFilter(messageID + "#" + SENT));
		this.mCtx.registerReceiver(new DeliveryReceiver(), new IntentFilter(messageID + "#" + DELIVERED));

		
		Intent mmsIntent = new Intent(Intent.ACTION_SEND); 
		mmsIntent.putExtra(Intent.EXTRA_SUBJECT, subject);
		mmsIntent.putExtra(Intent.EXTRA_TEXT, message);
		
		if (attachment != null){
			mmsIntent.putExtra(Intent.EXTRA_STREAM, Uri.parse(attachment));
			mmsIntent.setDataAndType(Uri.parse(attachment), this.getMimeType(attachment));
		}
		
		mCtx.startActivity(mmsIntent);
		
	}
	
	public String getMimeType(String fileUri){
		String type = "application/binary";
		
		if (fileUri.endsWith(".jpg") || fileUri.endsWith(".jpeg") || fileUri.endsWith(".jpe")){
			type = "image/jpeg";
		} else if (fileUri.endsWith(".png")){
			type = "image/png";
		} else if (fileUri.endsWith(".txt")){
			type = "text/plain";
		}
		
		return type;
	}
	*/
	
	/**
	 * Registers a listener that will wait for SMS on the given port from the given sender.
	 * If port or sender are null this conditions will be ignored
	 * 
	 * Caution: portfiltering isn't supported yet.
	 * 
	 * @param key 	a unique identifier for the listener making it possible to unregister it later
	 * @param port 	a port to listen at
	 * @param sender if != null only messages from this sender will be transmitted to the successcallback
	 * 
	 */
	public void subscribeToSMS(long key, String port, String sender){
		SmsReceiver sRec = new SmsReceiver(key, port, sender);
		smsReceivers.put(key, sRec);
		mCtx.registerReceiver(sRec, new IntentFilter("android.provider.Telephony.SMS_RECEIVED"));
	}
	
	
	/**
	 * unregisteres listeners that are waiting for sms
	 * 
	 * @param key	the unique identifier used during subscribeToSMS(...)
	 */
	public void unsubscribeFromSMS(long key){
		SmsReceiver sRec = smsReceivers.remove(key);
		mCtx.unregisterReceiver(sRec);
	}
	
	
	public void unsubscribeFromAllSMS(){
		for (long key : smsReceivers.keySet()){
			SmsReceiver sRec = smsReceivers.get(key);
			mCtx.unregisterReceiver(sRec);
		}
		smsReceivers.clear();
	}
	
	
	/**
	 * This class monitors the sending process of an sms and returns resultcodes depending on it's success
	 * 
	 * @author loeffelholz
	 *
	 */
	private class SentReceiver extends BroadcastReceiver{
		
		String key;
		
		public SentReceiver(String key){
			this.key = key;
		}
		
        @Override
        public void onReceive(Context context, Intent intent) {
            
        	context.unregisterReceiver(this);
        	
        	String messageID = intent.getAction();
        	messageID = messageID.substring(0, messageID.indexOf("#"));
        	
        	switch (getResultCode())
            {
                case Activity.RESULT_OK:
                	mAppView.loadUrl("javascript:bondi.messaging.smsSuccess(" + this.key + ", '" + SMS_SENT.toString()  + "')");

                    break;
                case SmsManager.RESULT_ERROR_GENERIC_FAILURE:
                	mAppView.loadUrl("javascript:bondi.messaging.smsFailure("+ this.key + ", '" +  SMS_ERROR_GENERIC_FAILURE  + "')");

                    break;
                case SmsManager.RESULT_ERROR_NO_SERVICE:
                	mAppView.loadUrl("javascript:bondi.messaging.smsFailure("+ this.key + ", '" +  SMS_ERROR_NO_SERVICE  + "')");

                    break;
                case SmsManager.RESULT_ERROR_NULL_PDU:
                	mAppView.loadUrl("javascript:bondi.messaging.smsFailure("+ this.key + ", '" +  SMS_ERROR_NULL_PDU  + "')");
                	
                    break;
                case SmsManager.RESULT_ERROR_RADIO_OFF:
                	mAppView.loadUrl("javascript:bondi.messaging.smsFailure("+ this.key + ", '" +  SMS_ERROR_RADIO_OFF  + "')");
                	
                    break;
            }
        }
    }
	
	
	/**
	 * This class monitors the delivery of an sms and returns resultcodes depending on it's success
	 * 
	 * @author loeffelholz
	 *
	 */
	private class DeliveryReceiver extends BroadcastReceiver{
		
		String key;
		
		public DeliveryReceiver(String key){
			this.key = key;
		}
		
        @Override
        public void onReceive(Context context, Intent intent) {
        	
        	context.unregisterReceiver(this);
        	
        	String messageID = intent.getAction();
        	messageID = messageID.substring(0, messageID.indexOf("#"));
        	
            switch (getResultCode())
            {
                case Activity.RESULT_OK:
                	mAppView.loadUrl("javascript:bondi.messaging.smsSuccess(" + this.key + ", " + SMS_DELIVERED  + ")");
                	
                    break;
                case Activity.RESULT_CANCELED:
                	mAppView.loadUrl("javascript:bondi.messaging.smsFailure("+ this.key + ", " +  SMS_DELIVERY_CANCEL  + ")");
                    break;                        
            }
        }
    }

	
	/**
	 * 
	 * This class listens for sms and transfers the received SMSs to a successcallback, if
	 * an sms is matching the filterconditions represented by port and sender.
	 * 
	 * Caution: If port or sender is null it will be ignored
	 * 
	 * @author loeffelholz
	 *
	 */
	private class SmsReceiver extends BroadcastReceiver {
		
		private long key = -1;
		private String port = null;
		private String sender = null;
		private boolean portIsSet = false;
		private boolean senderIsSet = false;
		
		public String toString(){
			return ("SmsReceiver: key=" + key + " port=" + port + "sender=" + sender);
		}
		
		public SmsReceiver(long key, String port, String sender){
			this.key = key;
			this.port = port;
			this.sender = sender;
			
			if (this.port != null){
				portIsSet = true;
			}
			
			if (this.sender != null){
				this.senderIsSet = true;
			}
		}
		
		@Override
		public void onReceive(Context context, Intent intent) {

			SmsMessage[] messages = null;

			if (intent.getExtras() != null) {
				Object[] pdus = (Object[]) intent.getExtras().get("pdus");
				messages = new SmsMessage[pdus.length];            
				for (int i=0; i < messages.length; i++){
					messages[i] = SmsMessage.createFromPdu((byte[])pdus[i]); 

//					System.out.println("received sms " + messages[i].getDisplayMessageBody());
//					System.out.println("received sms from " + messages[i].getOriginatingAddress() + " should have been " + this.sender);
					
					if (senderIsSet){
						if (this.sender != messages[i].getOriginatingAddress()){							
							return;
						}
					}
					if (portIsSet){
						// Not Supported in Android v1.5
						// if (this.port != messages[i].get.... ){ return;}
						// System.out.println("messages[i] " + Arrays.toString(messages[i].getPdu()));
					}

					mAppView.loadUrl("javascript:bondi.messaging.smsReceived('"+ this.key + "', '" +  messages[i].getDisplayMessageBody()  + "', '" + messages[i].getOriginatingAddress() + "')");

				}
			}          
		}
	}
	
}
