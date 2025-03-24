'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

interface NavbarProps {
  userName?: string;
  activePage?: 'products' | 'cart' | 'orders' | 'customize';
}

export default function CustomerNavbar({ userName, activePage }: NavbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { itemCount } = useCart(); // Get cart items and itemCount
  const [mounted, setMounted] = useState(false);
  
  // Only show cart count after component has mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleSignOut = () => {
    // Clear user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Redirect to login page
    router.push('/login');
  };
  
  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo - links to products page */}
        <Link href="/products" className="flex items-center space-x-2">
          <Image 
            src="/images/anik-logo.png" 
            alt="Anik.3D Logo" 
            width={32} 
            height={32} 
          />
          <span className="font-bold text-xl font-montreal">Anik.3D</span>
        </Link>
        
        {/* Main Navigation */}
        <nav className="hidden md:flex space-x-8">
          <Link 
            href="/products" 
            className={`font-medium ${activePage === 'products' ? 'text-black border-b-2 border-black' : 'text-gray-600 hover:text-black'} font-montreal`}
          >
            Products
          </Link>
          <Link 
            href="/customize" 
            className={`font-medium ${activePage === 'customize' ? 'text-black border-b-2 border-black' : 'text-gray-600 hover:text-black'} font-montreal`}
          >
            Customize
          </Link>
          <Link 
            href="/orders" 
            className={`font-medium ${activePage === 'orders' ? 'text-black border-b-2 border-black' : 'text-gray-600 hover:text-black'} font-montreal`}
          >
            Orders
          </Link>
        </nav>
        
        {/* Right Side - Cart, User, Dropdown */}
        <div className="flex items-center space-x-6">
          {/* Cart Icon with Item Count */}
          <Link 
            href="/cart" 
            className={`relative ${activePage === 'cart' ? 'text-black' : 'text-gray-600 hover:text-black'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {mounted && itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
          
          {/* User Greeting and Dropdown */}
          {userName && (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 text-sm text-gray-700 font-montreal focus:outline-none"
              >
                <span className="hidden md:inline">Hello, {userName.split(' ')[0]}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-sm shadow-lg z-50">
                  <div className="py-1">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-montreal"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button 
                      onClick={() => {
                        setDropdownOpen(false);
                        handleSignOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-montreal"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}