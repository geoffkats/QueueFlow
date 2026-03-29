# Deploying QueueFlow to Vercel

## Prerequisites
- Vercel account (free tier works)
- Firebase project with credentials

## Step 1: Connect Repository to Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository: `geoffkats/QueueFlow`
4. Vercel will auto-detect it's a Create React App

## Step 2: Configure Environment Variables

In your Vercel project settings, add these environment variables:

```
REACT_APP_FIREBASE_API_KEY=your_actual_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### How to Add Environment Variables in Vercel:

1. Go to your project in Vercel dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in the sidebar
4. Add each variable one by one:
   - Name: `REACT_APP_FIREBASE_API_KEY`
   - Value: Your actual Firebase API key
   - Environment: Select "Production", "Preview", and "Development"
5. Click "Save"
6. Repeat for all variables

## Step 3: Deploy

1. Click "Deploy" in Vercel
2. Vercel will build and deploy your app
3. You'll get a URL like: `https://queue-flow.vercel.app`

## Step 4: Update Firebase Configuration

In your Firebase Console:
1. Go to Authentication → Settings → Authorized domains
2. Add your Vercel domain (e.g., `queue-flow.vercel.app`)

## Troubleshooting

### Build Fails with "Module not found: Error: Can't resolve './config'"
- Make sure `src/firebase/config.js` is committed to the repository
- The file should use `process.env.REACT_APP_*` variables

### App loads but Firebase doesn't work
- Check that all environment variables are set in Vercel
- Make sure variable names start with `REACT_APP_`
- Redeploy after adding environment variables

### "Firebase: Error (auth/unauthorized-domain)"
- Add your Vercel domain to Firebase authorized domains
- Go to Firebase Console → Authentication → Settings → Authorized domains

## Local Development

For local development, you have two options:

### Option 1: Use .env file (Recommended)
Create a `.env` file in the root directory:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
# ... etc
```

### Option 2: Use config.js directly
Edit `src/firebase/config.js` and replace the placeholder values with your actual Firebase credentials.

**Note**: Never commit real credentials to the repository!

## Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Add the custom domain to Firebase authorized domains

## Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create a pull request

Every commit triggers a new deployment!
