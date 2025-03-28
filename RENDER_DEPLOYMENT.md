# Deploying to Render

## Prerequisites
1. Create a Render account at https://render.com
2. Connect your GitHub repository to Render

## Deployment Steps
1. In the Render dashboard, click "New" and select "Blueprint"
2. Select your GitHub repository
3. Render will detect the render.yaml file and configure the service
4. Set the following environment variables in the Render dashboard:
   - OPENAI_API_KEY: Your OpenAI API key
   - ADMIN_USERNAME: Admin username for the dashboard
   - ADMIN_PASSWORD: Admin password for the dashboard
5. Click "Apply" to deploy the application

## Important Notes
- Make sure your OpenAI API key has access to the Whisper API
- The application will run in production mode on Render
- The .env file is not included in the repository for security reasons
