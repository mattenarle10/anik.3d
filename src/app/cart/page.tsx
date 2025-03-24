'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import OrderSuccessModal from '@/components/customer/OrderSuccessModal';
import MiniModelViewer from '@/components/customer/MiniModelViewer';
import CustomerLayout from '@/components/customer/layout';
import { createOrder, generateOrderUploadUrl } from '@/app/api/orders';

const CartPage = () => {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const router = useRouter();

  // Get user data from localStorage on client side
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      setUserName(parsedUserData.name);
    }
    setMounted(true);
  }, []);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setUploadProgress(0);
    setErrorDetails(null);

    try {
      // Check if there are any customized items
      const customizedItems = items.filter(item => item.isCustomized);
      let customModelFile = undefined;

      // If there are customized items, use the customized model URL
      if (customizedItems.length > 0) {
        try {
          setUploadProgress(10);
          console.log('Processing customized items:', customizedItems.length);

          // Create a JSON file with customization data for reference
          const customizationData = JSON.stringify(
            customizedItems.map(item => ({
              productId: item.productId,
              name: item.name,
              modelUrl: item.modelUrl, // This should now be the customized model URL
              customizations: item.customizations,
              totalCustomizationPrice: item.totalCustomizationPrice
            }))
          );

          // Generate a unique filename
          const fileName = `order_customization_${Date.now()}.json`;

          console.log('Generating upload URL for customization data:', fileName);
          setUploadProgress(20);

          // Get a presigned URL for uploading the customization data
          const uploadData = await generateOrderUploadUrl(fileName, 'application/json');
          console.log('Received presigned URL:', uploadData.uploadUrl);
          setUploadProgress(30);

          // Upload the customization data using PUT request with the presigned URL
          console.log('Uploading customization data...');
          if (!uploadData.uploadUrl) {
            throw new Error('Failed to get a valid upload URL');
          }
          
          const uploadResponse = await fetch(uploadData.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: customizationData
          });

          if (!uploadResponse.ok) {
            console.error('Upload failed with status:', uploadResponse.status);
            const errorText = await uploadResponse.text().catch(() => 'No error details available');
            const errorMessage = `Failed to upload customization data: ${uploadResponse.status} - ${errorText}`;
            console.error(errorMessage);
            
            if (uploadResponse.status === 403) {
              console.error('This is likely a signature mismatch or S3 permissions issue.');
              console.error('S3 error details:', errorText);
            }
            
            setErrorDetails(errorMessage);
            throw new Error(errorMessage);
          }

          setUploadProgress(50);
          console.log('Customization data uploaded successfully to:', uploadData.modelUrl);

          // Collect all customized model URLs instead of just the first one
          const customModelFiles = customizedItems
            .filter(item => item.modelUrl && item.modelUrl.includes('customized_'))
            .map(item => ({
              file: item.modelUrl!, // Use non-null assertion as we've filtered for non-null values
              file_name: item.modelUrl!.split('/').pop() || `customized_${item.productId}.glb`
            }));

          console.log(`Found ${customModelFiles.length} customized model URLs`);
          
          // Verify each model URL is accessible
          for (const modelFile of customModelFiles) {
            try {
              const modelResponse = await fetch(modelFile.file, { method: 'HEAD' });
              if (!modelResponse.ok) {
                console.warn(`Model URL returned ${modelResponse.status}. This might cause issues later.`);
              } else {
                console.log('✅ Model URL is accessible:', modelFile.file);
              }
            } catch (modelCheckError) {
              console.warn('Could not verify model URL accessibility:', modelCheckError);
            }
          }

          if (customModelFiles.length > 0) {
            if (customModelFiles.length === 1) {
              // If there's only one customized model, use the existing format
              customModelFile = customModelFiles[0];
            } else {
              // If there are multiple customized models, use the new format
              customModelFile = {
                files: customModelFiles.map(file => file.file),
                file_names: customModelFiles.map(file => file.file_name)
              };
            }
            console.log('Custom model file reference created:', customModelFile);
          } else if (uploadData.modelUrl) {
            console.log('No customized model URLs found, using customization data URL');
            customModelFile = {
              file: uploadData.modelUrl,
              file_name: fileName
            };
          } else {
            console.log('No model URL available, proceeding without custom model');
            // Don't set customModelFile, it will remain undefined
          }

          setUploadProgress(70);
          console.log('Custom model file reference created:', customModelFile);
        } catch (uploadError) {
          console.error('Error processing customization:', uploadError);
          // Continue with order without customization
        }
      }

      // Format cart items for the API
      const orderItems = items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        // Include customization price if available
        ...(item.isCustomized && {
          customization_price: item.totalCustomizationPrice,
          customization_details: item.customizations
        })
      }));

      setUploadProgress(80);

      // Get user's shipping address from localStorage
      let shippingAddress = "123 Main St, Anytown, USA"; // Default fallback
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          if (parsedUserData.address) {
            shippingAddress = parsedUserData.address;
          } else if (parsedUserData.shipping_address) {
            shippingAddress = parsedUserData.shipping_address;
          }
          console.log('Using shipping address from user profile:', shippingAddress);
        }
      } catch (error) {
        console.error('Error getting shipping address:', error);
        // Continue with default address
      }

      console.log('Creating order with items:', orderItems.length);
      setUploadProgress(90);

      // Include total customization price in the order
      const totalCustomizationPrice = items
        .filter(item => item.isCustomized)
        .reduce((sum, item) => sum + (item.totalCustomizationPrice || 0) * item.quantity, 0);

      // Call the API to create the order
      const response = await createOrder({
        items: orderItems,
        shipping_address: shippingAddress,
        total_price: totalPrice, // This already includes customization costs
        total_customization_price: totalCustomizationPrice
      }, customModelFile);

      setUploadProgress(100);
      console.log('Order created successfully:', response);
      
      // Store the order ID for the success modal
      if (response) {
        // The current API response format is { message: string, order: Order }
        // where Order contains the order_id
        const orderId = response.order?.order_id || null;
        setCompletedOrderId(orderId);
      }

      // Clear the cart and show success modal
      clearCart();
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorDetails(errorMessage || 'Unknown error occurred');
      alert(`There was an error processing your order: ${errorMessage || 'Please try again.'}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Show loading state until client-side rendering is complete
  if (!mounted) {
    return (
      <CustomerLayout userName={undefined} activePage="cart">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold font-montreal mb-8 text-black">Your Cart</h1>
          <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
            <div className="animate-pulse flex flex-col items-center justify-center">
              <div className="rounded-full bg-gray-200 h-16 w-16 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (items.length === 0) {
    return (
      <CustomerLayout userName={userName} activePage="cart">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold font-montreal mb-8 text-black">Your Cart</h1>
          <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-4 font-montreal text-black">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link href="/products" className="inline-block bg-black text-white px-6 py-3 rounded-sm font-montreal hover:bg-gray-800 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout userName={userName} activePage="cart">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold font-montreal mb-8 text-black">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items - Left Side (2 columns on large screens) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold font-montreal text-black">Items ({items.length})</h2>
                  <button
                    onClick={clearCart}
                    className="text-sm text-gray-500 hover:text-black transition-colors font-montreal"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {items.map(item => (
                  <div key={item.id} className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Product Image or 3D Model Preview */}
                      <div className="w-full md:w-1/4 aspect-square bg-white rounded-md overflow-hidden relative border border-gray-100">
                        {item.isCustomized ? (
                          <MiniModelViewer
                            modelUrl={item.baseModelUrl || '/models/hero-model.glb'}
                            customizations={item.customizations?.map(c => ({ partId: c.partName, color: c.color }))}
                            size="medium"
                          />
                        ) : item.modelUrl ? (
                          <MiniModelViewer
                            modelUrl={item.modelUrl}
                            size="medium"
                          />
                        ) : item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <span className="text-gray-500">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-lg font-semibold font-montreal text-black">{item.name}</h3>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label="Remove item"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Base Price */}
                        <div className="mt-2 text-gray-600">
                          Base Price: ${item.price.toFixed(2)}
                        </div>

                        {/* Customizations */}
                        {item.isCustomized && item.customizations && item.customizations.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-black mb-2 font-montreal">Customizations:</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {item.customizations.map((customization, index) => (
                                <div key={index} className="flex items-center text-sm text-gray-600">
                                  <div
                                    className="w-4 h-4 rounded-full mr-2 border border-gray-200"
                                    style={{ backgroundColor: customization.color }}
                                  ></div>
                                  <span>{customization.partName}</span>
                                  {customization.price > 0 && (
                                    <span className="ml-1 text-gray-500">
                                      (+${customization.price.toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quantity and Price */}
                        <div className="mt-4 flex flex-wrap justify-between items-end">
                          <div className="flex items-center border border-gray-200 rounded-sm">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-50"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 border-x border-gray-200">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-50"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right mt-4 md:mt-0">
                            <div className="text-sm text-gray-500">
                              {item.isCustomized && item.totalCustomizationPrice > 0 && (
                                <div>Customization: +${item.totalCustomizationPrice.toFixed(2)}</div>
                              )}
                              <div>Subtotal: ${((item.price + (item.totalCustomizationPrice || 0)) * item.quantity).toFixed(2)}</div>
                            </div>
                            <div className="text-lg font-semibold mt-1 font-montreal text-black">
                              ${((item.price + (item.totalCustomizationPrice || 0)) * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary - Right Side (1 column) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6 font-montreal text-black">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between font-semibold font-montreal text-black">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className={`w-full py-3 rounded-sm font-montreal transition-colors ${
                  isCheckingOut
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-black hover:bg-gray-800'
                } text-white`}
              >
                {isCheckingOut ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Checkout'
                )}
              </button>

              <div className="mt-6">
                <Link
                  href="/products"
                  className="block text-center text-gray-600 hover:text-black font-montreal text-sm"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Success Modal */}
      {showSuccessModal && (
        <OrderSuccessModal 
          onClose={() => {
            setShowSuccessModal(false);
            // Redirect to orders page after closing the modal
            router.push('/orders');
          }} 
          orderId={completedOrderId || undefined}
        />
      )}

      {/* Progress Bar */}
      {isCheckingOut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Processing Your Order</h3>

            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              {uploadProgress < 30 && "Preparing your customized model..."}
              {uploadProgress >= 30 && uploadProgress < 70 && "Uploading your customized model..."}
              {uploadProgress >= 70 && uploadProgress < 90 && "Processing order details..."}
              {uploadProgress >= 90 && uploadProgress < 100 && "Finalizing your order..."}
              {uploadProgress === 100 && "Order completed!"}
            </p>

            {errorDetails && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <p className="font-semibold mb-1">Error Details:</p>
                <p className="break-words">{errorDetails}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </CustomerLayout>
  );
};

export default CartPage;