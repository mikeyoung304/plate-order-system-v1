import uvicorn
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    app_env = os.getenv("APP_ENV", "development")
    
    logger.info(f"Starting server on port {port} in {app_env} mode")
    
    # Determine reload setting based on environment
    reload = app_env == "development"
    
    # Start the application
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=reload,
        log_level="info",
        workers=1
    )
