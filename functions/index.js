const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Africa's Talking
const getCredentials = () => {
  const firebaseConfig = functions.config().africastalking;
  if (firebaseConfig && firebaseConfig.apikey) {
    return {
      apiKey: firebaseConfig.apikey,
      username: firebaseConfig.username || "sandbox",
    };
  }

  if (process.env.AFRICASTALKING_API_KEY) {
    return {
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME || "sandbox",
    };
  }

  console.warn("Africa's Talking API key not configured!");
  return {
    apiKey: "YOUR_SANDBOX_API_KEY",
    username: "sandbox",
  };
};

const credentials = getCredentials();
const AfricasTalking = require("africastalking")(credentials);
const sms = AfricasTalking.SMS;

/**
 * Send SMS notification for queue updates
 */
exports.sendQueueSMS = functions.https.onCall(async (data, context) => {
  const {phoneNumber, message, queueId} = data;

  if (!phoneNumber || !message) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Phone number and message are required"
    );
  }

  const phoneRegex = /^\+256[0-9]{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Phone number must be in format +256XXXXXXXXX"
    );
  }

  try {
    const response = await sms.send({
      to: [phoneNumber],
      message: message,
      from: "QueueFlow",
    });

    console.log("SMS Sent Successfully:", response);

    if (queueId) {
      await admin.firestore().collection("sms_logs").add({
        queueId: queueId,
        phoneNumber: phoneNumber,
        message: message,
        status: "sent",
        response: response,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      messageId: response.SMSMessageData?.Recipients?.[0]?.messageId,
      status: response.SMSMessageData?.Recipients?.[0]?.status,
    };
  } catch (error) {
    console.error("SMS Error:", error);

    if (queueId) {
      await admin.firestore().collection("sms_logs").add({
        queueId: queueId,
        phoneNumber: phoneNumber,
        message: message,
        status: "failed",
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    throw new functions.https.HttpsError("internal", "Failed to send SMS");
  }
});

/**
 * Get SMS delivery reports
 */
exports.getSMSReports = functions.https.onCall(async (data, context) => {
  try {
    const logsSnapshot = await admin.firestore()
        .collection("sms_logs")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

    const logs = [];
    logsSnapshot.forEach((doc) => {
      logs.push({id: doc.id, ...doc.data()});
    });

    return {success: true, logs};
  } catch (error) {
    console.error("Error fetching SMS reports:", error);
    throw new functions.https.HttpsError("internal", "Failed to fetch reports");
  }
});