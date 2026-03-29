# Configure SMS API Key Securely

## Method 1: Firebase Functions Config (Recommended)

```bash
# Navigate to your project root
cd /path/to/your/queueflow-project

# Set the API key securely in Firebase
firebase functions:config:set africastalking.apikey="YOUR_ACTUAL_API_KEY_HERE"

# Verify it was set correctly
firebase functions:config:get

# Deploy functions with the new config
firebase deploy --only functions
```

## Method 2: Environment Variables (Alternative)

Create a `.env` file in your `functions` folder:

```bash
# functions/.env
AFRICASTALKING_API_KEY=YOUR_ACTUAL_API_KEY_HERE
AFRICASTALKING_USERNAME=sandbox
```

Then update `functions/index.js`:

```javascript
require('dotenv').config();

const credentials = {
  apiKey: process.env.AFRICASTALKING_API_KEY || 'fallback-key',
  username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
};
```

## Method 3: For Testing Only (Local Development)

If you just want to test locally, you can temporarily put the key directly in `functions/index.js`:

```javascript
const credentials = {
  apiKey: 'YOUR_SANDBOX_API_KEY_HERE', // Replace with actual key
  username: 'sandbox',
};
```

**⚠️ WARNING: Remove this before committing to Git!**

## Example API Keys

### Sandbox Key Format:
```
sandbox_api_key_1234567890abcdef1234567890abcdef12345678
```

### Production Key Format:
```
live_api_key_abcdef1234567890abcdef1234567890abcdef12
```

## Quick Test Commands

```bash
# Install functions dependencies
cd functions
npm install

# Test locally (if using Method 3)
firebase emulators:start --only functions

# Deploy to production
firebase deploy --only functions
```