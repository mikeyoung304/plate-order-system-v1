# Deploying Plate Order System to Render

This guide will walk you through the process of deploying your Plate Order System to Render.com.

## Prerequisites

1. A GitHub account
2. A Render.com account (you can sign up for free at https://render.com)
3. Your Deepgram API key (for voice recognition features)

## Step 1: Push Your Code to GitHub

If you haven't already, push your code to a GitHub repository:

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Prepare for Render deployment"

# Add GitHub remote (replace with your GitHub username and repository name)
git remote add origin https://github.com/yourusername/plate-order-system.git

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy to Render

### Option 1: Deploy using render.yaml (Recommended)

1. Log in to your Render dashboard at https://dashboard.render.com
2. Click on the "Blueprint" option in the navigation menu
3. Click "New Blueprint Instance"
4. Connect your GitHub account if you haven't already
5. Select the repository containing your Plate Order System
6. Render will automatically detect the `render.yaml` file and configure your services
7. Click "Apply" to create the services defined in the YAML file
8. Set your environment variables:
   - `DEEPGRAM_API_KEY`: Your Deepgram API key
   - `ADMIN_PASSWORD`: A secure password for the admin interface

### Option 2: Manual Deployment

1. Log in to your Render dashboard at https://dashboard.render.com
2. Click the "New +" button and select "Web Service"
3. Connect your GitHub account if you haven't already
4. Select the repository containing your Plate Order System
5. Configure the following settings:
   - **Name**: plate-order-system (or any name you prefer)
   - **Environment**: Python
   - **Region**: Choose the region closest to your users
   - **Branch**: main (or your default branch)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Under "Environment Variables", add:
   - `DEEPGRAM_API_KEY`: Your Deepgram API key
   - `ADMIN_USERNAME`: admin
   - `ADMIN_PASSWORD`: A secure password for the admin interface
7. Click "Create Web Service"

## Step 3: Access Your Deployed Application

Once the deployment is complete (this may take a few minutes), you can access your application at the URL provided by Render, which will look something like:

```
https://plate-order-system.onrender.com
```

## Step 4: Set Up a Custom Domain (Optional)

If you want to use a custom domain for your application:

1. Go to your web service in the Render dashboard
2. Click on the "Settings" tab
3. Scroll down to the "Custom Domain" section
4. Click "Add Custom Domain"
5. Follow the instructions to configure your domain's DNS settings

## Troubleshooting

If you encounter any issues during deployment:

1. Check the build logs in the Render dashboard for error messages
2. Ensure all required environment variables are set correctly
3. Verify that your `requirements.txt` file includes all necessary dependencies
4. Check that your `Procfile` and `render.yaml` are correctly formatted

## Updating Your Application

To update your application after making changes:

1. Push your changes to GitHub
2. Render will automatically detect the changes and redeploy your application

## Database Considerations

The current setup uses SQLite, which is fine for development and light production use. However, for a more robust production environment, consider:

1. Migrating to a PostgreSQL database
2. Setting up database backups
3. Configuring connection pooling

## Security Recommendations

For a production deployment, consider implementing:

1. HTTPS (automatically provided by Render)
2. Rate limiting for API endpoints
3. Regular security audits
4. Monitoring and alerting