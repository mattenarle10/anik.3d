'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../../components/customer/layout';
import Banner from '../../components/customer/Banner';
import { defaultFigurines } from '../../components/customer/FigurineData';
import ProductGrid from '../../components/customer/ProductGrid';
import { fetchProducts, Product as ApiProduct } from '../api/products';

// Define the Product interface for our components
interface Product {
  product_id: string;
  name: string;
  description: string;
  price: number;
  model_url: string;
  category?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Check if user is logged in
    const userToken = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    
    if (!userToken || !userData) {
      router.push('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Fetch products
      fetchProductData();
    } catch (err) {
      console.error('Error parsing user data:', err);
      router.push('/login');
    }
  }, [router]);
  
  const fetchProductData = async () => {
    try {
      const productsData = await fetchProducts();
      // Map the API response to match our ProductCardProps
      const formattedProducts = productsData.map((product: ApiProduct) => ({
        product_id: product.product_id,
        name: product.name,
        description: product.description,
        price: product.price,
        model_url: product.model_url,
        category: determineCategory(product),
        isNew: isNewProduct(product),
        isFeatured: isFeaturedProduct(product)
      }));
      setProducts(formattedProducts);
    } catch (err) {
      setError('Failed to load products. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper functions to determine product attributes
  const determineCategory = (product: ApiProduct): string => {
    // Logic to determine category - can be enhanced based on actual data
    if (product.product_id.includes('new')) return 'new';
    return 'popular';
  };
  
  const isNewProduct = (product: ApiProduct): boolean => {
    // Logic to determine if product is new - can be enhanced based on actual data
    return product.product_id.includes('new');
  };
  
  const isFeaturedProduct = (product: ApiProduct): boolean => {
    // Logic to determine if product is featured - can be enhanced based on actual data
    return product.product_id.includes('featured');
  };
  
  // Filter products based on selected category and search term
  const filteredProducts = products
    .filter(product => filter === 'all' || product.category === filter)
    .filter(product => 
      searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  return (
    <CustomerLayout userName={user?.name} activePage="products">
      <Banner 
        title="Discover 3D Aniks"
        subtitle="Make your 3D Anik unique"
        ctaText="Customize Now"
        ctaLink="/customize"
        bgColorFrom="gray-900"
        bgColorVia="black" 
        bgColorTo="gray-800"
        textGradientFrom="white"
        textGradientTo="gray-400"
        customFigurines={defaultFigurines}
      />
      
      <div className="mb-8">
        {/* Header and Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold font-montreal mb-4 md:mb-0 text-black">Our Products</h1>
          
          <div className="w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
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
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-sm transition-colors font-montreal ${
              filter === 'all' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All
          </button>
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
          <button 
            onClick={() => setFilter('new')}
            className={`px-4 py-2 rounded-sm transition-colors font-montreal ${
              filter === 'new' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            New
          </button>
        </div>
      </div>
      
      {/* Product Grid */}
      <ProductGrid 
        products={filteredProducts} 
        isLoading={isLoading} 
        error={error} 
      />
    </CustomerLayout>
  );
}