/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BearerTokenDialog } from '../BearerTokenDialog';

describe('BearerTokenDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnTokenSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should not render when open is false', () => {
      const { container } = render(
        <BearerTokenDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when open is true', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByLabelText('Bearer Token')).toBeInTheDocument();
    });

    it('should render with default implementation', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      expect(screen.getByPlaceholderText('Enter your bearer token')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Authenticate')).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should update token value when typing', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const input = screen.getByLabelText('Bearer Token') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test-token' } });

      expect(input.value).toBe('test-token');
    });

    it('should have password type input', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const input = screen.getByLabelText('Bearer Token');
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('Submit Behavior', () => {
    it('should disable submit button when token is empty', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const submitButton = screen.getByText('Authenticate');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when token has value', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const input = screen.getByLabelText('Bearer Token');
      fireEvent.change(input, { target: { value: 'test-token' } });

      const submitButton = screen.getByText('Authenticate');
      expect(submitButton).not.toBeDisabled();
    });

    it('should call onTokenSubmit with trimmed token on submit', async () => {
      mockOnTokenSubmit.mockResolvedValue(undefined);

      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const input = screen.getByLabelText('Bearer Token');
      fireEvent.change(input, { target: { value: '  test-token  ' } });

      const submitButton = screen.getByText('Authenticate');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnTokenSubmit).toHaveBeenCalledWith('test-token');
      });
    });

    it('should show loading state during submission', async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnTokenSubmit.mockReturnValue(submitPromise);

      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const input = screen.getByLabelText('Bearer Token');
      fireEvent.change(input, { target: { value: 'test-token' } });

      const submitButton = screen.getByText('Authenticate');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      });

      resolveSubmit!();
    });
  });

  describe('Cancel Behavior', () => {
    it('should call onOpenChange(false) when cancel is clicked', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange(false) when overlay is clicked', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const overlay = document.querySelector('.bearer-token-dialog-overlay');
      fireEvent.click(overlay!);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not close when clicking dialog content', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const dialog = document.querySelector('.bearer-token-dialog');
      fireEvent.click(dialog!);

      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
          error="Invalid token"
        />
      );

      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });

    it('should not display error when error is null', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
          error={null}
        />
      );

      const errorElement = screen.queryByRole('alert');
      expect(errorElement).not.toBeInTheDocument();
    });
  });

  describe('Render Props', () => {
    it('should use custom render function when provided', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
          render={({ token, setToken, handleSubmit, handleCancel }) => (
            <div data-testid="custom-dialog">
              <input
                data-testid="custom-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <button data-testid="custom-cancel" onClick={handleCancel}>
                Custom Cancel
              </button>
              <button data-testid="custom-submit" onClick={handleSubmit}>
                Custom Submit
              </button>
            </div>
          )}
        />
      );

      expect(screen.getByTestId('custom-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('custom-input')).toBeInTheDocument();
      expect(screen.getByText('Custom Cancel')).toBeInTheDocument();
      expect(screen.getByText('Custom Submit')).toBeInTheDocument();
    });

    it('should provide correct render props', () => {
      const renderSpy = jest.fn(() => <div>Custom</div>);

      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
          error="Test error"
          loading={false}
          render={renderSpy}
        />
      );

      expect(renderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          token: '',
          setToken: expect.any(Function),
          handleSubmit: expect.any(Function),
          handleCancel: expect.any(Function),
          error: 'Test error',
          isLoading: false,
          isValid: false,
          inputRef: expect.any(Object),
        })
      );
    });

    it('should handle custom submit in render props', async () => {
      mockOnTokenSubmit.mockResolvedValue(undefined);

      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
          render={({ token, setToken, handleSubmit }) => (
            <div>
              <input
                data-testid="custom-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <button data-testid="custom-submit" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          )}
        />
      );

      const input = screen.getByTestId('custom-input');
      fireEvent.change(input, { target: { value: 'custom-token' } });

      const submitButton = screen.getByTestId('custom-submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnTokenSubmit).toHaveBeenCalledWith('custom-token');
      });
    });
  });

  describe('State Management', () => {
    it('should reset token when dialog closes', () => {
      const { rerender } = render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const input = screen.getByLabelText('Bearer Token') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'test-token' } });
      expect(input.value).toBe('test-token');

      rerender(
        <BearerTokenDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      rerender(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const newInput = screen.getByLabelText('Bearer Token') as HTMLInputElement;
      expect(newInput.value).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria attributes', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
          error="Test error"
        />
      );

      const input = screen.getByLabelText('Bearer Token');
      expect(input).toHaveAttribute('aria-describedby', 'token-error');
    });

    it('should not have aria-describedby when no error', () => {
      render(
        <BearerTokenDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onTokenSubmit={mockOnTokenSubmit}
        />
      );

      const input = screen.getByLabelText('Bearer Token');
      expect(input).not.toHaveAttribute('aria-describedby');
    });
  });
});
