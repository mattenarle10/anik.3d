'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signUp, 
  signIn, 
  signOut, 
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  fetchUserAttributes,
  updateUserAttributes,
  getCurrentUser,
  fetchAuthSession,
  type AuthUser
} from 'aws-amplify/auth';

// Import the configuration from our utils file
import { configureAmplify } from '../utils/amplify-config';

// Initialize Amplify with our simplified configuration
configureAmplify();

// Define the shape of the auth context
interface AuthContextType {
  user: AuthUser | null;
  signUp: (username: string, password: string, attributes: { [key: string]: string }) => Promise<any>;
  signIn: (username: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<any>;
  forgotPassword: (username: string) => Promise<any>;
  forgotPasswordSubmit: (username: string, code: string, newPassword: string) => Promise<any>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  getUserAttributes: () => Promise<{ [key: string]: string }>;
  updateUserAttributes: (attributes: { [key: string]: string }) => Promise<boolean>;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  confirmSignUp: async () => {},
  forgotPassword: async () => {},
  forgotPasswordSubmit: async () => {},
  isAuthenticated: false,
  isLoading: true,
  error: null,
  getUserAttributes: async () => ({}),
  updateUserAttributes: async () => false
});

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    checkAuthState();
  }, []);

  // Check the current auth state
  const checkAuthState = async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  // Sign up a new user
  const handleSignUp = async (username: string, password: string, attributes: { [key: string]: string }) => {
    try {
      const result = await signUp({
        username,
        password,
        options: {
          userAttributes: attributes,
          autoSignIn: true
        }
      });
      return result;
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
      throw err;
    }
  };

  // Sign in a user
  const handleSignIn = async (username: string, password: string) => {
    try {
      const result = await signIn({ username, password });
      if (result.isSignedIn) {
        await checkAuthState();
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
      throw err;
    }
  };

  // Sign out the current user
  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign out');
      throw err;
    }
  };

  // Confirm sign up with verification code
  const handleConfirmSignUp = async (username: string, code: string) => {
    try {
      return await confirmSignUp({ username, confirmationCode: code });
    } catch (err: any) {
      setError(err.message || 'An error occurred during confirmation');
      throw err;
    }
  };

  // Initiate forgot password flow
  const handleForgotPassword = async (username: string) => {
    try {
      return await resetPassword({ username });
    } catch (err: any) {
      setError(err.message || 'An error occurred while resetting password');
      throw err;
    }
  };

  // Complete forgot password flow
  const handleForgotPasswordSubmit = async (username: string, code: string, newPassword: string) => {
    try {
      return await confirmResetPassword({
        username,
        confirmationCode: code,
        newPassword
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while confirming password reset');
      throw err;
    }
  };

  // Get user attributes
  const handleGetUserAttributes = async () => {
    try {
      return await fetchUserAttributes();
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching user attributes');
      throw err;
    }
  };

  // Update user attributes
  const handleUpdateUserAttributes = async (attributes: { [key: string]: string }) => {
    try {
      await updateUserAttributes({ userAttributes: attributes });
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating user attributes');
      throw err;
    }
  };

  const value = {
    user,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    confirmSignUp: handleConfirmSignUp,
    forgotPassword: handleForgotPassword,
    forgotPasswordSubmit: handleForgotPasswordSubmit,
    isAuthenticated,
    isLoading,
    error,
    getUserAttributes: handleGetUserAttributes,
    updateUserAttributes: handleUpdateUserAttributes
  };

  // Check if we have a valid configuration before rendering children
  if (isLoading) {
    return <div className="flex items-center justify-center p-4">Loading authentication...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use the auth context
export const useCognito = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useCognito must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component to wrap components that require authentication
export const withCognitoAuth = (Component: React.ComponentType<any>) => {
  return function WithAuthComponent(props: any) {
    const { isAuthenticated, isLoading } = useCognito();
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      // You could redirect to login page here
      return <div>Please log in to access this page</div>;
    }
    
    return <Component {...props} />;
  };
};

export default {
  useCognito,
  AuthProvider,
  withCognitoAuth,
};