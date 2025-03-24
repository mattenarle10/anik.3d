// /Users/matt/springvalley/anik.3d/anik.3d-next/src/app/admin/login/layout.tsx
import type { Metadata } from "next";
import "../../globals.css";
import AdminNavbar from "../../../components/layout/admin-navbar";

export const metadata: Metadata = {
  title: "Anik.3D Admin - Dashboard",
  description: "Admin dashboard for Anik.3D",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-montreal antialiased bg-white">
      <AdminNavbar />
      <main>
        {children}
      </main>
    </div>
  );
}