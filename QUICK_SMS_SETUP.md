# Quick SMS Setup (Without Cloud Functions)

## Issue: Firebase Blaze Plan Required

Firebase Cloud Functions require the Blaze (pay-as-you-go) plan. For demo purposes, here are alternatives:

## Option 1: Upgrade Firebase Plan (Recommended for Production)

1. Go to: https://console.firebase.google.com/project/queue-management-b9f69/usage/details
2. Click "Upgrade to Blaze Plan"
3. Add billing information (you won't be charged for small usage)
4. Run: `firebase deploy --only functions`

## Option 2: Demo Mode (No Real SMS)

For hackathon demo, you can simulate SMS without actual sending:

### Update SMS Service for Demo Mode

```javascript
// In src/services/smsService.js - add demo mode
export const smsService = {
  async sendNotification(phoneNumber, message, queueId = null) {
    // Demo mode - just log instead of sending
    console.log('📱 SMS Demo:', {
      to: phoneNumber,
      message: message,
      queueId: queueId
    });
    
    // Show browser notification for demo
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('QueueFlow SMS', {
        body: message,
        icon: '/icons/icon-192x192.png'
      });
    }
    
    // Simulate successful response
    return {
      success: true,
      messageId: 'demo-' + Date.now(),
      status: 'demo-sent'
    };
  },
  
  // ... other methods remain the same
};
```

## Option 3: Use Alternative SMS Service

### Twilio (Easier Setup)
```javascript
// Alternative: Use Twilio directly from client (demo only)
const accountSid = 'your_account_sid';
const authToken = 'your_auth_token';

fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken),
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    'From': '+1234567890',
    'To': phoneNumber,
    'Body': message
  })
});
```

## For Hackathon Demo

### Show SMS Functionality Without Sending

1. **Browser Console Logs**: Show SMS content in console
2. **Browser Notifications**: Use Web Notifications API
3. **Mock UI**: Show "SMS sent" confirmations
4. **Explain to Judges**: "In production, this sends real SMS via Africa's Talking"

### Demo Script
```
"Here you can see the SMS functionality - in production this sends real SMS 
to Uganda phone numbers via Africa's Talking API. For the demo, I'm showing 
the SMS content in the browser console and notifications."
```

## Production Deployment Steps

1. **Upgrade Firebase**: Enable Blaze plan
2. **Get Africa's Talking API**: Sign up and get credentials
3. **Configure Functions**: `firebase functions:config:set africastalking.apikey="YOUR_KEY"`
4. **Deploy**: `firebase deploy --only functions`
5. **Test**: Send real SMS to Uganda numbers

## Cost Estimate

- **Firebase Functions**: Free tier covers demo usage
- **Africa's Talking SMS**: ~UGX 50-100 per SMS
- **Total Demo Cost**: Under $5 USD

The app works perfectly without SMS - it's just an enhancement for better user experience!