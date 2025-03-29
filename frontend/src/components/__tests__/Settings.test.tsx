import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings } from '../Settings';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data
const mockSettings = {
  notifications_enabled: true,
  sound_enabled: false,
  voice_recognition_enabled: true,
  analytics_enabled: false,
  api_key: 'test-api-key',
  deepgram_api_key: 'test-deepgram-key',
};

// Create a new QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Wrapper component for testing
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const testQueryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Settings Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockedAxios.get.mockResolvedValue({ data: mockSettings });
    mockedAxios.put.mockResolvedValue({ data: mockSettings });
  });

  it('renders loading state initially', () => {
    render(<Settings />, { wrapper });
    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });

  it('renders settings sections after loading', async () => {
    render(<Settings />, { wrapper });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'General Settings' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Voice Recognition/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Analytics/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /API Settings/i })).toBeInTheDocument();
    });
  });

  it('displays correct initial values', async () => {
    render(<Settings />, { wrapper });
    
    await waitFor(() => {
      // Check toggle states
      expect(screen.getByRole('switch', { name: 'Enable Notifications' })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('switch', { name: 'Enable Sound' })).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('allows toggling settings', async () => {
    render(<Settings />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Enable Notifications' })).toHaveAttribute('aria-checked', 'true');
    });

    // Toggle notifications
    fireEvent.click(screen.getByRole('switch', { name: 'Enable Notifications' }));
    
    // Verify toggle state changed
    expect(screen.getByRole('switch', { name: 'Enable Notifications' })).toHaveAttribute('aria-checked', 'false');
  });

  it('allows updating API keys', async () => {
    render(<Settings />, { wrapper });
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'General Settings' })).toBeInTheDocument();
    });
    
    // Click on API Settings section
    fireEvent.click(screen.getByRole('button', { name: /API Settings/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    });

    // Update API key
    const apiKeyInput = screen.getByLabelText('API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'new-api-key' } });
    
    // Verify input value changed
    expect(apiKeyInput).toHaveValue('new-api-key');
  });

  it('saves changes successfully', async () => {
    render(<Settings />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Enable Notifications' })).toHaveAttribute('aria-checked', 'true');
    });

    // Make a change
    fireEvent.click(screen.getByRole('switch', { name: 'Enable Notifications' }));
    
    // Save changes
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    
    // Verify API call
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/settings', expect.any(Object));
    });
    
    // Verify success toast
    expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
  });

  it('handles save errors gracefully', async () => {
    // Mock API error
    mockedAxios.put.mockRejectedValueOnce(new Error('API Error'));
    
    render(<Settings />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Enable Notifications' })).toHaveAttribute('aria-checked', 'true');
    });

    // Make a change
    fireEvent.click(screen.getByRole('switch', { name: 'Enable Notifications' }));
    
    // Save changes
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    
    // Verify error toast
    await waitFor(() => {
      expect(screen.getByText('Failed to save settings')).toBeInTheDocument();
    });
  });

  it('cancels changes correctly', async () => {
    render(<Settings />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Enable Notifications' })).toHaveAttribute('aria-checked', 'true');
    });

    // Make a change
    fireEvent.click(screen.getByRole('switch', { name: 'Enable Notifications' }));
    
    // Cancel changes
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    
    // Verify toggle state reverted
    expect(screen.getByRole('switch', { name: 'Enable Notifications' })).toHaveAttribute('aria-checked', 'true');
  });

  it('navigates between sections correctly', async () => {
    render(<Settings />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'General Settings' })).toBeInTheDocument();
    });

    // Click on Voice Recognition section
    fireEvent.click(screen.getByRole('button', { name: /Voice Recognition/i }));
    
    // Verify section content changed
    expect(screen.getByText('Configure voice input and transcription settings')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Enable Voice Recognition' })).toBeInTheDocument();
  });

  it('maintains unsaved changes when switching sections', async () => {
    render(<Settings />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Enable Notifications' })).toHaveAttribute('aria-checked', 'true');
    });

    // Make a change
    fireEvent.click(screen.getByRole('switch', { name: 'Enable Notifications' }));
    
    // Switch to another section
    fireEvent.click(screen.getByRole('button', { name: /Voice Recognition/i }));
    
    // Switch back to General Settings
    fireEvent.click(screen.getByRole('button', { name: /General Settings/i }));
    
    // Verify change was maintained
    expect(screen.getByRole('switch', { name: 'Enable Notifications' })).toHaveAttribute('aria-checked', 'false');
  });
}); 