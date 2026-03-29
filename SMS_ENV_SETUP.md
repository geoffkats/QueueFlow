# Simple SMS Setup (No Firebase Functions Required)

## Quick Setup for Development/Demo

Since you don't have a credit card for Firebase Blaze plan, we've set up a simple client-side SMS integration using environment variables.

### Step 1: Get Your Africa's Talking API Key
1. Sign up at [Africa's Talking](https://africastalking.com/)
2. Go to your dashboard
3. Copy your **Sandbox API Key** (it's free!)

### Step 2: Add API Key to .env File
Open the `.env` file in your project root and replace the placeholder:

```env
# Replace 'your_sandbox_api_key_here' with your actual API key
REACT_APP_AFRICASTALKING_API_KEY=your_actual_sandbox_api_key_here
REACT_APP_AFRICASTALKING_USERNAME=sandbox

# SMS Mode: 'demo' or 'production'
REACT_APP_SMS_MODE=demo
```

### Step 3: Test SMS Integration
1. Restart your development server: `npm start`
2. Go to Admin Dashboard → SMS Panel
3. Send a test message
4. Check browser console for SMS logs

### Step 4: Enable Real SMS (Optional)
To send actual SMS messages:
1. Set `REACT_APP_SMS_MODE=production` in `.env`
2. Restart the server
3. SMS will be sent via Africa's Talking API

## How It Works

### Demo Mode (Default)
- Shows browser notifications instead of real SMS
- Logs SMS details to console
- Perfect for hackathon demos
- No costs involved

### Production Mode
- Sends real SMS via Africa's Talking API
- Uses your sandbox credits
- Good for testing with real phone numbers

## Security Note

⚠️ **Important**: This client-side approach is for development/demo only. In production, you should:
1. Use Firebase Cloud Functions (server-side)
2. Never expose API keys in client code
3. Implement proper authentication

For now, this setup is perfect for your hackathon demo!

## Testing Phone Numbers

For sandbox testing, use these formats:
- Uganda: `+256701234567`
- Kenya: `+254701234567`
- Any valid international format

## Troubleshooting

### SMS Not Working?
1. Check console for error messages
2. Verify API key is correct in `.env`
3. Ensure phone number format is correct (+256...)
4. Check Africa's Talking dashboard for API usage

### Browser Notifications Not Showing?
1. Allow notifications when prompted
2. Check browser notification settings
3. Try refreshing the page

### API Key Not Loading?
1. Restart development server after changing `.env`
2. Check that `.env` is in project root
3. Verify no extra spaces in API key

## Quick Commands

```bash
# Restart server after .env changes
npm start

# Check if environment variables are loaded
# (Add console.log in smsService.js to verify)
```

## Demo Script for Judges

1. **Show SMS Panel**: Admin Dashboard → SMS Panel
2. **Send Test SMS**: Enter phone number and message
3. **Show Browser Notification**: Notification appears instantly
4. **Check Console**: Show detailed SMS logs
5. **Explain**: "In production, this sends real SMS via Africa's Talking API"

Perfect for hackathon demos without needing Firebase Blaze plan!