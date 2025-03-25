'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AmplifyAuthenticator } from '../../components/AmplifyAuthenticator';

export default function CognitoLogin() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-6">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Login with Cognito
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Using AWS Cognito for secure authentication
          </p>
        </div>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Cognito Authenticator will handle the entire auth flow */}
          <AmplifyAuthenticator>
            <div className="mt-4">
              <p className="text-center text-green-600 font-semibold">
                You are now logged in with Cognito!
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/products')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Products
                </button>
              </div>
            </div>
          </AmplifyAuthenticator>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <Link href="/login">
                <button
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Traditional Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
