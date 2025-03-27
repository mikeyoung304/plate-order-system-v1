import uvicorn
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8000))
    
    # Get environment
    env = os.environ.get("ENVIRONMENT", "development")
    
    # Log startup info
    logger.info(f"Starting server on port {port} in {env} mode")
    
    # Set reload based on environment
    reload = env == "development"
    
    # Run the app
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=reload,
        log_level="info"
    )
