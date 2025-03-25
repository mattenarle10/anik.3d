// /src/components/admin/admin-header.tsx
'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminHeader() {
  const router = useRouter();
  
  const handleLogout = () => {
    localStorage.removeItem('adminId');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };
  
  return (
    <header className="py-4 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/admin/products" className="flex items-center">
            <Image 
              src="/images/anik-logo.png" 
              alt="Anik.3D Logo" 
              width={30} 
              height={30} 
              className="mr-2"
            />
            <span className="font-montreal text-xl font-bold text-black">Anik__3D Admin</span>
          </Link>
        </div>
        
        <div className="pr-4">
          <button 
            className="font-montreal text-black border-b border-black pb-1 hover:opacity-70 transition-opacity"
            onClick={handleLogout}
          >
            Signout
          </button>
        </div>
      </div>
    </header>
  );
}