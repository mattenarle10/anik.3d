'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Authenticator,
  ThemeProvider,
  Heading,
  Button,
  Text,
  View,
  Flex,
  Image as AmplifyImage,
} from '@aws-amplify/ui-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import '@aws-amplify/ui-react/styles.css';

// Import Amplify and our config
import { Amplify } from 'aws-amplify';
import { signUp } from 'aws-amplify/auth';
import { configureAmplify } from '../utils/amplify-config';

// Custom theme to match the application's design
const theme = {
  name: 'anik-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: '#f5f5f5',
          20: '#e6e6e6',
          40: '#cdcdcd',
          60: '#999999',
          80: '#666666',
          90: '#333333',
          100: '#000000',
        },
      },
    },
    components: {
      button: {
        primary: {
          backgroundColor: { value: '{colors.brand.primary.100}' },
          _hover: {
            backgroundColor: { value: '{colors.brand.primary.90}' },
          },
        },
      },
      authenticator: {
        router: {
          borderWidth: '0',
          shadow: 'none',
        },
      },
    },
  },
};

const CognitoAuthPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  
  // Handle post-authentication redirection
  const handleAuthSuccess = useCallback(() => {
    console.log('Auth success, redirecting to products');
    router.push('/products');
  }, [router]);

  // Client-side mounting with explicit configuration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Explicitly configure Amplify in this component
        console.log('Configuring Amplify directly in CognitoAuthPage');
        
        // Hard-coded values to ensure consistent behavior
        Amplify.configure({
          Auth: {
            Cognito: {
              userPoolId: 'us-east-2_i8caRIoEH',
              userPoolClientId: '684uag9acvpmr2u36rba77elgm',
              // Explicitly configure for email login only
              loginWith: {
                email: true,
                username: false,
                phone: false
              }
            }
          }
        });
        
        console.log('Amplify configured successfully');
        setIsMounted(true);
      } catch (error) {
        console.error('Error configuring Amplify:', error);
        setConfigError(error instanceof Error ? error.message : 'Unknown error configuring Amplify');
      }
    }
  }, []);

  // Only render on client-side to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p>Loading authentication...</p>
      </div>
    );
  }
  
  // Show error if configuration failed
  if (configError) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="max-w-md p-4 bg-white rounded shadow">
          <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="mb-4">{configError}</p>
          <p className="mb-4">User Pool ID: {process.env.NEXT_PUBLIC_USER_POOL_ID || 'us-east-2_i8caRIoEH'}</p>
          <p className="mb-4">Client ID: {process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '684uag9acvpmr2u36rba77elgm'}</p>
          <button 
            onClick={() => router.push('/products')}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Return to Products
          </button>
        </div>
      </div>
    );
  }

  // Custom components for the Authenticator
  const components = {
    Header() {
      return (
        <Flex direction="column" justifyContent="center" alignItems="center" gap="1rem" padding="1rem">
          <div className="relative w-[100px] h-[100px]">
            <Image
              alt="Anik.3D Logo"
              src="/images/logo-big.png"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <Heading level={3}>Anik.3D</Heading>
          <Text>Sign in to your account</Text>
        </Flex>
      );
    },
    Footer() {
      return (
        <View textAlign="center" padding="1rem">
          <Text>&copy; {new Date().getFullYear()} Anik.3D. All rights reserved.</Text>
        </View>
      );
    },
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="w-full max-w-md">
        <ThemeProvider theme={theme}>
          <Authenticator 
            components={components}
            loginMechanisms={['email']}
            signUpAttributes={['name', 'phone_number']}
            initialState="signUp"
            services={{
              async validateCustomSignUp(formData) {
                // Create a random username that's not an email format
                const randomUsername = `user_${Math.floor(Math.random() * 1000000)}`;
                console.log('Using random username:', randomUsername);
                return { username: randomUsername };
              }
            }}
          >
            {({ signOut, user }) => {
              // Check for successful authentication and redirect
              useEffect(() => {
                if (user) {
                  // Get user details - email is used for login
                  console.log('Cognito user authenticated successfully', user);
                  // Add a small delay to ensure the UI updates first
                  setTimeout(() => {
                    handleAuthSuccess();
                  }, 1500);
                }
              }, [user]);

              return (
                <Flex direction="column" alignItems="center" padding="2rem" gap="1rem">
                  <Heading level={3}>Welcome!</Heading>
                  <Text>You are now signed in with Cognito.</Text>
                  <Flex gap="1rem" marginTop="1rem">
                    <Button variation="primary" onClick={signOut}>
                      Sign Out
                    </Button>
                    <Button variation="link" onClick={() => router.push('/products')}>
                      Go to Products
                    </Button>
                  </Flex>
                </Flex>
              );
            }}
          </Authenticator>
        </ThemeProvider>
      </div>
    </div>
  );
};

export default CognitoAuthPage;