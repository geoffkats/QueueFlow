# SMS Integration Setup Guide

## Where to Put Your Africa's Talking API Key

### Step 1: Get Your API Key
1. Sign up at [Africa's Talking](https://africastalking.com/)
2. Go to your dashboard and copy your API Key
3. For testing, use the **Sandbox** environment

### Step 2: Configure Firebase Functions

You have **two options** to set your API key:

#### Option A: Firebase Functions Config (Recommended)
```bash
# Set your API key
firebase functions:config:set africastalking.apikey="YOUR_ACTUAL_API_KEY"

# Set username (use "sandbox" for testing)
firebase functions:config:set africastalking.username="sandbox"

# View current config (optional)
firebase functions:config:get
```

#### Option B: Environment Variables
Set these in your deployment environment:
```bash
export AFRICASTALKING_API_KEY="YOUR_ACTUAL_API_KEY"
export AFRICASTALKING_USERNAME="sandbox"
```

### Step 3: Deploy Functions
```bash
# Make sure you're on Firebase Blaze plan
firebase deploy --only functions
```

### Step 4: Test SMS Integration
1. Go to Admin Dashboard in your app
2. Click "SMS Panel" 
3. Send a test message
4. Check console logs for delivery status

## Important Notes

### Security
- **NEVER** put API keys directly in your React code
- The Firebase Functions act as a secure bridge
- API keys are only stored on the server side

### Phone Number Format
- Must be in international format: `+256XXXXXXXXX`
- The app automatically formats Uganda numbers

### Demo Mode
- Currently running in demo mode (logs to console)
- Switch to production mode after deploying functions
- Demo mode shows browser notifications instead

### Costs
- Africa's Talking charges per SMS sent
- Sandbox mode is free for testing
- Monitor usage in your Africa's Talking dashboard

## Troubleshooting

### Functions Not Deploying?
- Ensure you're on Firebase Blaze plan (pay-as-you-go)
- Check `firebase.json` configuration
- Verify Node.js version compatibility

### SMS Not Sending?
1. Check Firebase Functions logs: `firebase functions:log`
2. Verify API key is set: `firebase functions:config:get`
3. Ensure phone number format is correct
4. Check Africa's Talking dashboard for delivery reports

### Switch from Demo to Production
In `src/services/smsService.js`, uncomment the production code and comment out the demo code:

```javascript
// Comment out demo code
// return { success: true, messageId: 'demo-' + Date.now() };

// Uncomment production code
const result = await sendQueueSMS({
  phoneNumber,
  message,
  queueId
});
return result.data;
```

## Quick Commands Reference

```bash
# Install dependencies
cd functions && npm install

# Set API key
firebase functions:config:set africastalking.apikey="YOUR_KEY"

# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log

# Test locally (optional)
firebase emulators:start --only functions
```

## Support
- Africa's Talking Documentation: https://developers.africastalking.com/
- Firebase Functions Guide: https://firebase.google.com/docs/functions