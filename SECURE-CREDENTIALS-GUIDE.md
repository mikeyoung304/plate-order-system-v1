# Secure Credentials Guide

## Overview of Changes

This guide explains recent security improvements made to protect API keys and credentials in the plate-order system. The following changes have been implemented:

1. Removed hardcoded API keys from configuration files
2. Created a secure environment variable handling system
3. Updated `.gitignore` to prevent committing sensitive information
4. Created clear documentation for credential management

## Current Environment Files

- `.env.example`: Contains placeholder values and serves as a template
- `.env`: Contains placeholder values and should be used during development
- `.env.secure`: Contains actual credentials, should NOT be committed to version control

## External Service Credentials

The following external service credentials have been secured:

1. **Supabase**
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_SUPABASE_SERVICE_KEY (when needed)

2. **Deepgram** (Voice/Speech-to-text)
   - DEEPGRAM_API_KEY

3. **OpenAI** (Alternative speech transcription)
   - OPENAI_API_KEY

## Setting Up Your Development Environment

1. Copy `.env.secure` to `.env` on your local machine when developing
2. Add any new API keys/credentials to both `.env.secure` and `.env.example` (using placeholders in the example)
3. NEVER commit `.env` or `.env.secure` files to version control
4. When adding new services requiring credentials, follow this pattern:
   - Use environment variables in code
   - Update both `.env.example` and documentation

## Deployment Considerations

When deploying to production environments:

1. Use environment variables or secrets management services provided by your hosting platform
2. Never hardcode credentials in application code or configuration files
3. Consider using secret rotation for added security
4. Set appropriate access controls for production credentials

## Code Examples

All code in the project is now using environment variables properly:

```typescript
// frontend/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

```python
# backend/app/domain/services/deepgram_service.py
from app.core.config import settings

class DeepgramService:
    def __init__(self, websocket_callback=None):
        self.api_key = settings.DEEPGRAM_API_KEY
        # Rest of initialization...