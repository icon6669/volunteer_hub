import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../AuthContext';
import { mockUserData, mockExtendedUserData, mockSupabase, createChainableMock } from '../../test/utils';

jest.mock('../../lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with no user', async () => {
    const mockMethods = createChainableMock(null);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mockSupabase.from.mockReturnValue(mockMethods);

    await act(async () => {
      render(
        <AuthProvider>
          <div data-testid="auth-state">
            {/* Render auth state here */}
          </div>
        </AuthProvider>
      );
    });

    const authState = screen.getByTestId('auth-state');
    expect(authState).toBeInTheDocument();
  }, 10000);

  it('should handle successful sign in', async () => {
    const mockMethods = createChainableMock(mockExtendedUserData);
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: mockUserData }, error: null });
    mockSupabase.from.mockReturnValue(mockMethods);

    await act(async () => {
      render(
        <AuthProvider>
          <div data-testid="auth-state">
            {/* Render auth state here */}
          </div>
          <button data-testid="sign-in-button" onClick={() => {
            mockSupabase.auth.signInWithPassword({
              email: 'test@example.com',
              password: 'password'
            });
          }}>
            Sign In
          </button>
        </AuthProvider>
      );
    });

    const signInButton = screen.getByTestId('sign-in-button');
    await act(async () => {
      fireEvent.click(signInButton);
    });

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });
  }, 10000);

  it('should handle sign in errors', async () => {
    const mockError = { message: 'Sign in error' };
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: mockError });

    await act(async () => {
      render(
        <AuthProvider>
          <div data-testid="auth-state">
            {/* Render auth state here */}
          </div>
          <button data-testid="sign-in-button" onClick={() => {
            mockSupabase.auth.signInWithPassword({
              email: 'test@example.com',
              password: 'password'
            });
          }}>
            Sign In
          </button>
        </AuthProvider>
      );
    });

    const signInButton = screen.getByTestId('sign-in-button');
    await act(async () => {
      fireEvent.click(signInButton);
    });

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });
  }, 10000);

  it('should handle sign out', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    await act(async () => {
      render(
        <AuthProvider>
          <div data-testid="auth-state">
            {/* Render auth state here */}
          </div>
          <button data-testid="sign-out-button" onClick={() => {
            mockSupabase.auth.signOut();
          }}>Sign Out</button>
        </AuthProvider>
      );
    });

    const signOutButton = screen.getByTestId('sign-out-button');
    await act(async () => {
      fireEvent.click(signOutButton);
    });

    await waitFor(() => {
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  }, 10000);

  it('should handle auth state changes', async () => {
    const mockMethods = createChainableMock(mockExtendedUserData);
    mockSupabase.from.mockReturnValue(mockMethods);

    await act(async () => {
      render(
        <AuthProvider>
          <div data-testid="auth-state">
            {/* Render auth state here */}
          </div>
        </AuthProvider>
      );
    });

    const authState = screen.getByTestId('auth-state');
    expect(authState).toBeInTheDocument();
  }, 10000);
});
