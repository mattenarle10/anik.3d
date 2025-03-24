import Link from 'next/link';
import Image from 'next/image';

export default function AdminNavbar() {
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
          <span className="text-black text-xl font-bold">Anik__3D Admin</span>
        </Link>
      </div>

      <div className="flex gap-4 pr-8">
        <Link href="/" className="text-black hover:text-gray-600 transition-colors text-sm">Back to Site</Link>
      </div>
    </nav>
  );
}