import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";
import { SectionNavigationWrapper } from "../components/layout/section-navigation";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "react-hot-toast";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Anik.3D - 3D Printed Figurines",
  description: "High-quality 3D printed figurines and collectibles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-montreal antialiased bg-black text-white">
        <CartProvider>
          <Navbar />
          <SectionNavigationWrapper />
          <main>
            {children}
          </main>
          <Footer />
          <Toaster position="top-right" />
          
          {/* Freshchat Widget */}
          <script
            src='//au.fw-cdn.com/20903352/333760.js'
            data-chat='true'
          ></script>
        </CartProvider>
      </body>
    </html>
  );
}
