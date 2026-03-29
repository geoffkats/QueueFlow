# Quick Test Guide - View Waiting Room Button

## Problem: Can't see "View Waiting Room" button on queue-status page

The button only appears when you have valid queue data. Here are 3 ways to test it:

## Method 1: Join Queue Properly (Recommended)
1. Go to `http://localhost:3000/`
2. Fill out the form completely:
   - Name: "Test User"
   - Phone: "+256701234567" 
   - Service Type: "Hospital Care"
   - Priority: "Normal"
3. Click "Join Queue"
4. You should see success modal with buttons
5. Click "Track My Position" → Should show queue-status with "View Waiting Room" button

## Method 2: Manual localStorage Setup (Quick Test)
1. Open browser console (F12)
2. Paste this code:
```javascript
// Set up fake user data
localStorage.setItem('queueUserId', 'test-user-123');
localStorage.setItem('userData', JSON.stringify({
  fullName: 'Test User',
  phoneNumber: '+256701234567',
  serviceType: 'hospital',
  priority: 'normal'
}));

// Reload page
window.location.reload();
```
3. Go to `http://localhost:3000/queue-status`
4. You should now see the "View Waiting Room" button

## Method 3: Direct Navigation Test
1. Go to `http://localhost:3000/display` directly
2. This is the waiting room display (works without joining queue)
3. This is what the button would take you to

## Expected Button Location
The "View Waiting Room" button should appear in the "Wait in Comfort" section:
- It's a blue button with a TV icon
- Located in the top-right of the "Wait in Comfort" card
- Next to the text "Visit our lounge or café while you wait"

## If Still Not Working
1. Check browser console for errors
2. Make sure you restarted the development server
3. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)
4. Clear browser cache and localStorage

## Alternative Access Points
Even if the button doesn't show, you can still access the waiting room:
- Direct URL: `http://localhost:3000/display`
- Navigation menu: Click floating nav button → "Professional TV Display"
- From success modal after joining queue

Let me know if you still don't see it after trying Method 1 or 2!