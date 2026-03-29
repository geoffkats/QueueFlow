@echo off
echo 🚀 QueueFlow SMS Setup Script
echo.

echo Step 1: Installing Firebase Functions dependencies...
cd functions
call npm install
cd ..

echo.
echo Step 2: Configure your Africa's Talking API Key
echo.
echo Please get your API key from: https://africastalking.com
echo.
set /p API_KEY="Enter your Africa's Talking API Key: "

echo.
echo Step 3: Setting Firebase Functions config...
call firebase functions:config:set africastalking.apikey="%API_KEY%"
call firebase functions:config:set africastalking.username="sandbox"

echo.
echo Step 4: Verifying configuration...
call firebase functions:config:get

echo.
echo Step 5: Deploying functions...
call firebase deploy --only functions

echo.
echo ✅ SMS Setup Complete!
echo.
echo Next steps:
echo 1. Test SMS by joining a queue with your phone number
echo 2. Check Firebase Functions logs: firebase functions:log
echo 3. Monitor SMS delivery in the admin panel
echo.
pause