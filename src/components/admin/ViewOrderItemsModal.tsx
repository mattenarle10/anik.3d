'use client';
import { useState, useEffect } from 'react';
import { fetchProductById } from '@/app/api/products';

interface OrderItem {
  product_id: string;
  product_name?: string;
  quantity: number;
  price: number;

  custom_model?: string;
  price_adjustment?: number;
  customization_details?: {
    parts: Array<{
      partName: string;
      color: string;
    }>;
  };
}

interface ProductDetails {
  product_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  model_url: string;
  category?: string;
}

interface ViewOrderItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  items: OrderItem[];
  customModelUrl?: string;
  customModelUrls?: string[];
  onViewModel?: (modelUrl: string | undefined) => void;
  total_amount: number;
}

export default function ViewOrderItemsModal({ 
  isOpen, 
  onClose, 
  orderId, 
  items,
  customModelUrl,
  customModelUrls,
  onViewModel,
  total_amount
}: ViewOrderItemsModalProps) {
  const [productDetails, setProductDetails] = useState<Map<string, ProductDetails>>(new Map());
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());
  const [missingProducts, setMissingProducts] = useState<Set<string>>(new Set());
  
  // Improved function to handle product fetching with better error handling
  const fetchProductWithErrorHandling = async (productId: string) => {
    try {
      // Direct fetch by ID
      const apiUrl = `https://kebyzdods1.execute-api.us-east-2.amazonaws.com/dev/products/${productId}`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const product = await response.json();
        return { productId, product, error: null };
      }
      
      // If we get a 404, try to fetch all products and find the one we need
      if (response.status === 404) {
        const allProductsResponse = await fetch('https://kebyzdods1.execute-api.us-east-2.amazonaws.com/dev/products');
        
        if (allProductsResponse.ok) {
          const allProducts = await allProductsResponse.json();
          const foundProduct = allProducts.find((p: any) => p.product_id === productId);
          
          if (foundProduct) {
            return { productId, product: foundProduct, error: null };
          }
        }
      }
      
      // If we couldn't find the product, return an error
      return { 
        productId, 
        product: null, 
        error: `Failed to fetch product. Status: ${response.status}` 
      };
    } catch (error) {
      // Handle any unexpected errors
      return { 
        productId, 
        product: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  // Function to handle opening the model viewer
  const handleViewModel = (productId: string) => {
    // First check if there's a custom model URL for this product in the order items
    const orderItem = items.find(item => item.product_id === productId);
    const product = productDetails.get(productId);
    
    // If this item has a custom model in the order item, use that
    if (orderItem && orderItem.custom_model) {
      console.log('Using custom model URL from order item:', orderItem.custom_model);
      if (onViewModel) {
        onViewModel(orderItem.custom_model);
      }
      return;
    }
    
    // If we have custom_models array, try to find a matching model for this product
    if (customModelUrls && customModelUrls.length > 0) {
      // Find the index of this item in the order items array
      const itemIndex = items.findIndex(item => item.product_id === productId);
      
      // If we found the item and there's a corresponding custom model, use it
      if (itemIndex >= 0 && itemIndex < customModelUrls.length) {
        console.log(`Using order's custom_models[${itemIndex}]:`, customModelUrls[itemIndex]);
        if (onViewModel) {
          onViewModel(customModelUrls[itemIndex]);
        }
        return;
      }
    }
    
    // If this is the first/only product and we have a custom model URL at the order level, use that
    if (customModelUrl && items.length > 0 && items[0].product_id === productId) {
      console.log('Using custom model URL from order object:', customModelUrl);
      if (onViewModel) {
        onViewModel(customModelUrl);
      }
      return;
    }
    
    // Otherwise fall back to the base product model URL
    if (product && product.model_url) {
      console.log('Using base product model URL:', product.model_url);
      if (onViewModel) {
        onViewModel(product.model_url);
      }
    }
  };

  // Function to handle opening a custom model from the order
  const handleCustomModel = (modelUrl: string) => {
    if (onViewModel) {
      onViewModel(modelUrl);
    }
  };

  // Effect to fetch product details when the modal is opened
  useEffect(() => {
    if (isOpen && items.length > 0) {
      const fetchAllProductDetails = async () => {
        // Create a new Set with all product IDs that need to be fetched
        const productIdsToFetch = new Set(items.map(item => item.product_id));
        
        // Mark all products as loading
        setLoadingProducts(new Set(productIdsToFetch));
        
        // Fetch details for each product using our improved function
        const productPromises = Array.from(productIdsToFetch).map(productId => 
          fetchProductWithErrorHandling(productId)
        );
        
        // Wait for all product details to be fetched
        const results = await Promise.allSettled(productPromises);
        
        // Update product details map
        const newProductDetails = new Map<string, ProductDetails>();
        const newMissingProducts = new Set<string>();
        
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { productId, product, error } = result.value;
            if (product && !error) {
              newProductDetails.set(productId, product);
            } else if (error) {
              // Ensure the product is marked as missing
              newMissingProducts.add(productId);
            }
          }
        });
        
        setProductDetails(newProductDetails);
        setMissingProducts(newMissingProducts);
        setLoadingProducts(new Set());
      };
      
      fetchAllProductDetails();
    }
  }, [isOpen, items]);

  // Helper function to get the product name
  const getProductName = (productId: string) => {
    if (productDetails.has(productId)) {
      return productDetails.get(productId)!.name;
    }
    
    if (missingProducts.has(productId)) {
      return `Product Deleted (ID: ${productId.substring(0, 8)}...)`;
    }
    
    return `Product #${productId.substring(0, 8)}...`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-sm max-w-5xl w-full max-h-[85vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-montreal font-bold text-black">
            Order Items <span className="text-sm opacity-70">#{orderId.substring(0, 8)}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-black hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Receipt-like layout */}
        <div className="border border-gray-200 rounded-sm overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 bg-gray-50 p-4 border-b border-gray-200 font-medium text-black">
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Subtotal</div>
          </div>
          
          {/* Items */}
          <div className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 p-4 hover:bg-gray-50">
                <div className="col-span-6 flex items-center">
                  <div className={missingProducts.has(item.product_id) ? "opacity-60" : ""}>
                    <div className="font-medium text-black">
                      {getProductName(item.product_id)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">ID: {item.product_id.substring(0, 8)}...</div>
                    
                    {/* Product details if available */}
                    {productDetails.has(item.product_id) && (
                      <div className="mt-1 text-xs text-gray-600">
                        {productDetails.get(item.product_id)?.category && (
                          <div className="text-xs text-gray-500">
                            Category: {productDetails.get(item.product_id)?.category}
                          </div>
                        )}
                        {productDetails.get(item.product_id)?.model_url && (
                          <button 
                            onClick={() => handleViewModel(item.product_id)}
                            className="text-gray-500 hover:text-gray-700 ml-2"
                            title="View 3D Model"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Display customization details if available */}
                    {item.customization_details && item.customization_details.parts && (
                      <div className="mt-2 text-xs">
                        <div className="font-medium text-gray-700">Customizations:</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.customization_details.parts.map((part, i) => (
                            <div key={i} className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-1" 
                                style={{ backgroundColor: part.color }}
                              ></div>
                              <span className="text-gray-600">{part.partName}</span>
                              {i < (item.customization_details?.parts?.length ?? 0) - 1 && <span className="mx-1">•</span>}
                            </div>
                          ))}
                        </div>
                        {item.price_adjustment && item.price_adjustment > 0 && (
                          <div className="text-gray-600 mt-1">
                            Customization cost: +${item.price_adjustment.toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {loadingProducts.has(item.product_id) && (
                    <span className="ml-2 inline-block w-4 h-4 border-2 border-gray-200 border-t-black rounded-full animate-spin"></span>
                  )}
                </div>
                <div className="col-span-2 text-center self-center font-montreal text-black">
                  {item.quantity}
                </div>
                <div className="col-span-2 text-right self-center font-montreal text-black">
                  ${item.price.toFixed(2)}
                </div>
                <div className="col-span-2 text-right self-center font-montreal font-medium text-black">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="border-t border-gray-200 p-4">
          {/* Calculate base price total and customization total */}
          {(() => {
            const baseTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const customizationTotal = items.reduce((sum, item) => sum + ((item.price_adjustment || 0) * item.quantity), 0);
            
            return (
              <>
                <div className="flex justify-between mb-2">
                  <span className="font-montreal text-black">Base Price:</span>
                  <span className="font-montreal text-black">${baseTotal.toFixed(2)}</span>
                </div>
                
                {customizationTotal > 0 && (
                  <div className="flex justify-between mb-2 text-gray-700">
                    <span className="font-montreal">Customization:</span>
                    <span className="font-montreal">${customizationTotal.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold mt-4 pt-2 border-t border-gray-200">
                  <span className="font-montreal text-black">Total:</span>
                  <span className="font-montreal text-black">${total_amount.toFixed(2)}</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}