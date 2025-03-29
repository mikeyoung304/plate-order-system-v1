import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { Settings } from '../Settings';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
    jest.clearAllMocks();
    // Mock initial settings data
    mockedAxios.get.mockResolvedValue({
      data: {
        notifications_enabled: true,
        sound_enabled: false,
        voice_recognition_enabled: true,
        analytics_enabled: false,
        api_key: 'test-api-key'
      }
    });
  });

  it('renders all settings sections', async () => {
    render(<Settings />, { wrapper });
    
    await waitFor(() => {
      // Wait for loading to finish
      expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      
      // Check for section buttons in the sidebar
      expect(screen.getByRole('button', { name: /General Settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /API Settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Voice Recognition/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Analytics/i })).toBeInTheDocument();
    });
  });

  it('allows toggling notification settings', async () => {
    render(<Settings />, { wrapper });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /Enable Notifications/i })).toBeInTheDocument();
    });

    const notificationsSwitch = screen.getByRole('switch', { name: /Enable Notifications/i });
    fireEvent.click(notificationsSwitch);
    expect(notificationsSwitch).toHaveAttribute('aria-checked', 'false');
  });

  it('allows updating API keys', async () => {
    render(<Settings />, { wrapper });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
    });
    
    // Click on API Settings section
    fireEvent.click(screen.getByRole('button', { name: /API Settings/i }));
    
    await waitFor(() => {
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    });

    const apiKeyInput = screen.getByLabelText('API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    expect(apiKeyInput).toHaveValue('test-api-key');
  });

  it('saves changes successfully', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: {
        notifications_enabled: false,
        sound_enabled: false,
        voice_recognition_enabled: true,
        analytics_enabled: false,
        api_key: 'test-api-key'
      }
    });

    render(<Settings />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /Enable Notifications/i })).toBeInTheDocument();
    });

    // Make a change
    fireEvent.click(screen.getByRole('switch', { name: /Enable Notifications/i }));
    
    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/settings', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Settings saved successfully');
    });
  });

  it('handles save errors gracefully', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('Failed to save'));

    render(<Settings />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /Enable Notifications/i })).toBeInTheDocument();
    });

    // Make a change
    fireEvent.click(screen.getByRole('switch', { name: /Enable Notifications/i }));
    
    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/settings', expect.any(Object));
      expect(toast.error).toHaveBeenCalledWith('Failed to save settings');
    });
  });
}); 