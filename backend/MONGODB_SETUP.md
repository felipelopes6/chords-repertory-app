# MongoDB Setup Guide (REQUIRED)

MongoDB is **required** to run this application. This guide will help you set up MongoDB Atlas free tier.

> ⚠️ **Important**: The app will not start without a valid `MONGODB_URL` in your environment.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create a Cluster

1. Once logged in, click **"Build a Database"**
2. Choose **"M0 FREE"** tier (no credit card required)
3. Select a cloud provider and region closest to your users
4. Name your cluster (e.g., "repertory-cluster")
5. Click **"Create Cluster"**

## Step 3: Create Database User

1. Click on **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., "repertory-user")
5. Generate a secure password (save it!)
6. Set privileges to **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Configure Network Access

1. Click on **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, restrict to Vercel's IP ranges
4. Click **"Confirm"**

## Step 5: Get Connection String

1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string (it looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update Local Environment

1. Open `backend/.env.local`
2. Replace the placeholder with your actual connection string:

   ```env
   MONGODB_URL=mongodb+srv://repertory-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/repertory-app?retryWrites=true&w=majority
   ```

   Replace:
   - `<username>` → `repertory-user` (your database username)
   - `<password>` → your actual password
   - Add `/repertory-app` before the `?` to specify the database name

3. Save the file

## Step 7: Test Locally

1. Start your backend server:

   ```bash
   cd backend
   npm run dev
   ```

2. Test the API (registration endpoint):

   ```bash
   curl -X POST http://localhost:3333/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"testpass123"}'
   ```

3. Check MongoDB Atlas:
   - Go to **"Database"** → **"Browse Collections"**
   - You should see the `repertory-app` database with `users` and `sessions` collections

## Step 8: Deploy to Vercel

1. Go to your Vercel backend project dashboard
2. Navigate to **"Settings"** → **"Environment Variables"**
3. Add a new environment variable:
   - **Name**: `MONGODB_URL`
   - **Value**: Your connection string (same as step 6)
   - **Environments**: Select **"Production"**, **"Preview"**, and **"Development"**
4. Click **"Save"**

5. Redeploy your backend:
   ```bash
   git add .
   git commit -m "feat: add MongoDB integration"
   git push origin main
   ```

## Step 9: Verify Production

1. Test your production API:

   ```bash
   curl https://chords-repertory-app-vsis.vercel.app/health
   ```

2. Try creating a user in production:
   ```bash
   curl -X POST https://chords-repertory-app-vsis.vercel.app/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"produser","password":"prodpass123"}'
   ```

## Troubleshooting

### Connection Timeout

- Make sure your IP is whitelisted in Network Access
- Verify the connection string is correct
- Check if the cluster is active

### Authentication Failed

- Double-check the username and password
- Ensure there are no special characters that need URL encoding in the password
- If password has special characters, URL encode them:
  - `@` → `%40`
  - `:` → `%3A`
  - `/` → `%2F`

### Database Not Found

- MongoDB creates databases automatically when you first write data
- Make sure you specified the database name in the connection string (e.g., `/repertory-app`)

## Production Security Best Practices

1. **Restrict Network Access**:
   - Remove "0.0.0.0/0" from Network Access
   - Add only Vercel's IP ranges

2. **Use Environment-Specific Clusters**:
   - Consider separate clusters for development and production

3. **Enable Monitoring**:
   - Set up alerts in MongoDB Atlas
   - Monitor slow queries and resource usage

4. **Regular Backups**:
   - MongoDB Atlas M0 (free tier) includes basic backups
   - For production, consider upgrading for continuous backups

## Data Migration from File Storage

If you have existing data in `backend/data/app-data.json`, you can migrate it:

```bash
# Create a migration script or manually import the data through MongoDB Compass
# Download MongoDB Compass: https://www.mongodb.com/products/compass
```

## Next Steps

✅ MongoDB is now configured!
✅ Your app will automatically use MongoDB in production (where `MONGODB_URL` is set)
✅ File storage still works locally if you don't set `MONGODB_URL`

For any issues, check the Vercel logs or MongoDB Atlas monitoring.
