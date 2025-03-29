import { describe, beforeEach, jest } from '@jest/globals';

describe('TableManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Add window.confirm mock
    window.confirm = jest.fn(() => true);
  });
}); 