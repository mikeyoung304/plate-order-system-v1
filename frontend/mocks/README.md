# Frontend Mock Data Implementation

This directory contains mock data implementations to decouple the frontend from the backend. The mocked data allows the frontend to function independently while the backend is being rewritten.

## Files

- `mockData.ts` - Contains all mock data and API functions to simulate backend responses.

## Implementation Details

The following backend dependencies have been replaced with mock implementations:

1. **API Endpoints**:
   - `/api/v1/floor-plans/{id}/tables` - Get and update tables for floor plans
   - `/api/v1/orders` - Get and create orders
   - `/api/v1/speech/transcribe` - Transcribe speech to text

2. **Components Updated**:
   - `floor-plan-view.tsx` - Now uses mock API for fetching tables
   - `floor-plan-editor.tsx` - Uses mock API for loading and saving tables
   - `voice-order-panel.tsx` - Uses mock transcription service
   - `kitchen/page.tsx` - Uses mock API for fetching orders
   - `server/page.tsx` - Uses mock API for creating orders

3. **Services**:
   - `supabaseClient.ts` - Replaced with a mock client that doesn't connect to Supabase

## How to Use

The mock data system works automatically without any additional configuration. The frontend will use the mock data instead of making actual API calls to the backend.

When the backend is ready, you can revert these changes by:

1. Restoring the original API calls in the components
2. Restoring the real Supabase client
3. Removing the mock data implementations

## Adding More Mock Data

To add more mock data:

1. Add new mock objects or functions to `mockData.ts`
2. Update the corresponding components to use the mock data 