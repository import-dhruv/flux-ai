# Vercel Deployment Configuration Guide

## Issue

Getting 404 NOT_FOUND because Vercel is trying to deploy from root instead of the client directory.

## Solution

### Step 1: Update Vercel Project Settings (Dashboard)

Go to your Vercel dashboard: https://vercel.com

1. Navigate to your project: **flux-ai**
2. Go to **Settings** > **General**
3. Update the following:

   **Root Directory:** `client`

   - Click "Edit" next to "Root Directory"
   - Enter: `client`
   - Save

   **Build & Development Settings:**

   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Click **Save**

### Step 2: Redeploy

After saving the settings:

1. Go to **Deployments** tab
2. Click the **"..." menu** on the latest deployment
3. Select **Redeploy**
4. Check "Use existing Build Cache" (optional)
5. Click **Redeploy**

### Step 3: Environment Variables

Make sure you have set the following environment variables in Vercel:

- `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- Any other API keys or environment variables your app needs

To add environment variables:

1. Go to **Settings** > **Environment Variables**
2. Add each variable with its value
3. Select all environments (Production, Preview, Development)
4. Save

## Alternative: If the above doesn't work

If Vercel settings don't resolve it, you can also:

1. Create a new Vercel project
2. Import your GitHub repo again
3. During setup, specify the root directory as `client`
4. Set framework as Vite
5. Add environment variables
6. Deploy

## Verify Deployment

After redeploying, check:

- Build logs should show it's building from the client directory
- Output should show files being uploaded from `client/dist`
- Site should load without 404 errors
