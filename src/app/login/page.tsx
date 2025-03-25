'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loginUser } from '../api/auth';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear error when user types
    if (error) setError(null);
  };

  // Function to handle error display with timeout
  const showError = (message: string) => {
    setError(message);
    // Auto-dismiss error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the real API endpoint
      await loginUser({
        email: formData.email,
        password: formData.password
      });
      
      // Show success message
      setSuccess('Login successful! Redirecting to products...');
      
      // Redirect to products page after a short delay
      setTimeout(() => {
        router.push('/products');
      }, 1500);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 relative">
      {/* Success toast notification */}
      {success && (
        <div className="fixed top-4 right-4 p-4 bg-black text-white rounded-sm shadow-lg z-50 flex items-center max-w-xs animate-slide-in">
          <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
          </svg>
          <p>{success}</p>
        </div>
      )}
      
      {/* Error toast notification with dismiss button */}
      {error && (
        <div className="fixed top-4 right-4 p-4 bg-black text-white rounded-sm shadow-lg z-50 flex items-center max-w-xs animate-slide-in">
          <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <p className="flex-1">{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="ml-2 text-gray-300 hover:text-white"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      )}
      
      <div className="w-full max-w-md border border-black rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 bg-white transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] relative">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block">
            <Image 
              src="/images/anik-logo.png" 
              alt="Anik.3D Logo" 
              width={40} 
              height={40} 
              className="mx-auto mb-4"
            />
          </Link>
          <h1 className="text-3xl font-bold text-black font-montreal">Login</h1>
        </div>
        
        {/* Admin login link */}
        <Link href="/admin/login" className="absolute top-4 right-4 text-xs text-gray-500 hover:text-black flex items-center">
          Admin Login
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 bg-black text-white font-medium rounded-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
          
          <div className="text-center text-sm">
            <span className="text-gray-600">Don&apos;t have an account?</span>{' '}
            <Link href="/signup" className="text-black font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}