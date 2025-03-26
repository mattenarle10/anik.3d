'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../../components/customer/layout';
import { fetchProducts, Product as ApiProduct } from '../api/products';
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
  const [filter, setFilter] = useState('popular');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);

  // Get user data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserName(userData.name || userData.email);
          setUser(userData);
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
        const productsData = await fetchProducts();
        
        // Filter for products with model_url (customizable)
        const customizableProducts = productsData
          .filter((p: ApiProduct) => p.model_url)
          .map((product: ApiProduct) => ({
            product_id: product.product_id,
            name: product.name,
            description: product.description,
            price: product.price,
            model_url: product.model_url,
            category: determineCategory(product),
            isNew: isNewProduct(product),
            isFeatured: isFeaturedProduct(product),
            quantity: product.quantity,
            isCustomizable: true
          }));
        
        setProducts(customizableProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProductsData();
  }, []);

  // Helper functions to determine product attributes
  const determineCategory = (product: ApiProduct): string => {
    // Extract category from product name or use default
    const name = product.name.toLowerCase();
    if (name.includes('cachet')) return 'cachet';
    if (name.includes('tina')) return 'tina';
    if (name.includes('annika')) return 'annika';
    if (name.includes('steve')) return 'steve';
    if (name.includes('adam')) return 'adam';
    return 'other';
  };
  
  const isNewProduct = (product: ApiProduct): boolean => {
    return product.product_id.includes('new');
  };
  
  const isFeaturedProduct = (product: ApiProduct): boolean => {
    const name = product.name.toLowerCase();
    // Mark specific products as featured based on their exact names
    return (
      name === 'sassy cachet' ||
      name === 'walking tina' ||
      name === 'crouching tina' ||
      name === 'shy annika' ||
      name === 'sad annika' ||
      name === 'adam'
    );
  };

  // Get unique categories from products and sort them in the desired order
  const categories = Array.from(new Set(products.map(product => product.category)))
    .filter(cat => cat !== 'other' && cat !== undefined)
    .sort((a, b) => {
      const order = ['cachet', 'tina', 'annika', 'steve', 'adam'];
      return order.indexOf(a as string) - order.indexOf(b as string);
    }) as string[];

  // Filter products based on selected category and search term
  const filteredProducts = products
    .filter(product => {
      if (filter === 'popular') return false; // We'll handle popular products separately
      return product.category === filter;
    })
    .filter(product => 
      searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Get random popular products (limited to 6)
  const getRandomPopularProducts = () => {
    const popularProducts = products.filter(product => isFeaturedProduct(product as unknown as ApiProduct));
    const shuffled = [...popularProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
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

  const displayProducts = filter === 'popular' ? getRandomPopularProducts() : filteredProducts;

  return (
    <CustomerLayout userName={userName} activePage="customize">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero section */}
        <div className="text-center py-20 mb-10 bg-gradient-to-b from-gray-100 to-white rounded-sm">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold font-montreal mb-6 text-black tracking-tighter relative inline-block">
            <span className="relative z-10">MAKE YOUR OWN.</span>
            <span className="absolute -bottom-2 left-0 w-full h-3 bg-black opacity-10 z-0"></span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto font-montreal text-lg md:text-xl">
            Select a product below to start customizing. Make it uniquely yours with our powerful customization tools.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-black rounded-full animate-pulse delay-100"></div>
            <div className="w-2 h-2 bg-black rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
        
        {/* Header and Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold font-montreal mb-4 md:mb-0 text-black">Customize Your Own</h1>
          
          <div className="w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-4 py-2 pr-10 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-montreal text-black"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => setFilter('popular')}
            className={`px-4 py-2 rounded-sm transition-colors font-montreal ${
              filter === 'popular' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Popular
          </button>
          {categories.map(category => (
            <button 
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-sm transition-colors font-montreal capitalize ${
                filter === category 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {displayProducts.map((product) => (
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
            <h2 className="text-2xl font-bold font-montreal mb-4">No Models Found</h2>
            <p className="text-gray-600 mb-6">
              {filter !== 'popular' 
                ? `No customizable models found in the "${filter}" category.` 
                : 'No customizable models found.'}
            </p>
            <button
              onClick={() => setFilter('popular')}
              className="px-6 py-2 bg-black text-white rounded-sm font-montreal transition-colors hover:bg-gray-800"
            >
              View Popular Models
            </button>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}