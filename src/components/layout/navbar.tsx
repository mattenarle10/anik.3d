'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  
  // Don't render the navbar on admin pages or customer-facing pages
  if (pathname?.startsWith('/admin') || 
      pathname?.startsWith('/products') || 
      pathname?.startsWith('/cart') || 
      pathname?.startsWith('/customize') || 
      pathname?.startsWith('/profile') || 
      pathname?.startsWith('/orders')) {
    return null;
  }
  
  return (
    <nav className="w-full py-4 px-6 flex justify-between items-center bg-white shadow-sm font-montreal">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/images/anik-logo.png" 
            alt="Anik.3D Logo" 
            width={30} 
            height={30} 
            className="object-contain"
          />
          <span className="text-black text-xl font-bold">Anik__3D</span>
        </Link>
      </div>

      <div className="flex gap-4 pr-8">
        <Link href="/login" className="text-black hover:text-gray-600 transition-colors text-sm">Login</Link>
        <span className="text-gray-400 text-sm">or</span>
        <Link href="/signup" className="text-black hover:text-gray-600 transition-colors text-sm">Sign Up</Link>
      </div>
    </nav>
  );
}