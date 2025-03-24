'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../../components/customer/layout';
import { fetchProducts } from '../api/products';
import CustomizeCard from '@/components/customer/CustomizeCard';

// Define the Product interface
interface Product {
  product_id: string;
  name: string;
  description: string;
  price: number;
  model_url?: string;
  image_url?: string;
  quantity: number;
  category?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isCustomizable?: boolean;
}

export default function CustomizationPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Get user data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserName(userData.name || userData.email);
        }
      } catch (error) {
        console.error('Error retrieving user data:', error);
      }
    }
  }, []);

  // Fetch products data
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const allProducts = await fetchProducts();
        
        // For now, assume all products with a model_url are customizable
        // In a real implementation, you might have a specific flag for customizable products
        const customizableProducts = allProducts.filter((p: Product) => p.model_url);
        setProducts(customizableProducts);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(customizableProducts.map((p: Product) => p.category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProductsData();
  }, []);

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  // Handle category selection
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  // Navigate to product customization page
  const handleCustomizeProduct = (productId: string) => {
    router.push(`/customize/${productId}`);
  };

  if (loading) {
    return (
      <CustomerLayout userName={userName} activePage="customize">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout userName={userName} activePage="customize">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold font-montreal mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout userName={userName} activePage="customize">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold font-montreal mb-4 text-black tracking-tighter">MAKE YOUR OWN.</h1>
          <p className="text-gray-600 max-w-2xl mx-auto font-montreal">
            Select a product below to start customizing. Make it uniquely yours with our powerful customization tools.
          </p>
        </div>

        {/* Products grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProducts.map((product) => (
              <CustomizeCard
                key={product.product_id}
                product_id={product.product_id}
                name={product.name}
                price={product.price}
                model_url={product.model_url}
                category={product.category}
                onClick={handleCustomizeProduct}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold font-montreal mb-4">No Products Found</h2>
            <p className="text-gray-600 mb-6">
              {selectedCategory 
                ? `No customizable products found in the "${selectedCategory}" category.` 
                : 'No customizable products found.'}
            </p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-6 py-2 bg-black text-white rounded-sm font-montreal transition-colors hover:bg-gray-800"
              >
                View All Products
              </button>
            )}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}