from fastapi.openapi.utils import get_openapi
from fastapi import FastAPI

def custom_openapi(app: FastAPI):
    """
    Customize the OpenAPI schema for better documentation
    """
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description="""
        # Plate Order System API
        
        This API provides endpoints for managing restaurant orders, tables, and voice processing.
        
        ## Features
        
        * Voice-to-text order processing
        * Table and floor plan management
        * Order tracking and management
        * Resident profiles and preferences
        
        ## Authentication
        
        Most endpoints require authentication. Use the /auth/token endpoint to obtain a JWT token.
        """,
        routes=app.routes,
    )
    
    # Add security scheme
    openapi_schema["components"] = {
        "securitySchemes": {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            }
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema
