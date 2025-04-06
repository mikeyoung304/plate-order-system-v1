# Deploying to Render

This guide provides step-by-step instructions for deploying the Plate Order System to Render.com.

## Prerequisites

1. A Render.com account
2. Your GitHub repository with the enhanced Plate Order System code
3. A Deepgram API key for voice recognition

## Deployment Steps

### 1. Fork or Push the Repository

Ensure your enhanced Plate Order System code is in a GitHub repository that you own. You can either:
- Fork the original repository
- Push the enhanced code to your own repository

### 2. Connect to Render

1. Log in to your Render account at https://dashboard.render.com/
2. Click on the "New +" button and select "Blueprint" from the dropdown menu
3. Connect your GitHub account if you haven't already
4. Select the repository containing your Plate Order System code
5. Render will automatically detect the `render.yaml` file and configure your services

### 3. Configure Environment Variables

During the deployment setup, you'll need to configure the following environment variables:

- `SECRET_KEY`: A secure random string for JWT encryption
- `DEEPGRAM_API_KEY`: Your Deepgram API key for voice recognition

You can set these in the Render dashboard under the Environment section of your service.

### 4. Deploy the Application

1. Review the configuration settings
2. Click "Create Blueprint" to start the deployment process
3. Render will automatically build and deploy your application
4. Once deployment is complete, you can access your application at the provided URL

### 5. Verify the Deployment

1. Access the application URL provided by Render
2. Navigate to the `/health` endpoint to verify the application is running correctly
3. Test the voice-to-order functionality on your iOS device

## Updating Your Deployment

When you push changes to your GitHub repository, Render will automatically rebuild and deploy your application if you have auto-deploy enabled in the `render.yaml` file.

## Troubleshooting

If you encounter issues during deployment:

1. Check the build logs in the Render dashboard
2. Verify that all environment variables are correctly set
3. Ensure your repository contains all the necessary files
4. Check that the database connection is working properly

## Additional Configuration

### Custom Domains

To use a custom domain with your Render deployment:

1. Go to your service in the Render dashboard
2. Navigate to the "Settings" tab
3. Scroll down to the "Custom Domain" section
4. Follow the instructions to add and verify your domain

### SSL Certificates

Render automatically provisions SSL certificates for all services, including custom domains.

### Scaling

To scale your application:

1. Go to your service in the Render dashboard
2. Navigate to the "Settings" tab
3. Scroll to the "Instance Type" section
4. Select a different plan based on your needs

## Support

If you need additional help with your Render deployment, you can:

1. Consult the Render documentation at https://render.com/docs
2. Contact Render support through their dashboard
3. Reach out to the Plate Order System development team for application-specific issues
