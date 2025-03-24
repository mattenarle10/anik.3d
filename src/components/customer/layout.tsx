'use client';
import { ReactNode } from 'react';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
  userName?: string;
  activePage?: 'products' | 'cart' | 'orders' | 'customize';
}

export default function CustomerLayout({ children, userName, activePage }: LayoutProps) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-white text-black">
        <CustomerNavbar userName={userName} activePage={activePage} />
        
        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        
        <CustomerFooter />
        <Toaster position="top-right" />
      </div>
    </CartProvider>
  );
}