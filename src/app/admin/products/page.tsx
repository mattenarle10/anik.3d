'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Product, fetchProducts } from '../../api/products';
import AddProductModal from '@/components/admin/AddProductModal';
import UpdateProductModal from '@/components/admin/UpdateProductModal';
import DeleteProductModal from '@/components/admin/DeleteProductModal';
import AddStockModal from '@/components/admin/AddStockModal';
import ViewModelModal from '@/components/admin/ViewModelModal';

export default function AdminProducts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [viewingModel, setViewingModel] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productToDeleteName, setProductToDeleteName] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

  useEffect(() => {
    // Check if admin is logged in
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    if (!isAdminLoggedIn) {
      router.push('/admin/login');
      return;
    }
    
    // Fetch products using the API service
    const getProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    getProducts();
  }, [router]);

  // Filter products when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  // Sort products based on sort configuration
  useEffect(() => {
    if (!sortConfig) return;
    
    const sortedProducts = [...filteredProducts].sort((a, b) => {
      if (sortConfig && sortConfig.key) {
        const aValue = a[sortConfig.key as keyof Product];
        const bValue = b[sortConfig.key as keyof Product];
        
        if (aValue !== undefined && bValue !== undefined) {
          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
        }
      }
      return 0;
    });
    
    setFilteredProducts(sortedProducts);
  }, [sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const handleViewModel = (modelUrl: string) => {
    setViewingModel(modelUrl);
  };

  const handleCloseModal = () => {
    setViewingModel(null);
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find(p => p.product_id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsUpdateModalOpen(true);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p.product_id === productId);
    if (product) {
      setProductToDelete(productId);
      setProductToDeleteName(product.name);
      setIsDeleteModalOpen(true);
    }
  };

  const handleAddStock = (productId: string) => {
    const product = products.find(p => p.product_id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsAddStockModalOpen(true);
    }
  };

  const handleProductCreated = (newProduct: Product) => {
    setProducts(prevProducts => [...prevProducts, newProduct]);
    setFilteredProducts(prevFiltered => [...prevFiltered, newProduct]);
  };
  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.product_id === updatedProduct.product_id ? updatedProduct : p
      )
    );
    setFilteredProducts(prevFiltered => 
      prevFiltered.map(p => 
        p.product_id === updatedProduct.product_id ? updatedProduct : p
      )
    );
  };
  
  const handleProductDeleted = (productId: string) => {
    setProducts(prevProducts => 
      prevProducts.filter(p => p.product_id !== productId)
    );
    setFilteredProducts(prevFiltered => 
      prevFiltered.filter(p => p.product_id !== productId)
    );
  };

  const copyProductId = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(productId)
      .then(() => {
        setCopiedProductId(productId);
        setTimeout(() => setCopiedProductId(null), 2000); // Reset after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy product ID:', err);
      });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Tab navigation */}
        <div className="flex border-b border-gray-100 mb-8">
          <div className="mr-8 pb-2 border-b-2 border-black font-montreal text-black">Products</div>
          <a href="/admin/orders" className="mr-8 pb-2 font-montreal text-black opacity-50">Orders</a>
          <a href="/admin/users" className="mr-8 pb-2 font-montreal text-black opacity-50">Users</a>
        </div>
        
        <div className="border border-black rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 bg-white">
          {/* Search skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="w-1/2 h-10 bg-gray-100 rounded-sm animate-pulse"></div>
            <div className="w-40 h-10 bg-gray-100 rounded-sm animate-pulse"></div>
          </div>
          
          {/* Table skeleton */}
          <div className="overflow-x-auto">
            <div className="w-full border-b border-gray-100 py-3"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full border-b border-gray-100 py-6 flex">
                <div className="w-1/4 h-6 bg-gray-100 rounded-sm animate-pulse mr-4"></div>
                <div className="w-1/6 h-6 bg-gray-100 rounded-sm animate-pulse mr-4"></div>
                <div className="w-1/12 h-6 bg-gray-100 rounded-sm animate-pulse mr-4"></div>
                <div className="w-1/3 h-6 bg-gray-100 rounded-sm animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Minimalist tab navigation */}
      <div className="flex border-b border-gray-100 mb-8">
        <Link href="/admin/products" className="mr-8 pb-2 border-b-2 border-black font-montreal text-black">
          Products
        </Link>
        <Link href="/admin/orders" className="mr-8 pb-2 border-b-0 font-montreal text-black opacity-50 hover:opacity-100 transition-opacity">
          Orders
        </Link>
        <Link href="/admin/users" className="mr-8 pb-2 border-b-0 font-montreal text-black opacity-50 hover:opacity-100 transition-opacity">
          Users
        </Link>
      </div>
      
      <div className="border border-black rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 bg-white">
        <div className="flex justify-between items-center mb-8">
          {/* Improved search bar */}
          <div className="relative w-1/2">
            <input
              type="text"
              placeholder="Find products by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-black font-montreal text-black placeholder-black placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <div className="absolute right-3 top-2.5 text-black">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Stylish Add product button */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2 bg-black text-white font-montreal hover:bg-white hover:text-black border border-black transition-colors rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            + Add Product
          </button>
        </div>
        
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-sm">
            <p className="font-montreal text-sm">{error}</p>
          </div>
        )}
        
        {filteredProducts.length === 0 && !error ? (
          <div className="py-8 text-center">
            <p className="text-lg font-montreal text-black">
              {searchTerm ? "No products match your search." : "No products found. Add your first product to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b border-black">
                  <th className="py-3 text-left font-montreal text-black bg-white">
                    ID
                  </th>
                  <th 
                    className="py-3 text-left font-montreal text-black cursor-pointer group bg-white"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Product
                      <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === 'name' ? 
                          (sortConfig.direction === 'asc' ? '↑' : '↓') : 
                          '↕'}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="py-3 text-left font-montreal text-black cursor-pointer group bg-white"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      Category
                      <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === 'category' ? 
                          (sortConfig.direction === 'asc' ? '↑' : '↓') : 
                          '↕'}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="py-3 text-left font-montreal text-black cursor-pointer group bg-white"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center">
                      Price
                      <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === 'price' ? 
                          (sortConfig.direction === 'asc' ? '↑' : '↓') : 
                          '↕'}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="py-3 text-left font-montreal text-black cursor-pointer group bg-white"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center">
                      Stock
                      <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === 'quantity' ? 
                          (sortConfig.direction === 'asc' ? '↑' : '↓') : 
                          '↕'}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 text-left font-montreal text-black bg-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.product_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 font-montreal text-black">
                      <div 
                        className="font-medium group relative flex items-center"
                        title="Click to copy product ID"
                      >
                        <span>{product.product_id.substring(0, 8)}...</span>
                        <button
                          onClick={(e) => copyProductId(product.product_id, e)}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                        </button>
                        {copiedProductId === product.product_id && (
                          <span className="absolute -top-8 left-0 bg-black text-white text-xs py-1 px-2 rounded-sm shadow-md z-10">
                            Copied!
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 font-montreal text-black">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-black opacity-60 mt-1">
                          {product.description.length > 60 
                            ? `${product.description.substring(0, 60)}...` 
                            : product.description}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-montreal text-black">
                      <span className="px-2 py-1 text-xs rounded-sm bg-gray-100 text-gray-800">
                        {product.category || 'default'}
                      </span>
                    </td>
                    <td className="py-4 font-montreal text-black">₱{product.price.toFixed(2)}</td>
                    <td className="py-4 font-montreal text-black">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs rounded-sm ${
                          product.quantity > 10 
                            ? 'bg-green-100 text-green-800' 
                            : product.quantity > 0 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {product.quantity} in stock
                        </span>
                        <button 
                          onClick={() => handleAddStock(product.product_id)}
                          className="ml-2 p-1 text-black hover:text-gray-700 transition-colors"
                          title="Add Stock"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleViewModel(product.model_url)}
                          className="p-1 text-black hover:text-gray-700 transition-colors"
                          title="View 3D Model"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleEditProduct(product.product_id)}
                          className="p-1 text-black hover:text-gray-700 transition-colors"
                          title="Edit Product"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.product_id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Delete Product"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ViewModelModal 
        isOpen={viewingModel !== null}
        onClose={() => setViewingModel(null)}
        modelUrl={viewingModel}
      />

      {/* Add Product Modal */}
      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onProductCreated={handleProductCreated} 
      />
      <UpdateProductModal 
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />

      <DeleteProductModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        productId={productToDelete}
        productName={productToDeleteName}
        onProductDeleted={handleProductDeleted}
      />

      {/* Add Stock Modal */}
      <AddStockModal 
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        product={selectedProduct}
        onStockUpdated={handleProductUpdated}
      />
    </div>
  );
}