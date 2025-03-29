import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import TableManagement from '../TableManagement';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data
const mockLayout = {
  width: 800,
  height: 600,
  tables: [
    {
      id: 1,
      number: 1,
      type: 'standard',
      x: 100,
      y: 100,
      status: 'available',
      current_orders: 0,
      seats: 4,
      shape: 'square',
      width: 100,
      height: 100,
    },
  ],
};

describe('TableManagement', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock API responses
    mockedAxios.get.mockResolvedValue({ data: mockLayout });
    mockedAxios.post.mockResolvedValue({ data: { ...mockLayout.tables[0], id: 2 } });
    mockedAxios.put.mockResolvedValue({ data: mockLayout.tables[0] });
    mockedAxios.delete.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TableManagement />
      </QueryClientProvider>
    );
  };

  it('renders the table layout and add table button', async () => {
    renderComponent();

    // Check if the layout title is rendered
    expect(screen.getByText('Table Layout')).toBeInTheDocument();

    // Check if the add table button is rendered
    expect(screen.getByRole('button', { name: /add table/i })).toBeInTheDocument();

    // Wait for the table to be rendered
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
  });

  it('opens the add table modal when clicking the add table button', async () => {
    renderComponent();

    // Click the add table button
    fireEvent.click(screen.getByRole('button', { name: /add table/i }));

    // Check if the modal is opened
    expect(screen.getByText('Add New Table')).toBeInTheDocument();
  });

  it('creates a new table when submitting the add table form', async () => {
    renderComponent();

    // Open the add table modal
    fireEvent.click(screen.getByRole('button', { name: /add table/i }));

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/table number/i), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText(/number of seats/i), {
      target: { value: '6' },
    });
    
    // Select a shape using the dropdown
    const shapeSelect = screen.getByLabelText(/table shape/i);
    fireEvent.change(shapeSelect, {
      target: { value: 'circle' },
    });

    // Submit the form
    const submitButton = screen.getAllByRole('button', { name: /add table/i })[1];
    fireEvent.click(submitButton);

    // Verify the API call
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/tables', expect.objectContaining({
        number: 2,
        seats: 6,
        shape: 'circle',
      }));
    });
  });

  it('opens the edit modal when clicking a table', async () => {
    renderComponent();

    // Wait for the table to be rendered
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });

    // Click the table
    fireEvent.click(screen.getByText('Table 1'));

    // Check if the edit modal is opened
    expect(screen.getByText('Table 1 Details')).toBeInTheDocument();
  });

  it('updates table details when saving changes', async () => {
    renderComponent();

    // Wait for the table to be rendered and click it
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Table 1'));

    // Change the status
    fireEvent.change(screen.getByLabelText(/status/i), {
      target: { value: 'occupied' },
    });

    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    // Verify the API call
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/tables/1', expect.objectContaining({
        status: 'occupied',
      }));
    });
  });

  it('deletes a table when clicking the delete button', async () => {
    renderComponent();

    // Wait for the table to be rendered and click it
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Table 1'));

    // Click delete button
    fireEvent.click(screen.getByRole('button', { name: /delete table/i }));

    // Verify the API call
    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/tables/1');
    });
  });

  it('updates table position when dragging', async () => {
    renderComponent();

    // Wait for the table to be rendered
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });

    // Get the table element
    const tableElement = screen.getByText('Table 1').closest('.react-draggable');
    expect(tableElement).not.toBeNull();

    if (tableElement) {
      // Simulate drag sequence
      const startEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      });

      const moveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 200,
        clientY: 200,
      });

      const endEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: 200,
        clientY: 200,
      });

      // Fire events in sequence
      fireEvent(tableElement, startEvent);
      fireEvent(document, moveEvent);
      fireEvent(document, endEvent);

      // Verify the API call
      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith('/api/tables/1', expect.objectContaining({
          x: 200,
          y: 200,
        }));
      });
    }
  });
}); 