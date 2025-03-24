// /src/app/admin/orders/layout.tsx
import type { Metadata } from "next";
import "../../globals.css";
import AdminHeader from "../../../components/admin/admin-header";

export const metadata: Metadata = {
  title: "Anik.3D Admin - Orders",
  description: "Admin orders management for Anik.3D",
};

export default function AdminOrdersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-montreal antialiased bg-white min-h-screen">
      <AdminHeader />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}