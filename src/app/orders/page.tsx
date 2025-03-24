'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomerLayout from '@/components/customer/layout';
import { 
  Order, 
  OrderItem, 
  fetchUserOrders, 
  getStatusColor, 
  getStatusProgress, 
  getStatusStep,
  formatOrderDate
} from '../api/orders';
import MiniModelViewer from '@/components/customer/MiniModelViewer';
import { fetchProductById } from '@/app/api/products';
import { CustomizationDetail } from '@/contexts/CartContext';

// Extended OrderItem type to include customization details
interface ExtendedOrderItem {
  product_id: string;
  product_name?: string;
  quantity: number;
  price: number;
  subtotal: number;
  customization_price?: number;
  customization_details?: CustomizationDetail[];
  model_url?: string;
}

// Extended Order type to include custom models
interface ExtendedOrder extends Order {
  custom_model?: string;
  custom_models?: string[];
  items: ExtendedOrderItem[];
  total_customization_price?: number;
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [productModels, setProductModels] = useState<Record<string, string>>({});
  const [modelViewerUrl, setModelViewerUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const fetchedOrders = await fetchUserOrders();
        
        // Sort orders by date (newest first)
        const sortedOrders = fetchedOrders.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        // Extend orders with additional properties
        const extendedOrders: ExtendedOrder[] = await Promise.all(
          sortedOrders.map(async (order) => {
            // Extend order items with customization details
            const extendedItems: ExtendedOrderItem[] = await Promise.all(
              order.items.map(async (item) => {
                // Check if the item has customization details
                const customizationDetails = (item as any).customization_details;
                const customizationPrice = (item as any).customization_price;
                const modelUrl = (item as any).model_url;
                
                return {
                  ...item,
                  customization_details: customizationDetails,
                  customization_price: customizationPrice,
                  model_url: modelUrl
                };
              })
            );
            
            // Check if the order has custom models
            const customModel = (order as any).custom_model;
            const customModels = (order as any).custom_models;
            const totalCustomizationPrice = (order as any).total_customization_price;
            
            return {
              ...order,
              items: extendedItems,
              custom_model: customModel,
              custom_models: customModels,
              total_customization_price: totalCustomizationPrice
            };
          })
        );
        
        setOrders(extendedOrders);
        
        // Fetch product models
        const productIds = new Set<string>();
        extendedOrders.forEach(order => {
          order.items.forEach(item => {
            productIds.add(item.product_id);
          });
        });
        
        const productModelsMap: Record<string, string> = {};
        await Promise.all(
          Array.from(productIds).map(async (productId) => {
            try {
              const product = await fetchProductById(productId);
              if (product && product.model_url) {
                productModelsMap[productId] = product.model_url;
              }
            } catch (error) {
              console.error(`Error fetching product ${productId}:`, error);
            }
          })
        );
        
        setProductModels(productModelsMap);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load your orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // Get user data from localStorage on client side
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      setUserName(parsedUserData.name);
    }
    
    fetchOrders();
  }, []);
  
  const toggleOrderExpand = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };
  
  const handleViewModel = (modelUrl: string) => {
    setModelViewerUrl(modelUrl);
  };
  
  const closeModelViewer = () => {
    setModelViewerUrl(null);
  };
  
  // Helper function to check if an item is customized
  const isCustomizedItem = (productName?: string, item?: ExtendedOrderItem): boolean => {
    if (!productName) return false;
    if (productName.toLowerCase().includes('custom') || productName.toLowerCase().includes('customized')) return true;
    if (item?.customization_details && item.customization_details.length > 0) return true;
    if (item?.customization_price && item.customization_price > 0) return true;
    return false;
  };
  
  // Helper function to get the model URL for an item
  const getModelUrl = (productId: string, isCustomized: boolean, order: ExtendedOrder, item: ExtendedOrderItem) => {
    console.log('=== MODEL URL DEBUG ===');
    console.log('Item:', JSON.stringify({
      product_id: item.product_id,
      product_name: item.product_name,
      customization_price: item.customization_price,
      has_model_url: !!item.model_url,
      isCustomized
    }));
    console.log('Order custom data:', JSON.stringify({
      has_custom_model: !!order.custom_model,
      custom_model_url: order.custom_model,
      has_custom_models_array: !!order.custom_models,
      custom_models_count: order.custom_models?.length || 0,
      custom_models: order.custom_models
    }));
    
    // First priority: If the item has its own model_url
    if (item.model_url) {
      console.log(`Using item's model_url: ${item.model_url}`);
      return item.model_url;
    }
    
    // Second priority: If the order has a custom_model field directly from DynamoDB
    // AND this is the first item in the order (to avoid using the same model for all items)
    if (order.custom_model && order.items[0].product_id === item.product_id) {
      console.log(`Using order.custom_model from DynamoDB: ${order.custom_model}`);
      return order.custom_model;
    }
    
    // Third priority: If we have custom_models array in the order, try to match by product ID
    if (order.custom_models && order.custom_models.length > 0) {
      // Find the index of this item in the order items array
      const itemIndex = order.items.findIndex(orderItem => 
        orderItem.product_id === item.product_id && 
        orderItem.customization_price === item.customization_price
      );
      
      console.log('Item index in order:', itemIndex);
      console.log('Order items:', JSON.stringify(order.items.map(i => ({
        product_id: i.product_id,
        customization_price: i.customization_price
      }))));
      
      // If we found the item and there's a corresponding custom model, use it
      if (itemIndex >= 0 && itemIndex < order.custom_models.length) {
        console.log(`Using order's custom_models[${itemIndex}]: ${order.custom_models[itemIndex]}`);
        return order.custom_models[itemIndex];
      }
      
      // Fallback to the first custom model if we can't match by index
      if (isCustomized) {
        console.log(`Using order's first custom_model: ${order.custom_models[0]}`);
        return order.custom_models[0];
      }
    }
    
    // Fourth priority: Use the product's base model from our productModels map
    if (productModels[productId]) {
      console.log(`Using product's base model: ${productModels[productId]}`);
      return productModels[productId];
    }
    
    // Fallback model
    console.log('Using fallback model');
    return '/models/cachet_base.glb';
  };

  // Helper function to format product name
  const formatProductName = (item: ExtendedOrderItem) => {
    if (!item.product_name) {
      return `Product ${item.product_id}`;
    }
    
    // If it's already a customized name, return as is
    if (isCustomizedItem(item.product_name, item)) {
      return item.product_name;
    }
    
    // Otherwise, it's a regular product
    return item.product_name;
  };

  // Group orders by time period
  const categorizeOrders = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentOrders = orders.filter(order => new Date(order.created_at) >= oneWeekAgo);
    const pastMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate < oneWeekAgo && orderDate >= oneMonthAgo;
    });
    const olderOrders = orders.filter(order => new Date(order.created_at) < oneMonthAgo);
    
    return {
      recentOrders,
      pastMonthOrders,
      olderOrders
    };
  };
  
  const { recentOrders, pastMonthOrders, olderOrders } = categorizeOrders();
  
  return (
    <CustomerLayout userName={userName} activePage="orders">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold font-montreal mb-8 text-black">Your Orders</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-700 mb-8">
            <p>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-4 font-montreal text-black">No orders yet</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
            <Link href="/products" className="inline-block bg-black text-white px-6 py-3 rounded-sm font-montreal hover:bg-gray-800 transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Recent Orders (Last 7 days) */}
            {recentOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-montreal font-medium mb-4 pb-2 border-b border-gray-200">Recent Orders</h2>
                <div className="space-y-6">
                  {recentOrders.map((order) => (
                    <div 
                      key={order.order_id} 
                      className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
                      onClick={() => toggleOrderExpand(order.order_id)}
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                          <div className="flex-grow">
                            <div className="flex items-center mb-1">
                              <h3 className="text-lg font-montreal font-medium text-black mr-2">
                                Order #{order.order_id.slice(-8)}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-black text-white'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              {order.custom_models && order.custom_models.length > 0 && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Custom Model
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 font-montreal">
                              {formatOrderDate(order.created_at)}
                            </p>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex flex-col items-end">
                            <span className="font-medium text-black text-lg mb-2">
                              ${order.total_amount.toFixed(2)}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent the card click from triggering
                                toggleOrderExpand(order.order_id);
                              }}
                              className="text-gray-500 hover:text-black transition-colors flex items-center"
                              aria-label={expandedOrder === order.order_id ? "Collapse order details" : "Expand order details"}
                            >
                              <span className="mr-1 text-sm font-montreal">
                                {expandedOrder === order.order_id ? "Hide Details" : "View Details"}
                              </span>
                              {expandedOrder === order.order_id ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        {expandedOrder === order.order_id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {/* Checkpoint-style progress indicator */}
                            <div className="mb-8 mt-2">
                              <div className="relative px-6">
                                {/* Connecting line */}
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
                                
                                {/* Active progress line */}
                                {order.status !== 'cancelled' && (
                                  <div 
                                    className="absolute top-1/2 left-0 h-0.5 bg-black -translate-y-1/2 transition-all duration-500"
                                    style={{ 
                                      width: `${getStatusStep(order.status) === 1 ? 0 : 
                                              getStatusStep(order.status) === 2 ? 33.3 : 
                                              getStatusStep(order.status) === 3 ? 66.6 : 
                                              getStatusStep(order.status) === 4 ? 100 : 0}%` 
                                    }}
                                  ></div>
                                )}
                                
                                <div className="relative flex justify-between">
                                  {/* Pending Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 1 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-red-500 text-white border-red-500' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) > 1 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">1</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 1 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Pending</span>
                                  </div>
                                  
                                  {/* Processing Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 2 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-white text-gray-500 border-gray-300' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) > 2 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">2</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 2 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Processing</span>
                                  </div>
                                  
                                  {/* Shipped Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 3 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-white text-gray-500 border-gray-300' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) > 3 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">3</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 3 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Shipped</span>
                                  </div>
                                  
                                  {/* Delivered Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 4 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-white text-gray-500 border-gray-300' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) === 4 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">4</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 4 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Delivered</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Show cancelled status if applicable */}
                              {order.status === 'cancelled' && (
                                <div className="mt-6 bg-red-50 p-2 rounded-md">
                                  <p className="text-sm text-red-600 font-montreal text-center">
                                    This order has been cancelled
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="mb-6">
                              <h3 className="text-sm font-medium text-gray-500 mb-3 pb-2 border-b border-gray-200">Items Purchased</h3>
                              <div className="space-y-4">
                                {order.items.map((item, index) => (
                                  <div key={index} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                                    <div className="p-4">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                          <p className="font-medium text-gray-900 mb-1 flex items-center">
                                            {formatProductName(item)}
                                            {isCustomizedItem(item.product_name, item) && (
                                              <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                Customized
                                              </span>
                                            )}
                                            {getModelUrl(item.product_id, isCustomizedItem(item.product_name, item), order, item) && (
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation(); // Prevent the card click from triggering
                                                  console.log('\n\n===== VIEWING MODEL FOR ITEM =====');
                                                  console.log('Product ID:', item.product_id);
                                                  console.log('Product Name:', item.product_name);
                                                  console.log('Is Customized:', isCustomizedItem(item.product_name, item));
                                                  console.log('Item Position in Order:', order.items.findIndex(i => i.product_id === item.product_id));
                                                  console.log('Item has model_url:', !!item.model_url);
                                                  console.log('Order has custom_model:', !!order.custom_model);
                                                  console.log('Order has custom_models array:', !!order.custom_models);
                                                  console.log('Custom models count:', order.custom_models?.length || 0);
                                                  
                                                  const modelUrl = getModelUrl(item.product_id, isCustomizedItem(item.product_name, item), order, item);
                                                  console.log('Selected Model URL:', modelUrl);
                                                  handleViewModel(modelUrl);
                                                }}
                                                className="ml-2 text-gray-500 hover:text-gray-700"
                                                title="View 3D Model"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                              </button>
                                            )}
                                          </p>
                                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        
                                          {/* Safe check for customization details */}
                                          {item.customization_details && Array.isArray(item.customization_details) && item.customization_details.length > 0 ? (
                                            <div className="mt-1">
                                              <p className="text-xs text-gray-500 mb-1">Customization details:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {(() => {
                                                  // Store in a local variable to avoid TypeScript errors
                                                  const details = item.customization_details;
                                                  return details.map((detail, i) => (
                                                    <div key={i} className="flex items-center text-xs">
                                                      <span className="inline-block w-3 h-3 rounded-full mr-1" 
                                                            style={{ backgroundColor: detail && detail.color ? detail.color : '#ccc' }}></span>
                                                      <span>{detail && detail.partName ? detail.partName : 'Custom part'}</span>
                                                      {i < details.length - 1 && <span className="mx-1">•</span>}
                                                    </div>
                                                  ));
                                                })()}
                                              </div>
                                            </div>
                                          ) : item.customization_price && item.customization_price > 0 ? (
                                            <div className="mt-1">
                                              <p className="text-xs text-gray-500">Custom design applied</p>
                                            </div>
                                          ) : null}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm font-medium text-gray-900">Base: ${item.price.toFixed(2)}</p>
                                          {item.customization_price && item.customization_price > 0 && (
                                            <p className="text-xs text-blue-600">+${item.customization_price.toFixed(2)} customization</p>
                                          )}
                                          <p className="text-xs font-medium text-gray-900 mt-1">
                                            Subtotal: ${((item.price + (item.customization_price || 0)) * item.quantity).toFixed(2)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md mt-4">
                              <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                                <span className="font-montreal text-gray-600">Base Price</span>
                                <span className="font-montreal text-gray-600">${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                              </div>
                              {order.total_customization_price && order.total_customization_price > 0 && (
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                                  <span className="font-montreal text-gray-600">Customization</span>
                                  <span className="font-montreal text-gray-600">${order.total_customization_price.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-2">
                                <span className="font-montreal font-medium text-gray-900">Order Total</span>
                                <span className="font-montreal font-medium text-gray-900 text-lg">${order.total_amount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Past Month Orders */}
            {pastMonthOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-montreal font-medium mb-4 pb-2 border-b border-gray-200">Past Month</h2>
                <div className="space-y-6">
                  {pastMonthOrders.map((order) => (
                    <div 
                      key={order.order_id} 
                      className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
                      onClick={() => toggleOrderExpand(order.order_id)}
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                          <div className="flex-grow">
                            <div className="flex items-center mb-1">
                              <h3 className="text-lg font-montreal font-medium text-black mr-2">
                                Order #{order.order_id.slice(-8)}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-black text-white'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              {order.custom_models && order.custom_models.length > 0 && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Custom Model
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 font-montreal">
                              {formatOrderDate(order.created_at)}
                            </p>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex flex-col items-end">
                            <span className="font-medium text-black text-lg mb-2">
                              ${order.total_amount.toFixed(2)}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent the card click from triggering
                                toggleOrderExpand(order.order_id);
                              }}
                              className="text-gray-500 hover:text-black transition-colors flex items-center"
                              aria-label={expandedOrder === order.order_id ? "Collapse order details" : "Expand order details"}
                            >
                              <span className="mr-1 text-sm font-montreal">
                                {expandedOrder === order.order_id ? "Hide Details" : "View Details"}
                              </span>
                              {expandedOrder === order.order_id ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        {expandedOrder === order.order_id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {/* Checkpoint-style progress indicator */}
                            <div className="mb-8 mt-2">
                              <div className="relative px-6">
                                {/* Connecting line */}
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
                                
                                {/* Active progress line */}
                                {order.status !== 'cancelled' && (
                                  <div 
                                    className="absolute top-1/2 left-0 h-0.5 bg-black -translate-y-1/2 transition-all duration-500"
                                    style={{ 
                                      width: `${getStatusStep(order.status) === 1 ? 0 : 
                                              getStatusStep(order.status) === 2 ? 33.3 : 
                                              getStatusStep(order.status) === 3 ? 66.6 : 
                                              getStatusStep(order.status) === 4 ? 100 : 0}%` 
                                    }}
                                  ></div>
                                )}
                                
                                <div className="relative flex justify-between">
                                  {/* Pending Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 1 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-red-500 text-white border-red-500' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) > 1 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">1</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 1 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Pending</span>
                                  </div>
                                  
                                  {/* Processing Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 2 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-white text-gray-500 border-gray-300' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) > 2 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">2</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 2 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Processing</span>
                                  </div>
                                  
                                  {/* Shipped Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 3 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-white text-gray-500 border-gray-300' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) > 3 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">3</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 3 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Shipped</span>
                                  </div>
                                  
                                  {/* Delivered Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 4 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-white text-gray-500 border-gray-300' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) === 4 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">4</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 4 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Delivered</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Show cancelled status if applicable */}
                              {order.status === 'cancelled' && (
                                <div className="mt-6 bg-red-50 p-2 rounded-md">
                                  <p className="text-sm text-red-600 font-montreal text-center">
                                    This order has been cancelled
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="mb-6">
                              <h3 className="text-sm font-medium text-gray-500 mb-3 pb-2 border-b border-gray-200">Items Purchased</h3>
                              <div className="space-y-4">
                                {order.items.map((item, index) => (
                                  <div key={index} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                                    <div className="p-4">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                          <p className="font-medium text-gray-900 mb-1 flex items-center">
                                            {formatProductName(item)}
                                            {isCustomizedItem(item.product_name, item) && (
                                              <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                Customized
                                              </span>
                                            )}
                                            {getModelUrl(item.product_id, isCustomizedItem(item.product_name, item), order, item) && (
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation(); // Prevent the card click from triggering
                                                  console.log('\n\n===== VIEWING MODEL FOR ITEM =====');
                                                  console.log('Product ID:', item.product_id);
                                                  console.log('Product Name:', item.product_name);
                                                  console.log('Is Customized:', isCustomizedItem(item.product_name, item));
                                                  console.log('Item Position in Order:', order.items.findIndex(i => i.product_id === item.product_id));
                                                  console.log('Item has model_url:', !!item.model_url);
                                                  console.log('Order has custom_model:', !!order.custom_model);
                                                  console.log('Order has custom_models array:', !!order.custom_models);
                                                  console.log('Custom models count:', order.custom_models?.length || 0);
                                                  
                                                  const modelUrl = getModelUrl(item.product_id, isCustomizedItem(item.product_name, item), order, item);
                                                  console.log('Selected Model URL:', modelUrl);
                                                  handleViewModel(modelUrl);
                                                }}
                                                className="ml-2 text-gray-500 hover:text-gray-700"
                                                title="View 3D Model"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                              </button>
                                            )}
                                          </p>
                                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        
                                          {/* Safe check for customization details */}
                                          {item.customization_details && Array.isArray(item.customization_details) && item.customization_details.length > 0 ? (
                                            <div className="mt-1">
                                              <p className="text-xs text-gray-500 mb-1">Customization details:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {(() => {
                                                  // Store in a local variable to avoid TypeScript errors
                                                  const details = item.customization_details;
                                                  return details.map((detail, i) => (
                                                    <div key={i} className="flex items-center text-xs">
                                                      <span className="inline-block w-3 h-3 rounded-full mr-1" 
                                                            style={{ backgroundColor: detail && detail.color ? detail.color : '#ccc' }}></span>
                                                      <span>{detail && detail.partName ? detail.partName : 'Custom part'}</span>
                                                      {i < details.length - 1 && <span className="mx-1">•</span>}
                                                    </div>
                                                  ));
                                                })()}
                                              </div>
                                            </div>
                                          ) : item.customization_price && item.customization_price > 0 ? (
                                            <div className="mt-1">
                                              <p className="text-xs text-gray-500">Custom design applied</p>
                                            </div>
                                          ) : null}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm font-medium text-gray-900">Base: ${item.price.toFixed(2)}</p>
                                          {item.customization_price && item.customization_price > 0 && (
                                            <p className="text-xs text-blue-600">+${item.customization_price.toFixed(2)} customization</p>
                                          )}
                                          <p className="text-xs font-medium text-gray-900 mt-1">
                                            Subtotal: ${((item.price + (item.customization_price || 0)) * item.quantity).toFixed(2)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md mt-4">
                              <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                                <span className="font-montreal text-gray-600">Base Price</span>
                                <span className="font-montreal text-gray-600">${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                              </div>
                              {order.total_customization_price && order.total_customization_price > 0 && (
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                                  <span className="font-montreal text-gray-600">Customization</span>
                                  <span className="font-montreal text-gray-600">${order.total_customization_price.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-2">
                                <span className="font-montreal font-medium text-gray-900">Order Total</span>
                                <span className="font-montreal font-medium text-gray-900 text-lg">${order.total_amount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Older Orders */}
            {olderOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-montreal font-medium mb-4 pb-2 border-b border-gray-200">Older Orders</h2>
                <div className="space-y-6">
                  {olderOrders.map((order) => (
                    <div 
                      key={order.order_id} 
                      className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
                      onClick={() => toggleOrderExpand(order.order_id)}
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                          <div className="flex-grow">
                            <div className="flex items-center mb-1">
                              <h3 className="text-lg font-montreal font-medium text-black mr-2">
                                Order #{order.order_id.slice(-8)}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-black text-white'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              {order.custom_models && order.custom_models.length > 0 && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Custom Model
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 font-montreal">
                              {formatOrderDate(order.created_at)}
                            </p>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex flex-col items-end">
                            <span className="font-medium text-black text-lg mb-2">
                              ${order.total_amount.toFixed(2)}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent the card click from triggering
                                toggleOrderExpand(order.order_id);
                              }}
                              className="text-gray-500 hover:text-black transition-colors flex items-center"
                              aria-label={expandedOrder === order.order_id ? "Collapse order details" : "Expand order details"}
                            >
                              <span className="mr-1 text-sm font-montreal">
                                {expandedOrder === order.order_id ? "Hide Details" : "View Details"}
                              </span>
                              {expandedOrder === order.order_id ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        {expandedOrder === order.order_id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {/* Checkpoint-style progress indicator */}
                            <div className="mb-8 mt-2">
                              <div className="relative px-6">
                                {/* Connecting line */}
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
                                
                                {/* Active progress line */}
                                {order.status !== 'cancelled' && (
                                  <div 
                                    className="absolute top-1/2 left-0 h-0.5 bg-black -translate-y-1/2 transition-all duration-500"
                                    style={{ 
                                      width: `${getStatusStep(order.status) === 1 ? 0 : 
                                              getStatusStep(order.status) === 2 ? 33.3 : 
                                              getStatusStep(order.status) === 3 ? 66.6 : 
                                              getStatusStep(order.status) === 4 ? 100 : 0}%` 
                                    }}
                                  ></div>
                                )}
                                
                                <div className="relative flex justify-between">
                                  {/* Pending Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 1 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-red-500 text-white border-red-500' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) > 1 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">1</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 1 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Pending</span>
                                  </div>
                                  
                                  {/* Processing Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 2 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-white text-gray-500 border-gray-300' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) > 2 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">2</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 2 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Processing</span>
                                  </div>
                                  
                                  {/* Shipped Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 3 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-white text-gray-500 border-gray-300' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) > 3 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">3</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 3 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Shipped</span>
                                  </div>
                                  
                                  {/* Delivered Checkpoint */}
                                  <div className="flex flex-col items-center transition-transform hover:scale-110">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                                      getStatusStep(order.status) >= 4 
                                        ? 'bg-black text-white border-black' 
                                        : order.status === 'cancelled' 
                                          ? 'bg-white text-gray-500 border-gray-300' 
                                          : 'bg-white text-gray-500 border-gray-300'
                                    }`}>
                                      {getStatusStep(order.status) === 4 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <span className="text-xs">4</span>
                                      )}
                                    </div>
                                    <span className={`text-xs mt-2 font-montreal ${
                                      getStatusStep(order.status) >= 4 
                                        ? 'font-medium text-black' 
                                        : 'text-gray-500'
                                    }`}>Delivered</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Show cancelled status if applicable */}
                              {order.status === 'cancelled' && (
                                <div className="mt-6 bg-red-50 p-2 rounded-md">
                                  <p className="text-sm text-red-600 font-montreal text-center">
                                    This order has been cancelled
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="mb-6">
                              <h3 className="text-sm font-medium text-gray-500 mb-3 pb-2 border-b border-gray-200">Items Purchased</h3>
                              <div className="space-y-4">
                                {order.items.map((item, index) => (
                                  <div key={index} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                                    <div className="p-4">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                          <p className="font-medium text-gray-900 mb-1 flex items-center">
                                            {formatProductName(item)}
                                            {isCustomizedItem(item.product_name, item) && (
                                              <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                Customized
                                              </span>
                                            )}
                                            {getModelUrl(item.product_id, isCustomizedItem(item.product_name, item), order, item) && (
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation(); // Prevent the card click from triggering
                                                  console.log('\n\n===== VIEWING MODEL FOR ITEM =====');
                                                  console.log('Product ID:', item.product_id);
                                                  console.log('Product Name:', item.product_name);
                                                  console.log('Is Customized:', isCustomizedItem(item.product_name, item));
                                                  console.log('Item Position in Order:', order.items.findIndex(i => i.product_id === item.product_id));
                                                  console.log('Item has model_url:', !!item.model_url);
                                                  console.log('Order has custom_model:', !!order.custom_model);
                                                  console.log('Order has custom_models array:', !!order.custom_models);
                                                  console.log('Custom models count:', order.custom_models?.length || 0);
                                                  
                                                  const modelUrl = getModelUrl(item.product_id, isCustomizedItem(item.product_name, item), order, item);
                                                  console.log('Selected Model URL:', modelUrl);
                                                  handleViewModel(modelUrl);
                                                }}
                                                className="ml-2 text-gray-500 hover:text-gray-700"
                                                title="View 3D Model"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                              </button>
                                            )}
                                          </p>
                                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        
                                          {/* Safe check for customization details */}
                                          {item.customization_details && Array.isArray(item.customization_details) && item.customization_details.length > 0 ? (
                                            <div className="mt-1">
                                              <p className="text-xs text-gray-500 mb-1">Customization details:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {(() => {
                                                  // Store in a local variable to avoid TypeScript errors
                                                  const details = item.customization_details;
                                                  return details.map((detail, i) => (
                                                    <div key={i} className="flex items-center text-xs">
                                                      <span className="inline-block w-3 h-3 rounded-full mr-1" 
                                                            style={{ backgroundColor: detail && detail.color ? detail.color : '#ccc' }}></span>
                                                      <span>{detail && detail.partName ? detail.partName : 'Custom part'}</span>
                                                      {i < details.length - 1 && <span className="mx-1">•</span>}
                                                    </div>
                                                  ));
                                                })()}
                                              </div>
                                            </div>
                                          ) : item.customization_price && item.customization_price > 0 ? (
                                            <div className="mt-1">
                                              <p className="text-xs text-gray-500">Custom design applied</p>
                                            </div>
                                          ) : null}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm font-medium text-gray-900">Base: ${item.price.toFixed(2)}</p>
                                          {item.customization_price && item.customization_price > 0 && (
                                            <p className="text-xs text-blue-600">+${item.customization_price.toFixed(2)} customization</p>
                                          )}
                                          <p className="text-xs font-medium text-gray-900 mt-1">
                                            Subtotal: ${((item.price + (item.customization_price || 0)) * item.quantity).toFixed(2)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md mt-4">
                              <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                                <span className="font-montreal text-gray-600">Base Price</span>
                                <span className="font-montreal text-gray-600">${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                              </div>
                              {order.total_customization_price && order.total_customization_price > 0 && (
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                                  <span className="font-montreal text-gray-600">Customization</span>
                                  <span className="font-montreal text-gray-600">${order.total_customization_price.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-2">
                                <span className="font-montreal font-medium text-gray-900">Order Total</span>
                                <span className="font-montreal font-medium text-gray-900 text-lg">${order.total_amount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 3D Model Viewer Modal */}
        {modelViewerUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-white w-full max-w-4xl h-[80vh] flex flex-col">
              <div className="flex justify-between items-center p-4">
                <h3 className="text-xl font-montreal font-medium">3D Model Viewer</h3>
                <button 
                  onClick={closeModelViewer}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-grow bg-white relative">
                <div className="absolute inset-0">
                  <MiniModelViewer modelUrl={modelViewerUrl} size="large" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-center">
                  <p>Scroll to zoom • Click and drag to rotate the model</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default OrdersPage;