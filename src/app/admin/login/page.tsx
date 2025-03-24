// /Users/matt/springvalley/anik.3d/anik.3d-next/src/app/admin/login/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    id: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (error || success) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000); // Hide after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    setShowNotification(false);
    
    try {
      const response = await fetch('https://kebyzdods1.execute-api.us-east-2.amazonaws.com/dev/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.id,
          password: formData.password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid credentials. Please check your ID and password.');
        } else if (response.status === 404) {
          throw new Error('Admin ID not found. Please check your ID.');
        } else {
          throw new Error(data.message || 'Authentication failed. Please try again.');
        }
      }
      
      // Store admin ID in localStorage for future reference
      localStorage.setItem('adminId', data.admin_id);
      localStorage.setItem('isAdminLoggedIn', 'true');
      
      // Show success message
      setSuccess('Login successful! Redirecting to admin dashboard...');
      
      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 relative">
      {/* Floating notification banner in bottom right */}
      {showNotification && (error || success) && (
        <div 
          className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-sm shadow-md border border-black transition-all duration-300 ${
            error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
          }`}
          style={{ 
            maxWidth: '90%', 
            width: '350px',
            animation: 'slideIn 0.3s ease-out forwards'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {error ? (
                <div className="w-1 h-full bg-red-500 absolute left-0 top-0 bottom-0"></div>
              ) : (
                <div className="w-1 h-full bg-green-500 absolute left-0 top-0 bottom-0"></div>
              )}
              <p className="text-sm font-montreal text-black ml-2">
                {error || success}
              </p>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="ml-2 text-black hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          0% {
            transform: translateX(20px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <div className="w-full max-w-md border border-black rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 bg-white transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
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
          <h1 className="text-3xl font-bold text-black font-montreal">Admin Login</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-1">
            <label htmlFor="id" className="text-sm text-gray-600 font-montreal">ID</label>
            <input
              type="text"
              id="id"
              value={formData.id}
              onChange={handleChange}
              className="w-full px-0 py-3 bg-transparent border-b-2 border-black text-black focus:outline-none focus:border-gray-600 transition-colors font-montreal"
              placeholder="Enter Admin ID"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-gray-600 font-montreal">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-0 py-3 bg-transparent border-b-2 border-black text-black focus:outline-none focus:border-gray-600 transition-colors font-montreal"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className={`w-full py-3 border-b-2 border-black text-black font-montreal hover:bg-gray-50 transition-all ${isLoading ? 'animate-pulse' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Admin Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}