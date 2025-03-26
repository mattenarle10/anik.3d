// page.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CustomerLayout from '../../../components/customer/layout';
import ModelViewer, { ModelViewerRef } from '../../../components/customer/customization/ModelViewer';
import CustomizationPanel, { CustomizablePart } from '../../../components/customer/customization/CustomizationPanel';
import { fetchProducts } from '../../api/products';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'react-hot-toast';
import { generateOrderUploadUrl } from '@/app/api/orders';

// Icons for parts
const HairIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12v8h20v-8C22 6.48 17.52 2 12 2zm0 2c4.42 0 8 3.58 8 8v6H4v-6c0-4.42 3.58-8 8-8z" />
  </svg>
);

const ShirtIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21H8v-2h8v2zm4-10.99L14 5c-.83-.83-2-1.34-3.25-1.34S8.33 4.17 7.5 5L2 10.01v8.98h4v-5.99h12v5.99h4v-8.98zm-10-1c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm2-2c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z" />
  </svg>
);

const PantsIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 14l-2-6 3-2 1 8H7zm10 0h-2l1-8 3 2-2 6z" />
    <path d="M12 4L8 6v12h8V6l-4-2z" />
  </svg>
);

const EyesIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
  </svg>
);

// Define the Product interface
interface Product {
  product_id: string;
  name: string;
  description: string;
  price: number;
  model_url: string;
  quantity: number;
  category?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export default function CustomizePage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.product as string;
  const { addItem } = useCart();
  const modelViewerRef = useRef<ModelViewerRef>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [customizationPrice, setCustomizationPrice] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Customization state with improved part structure
  const [customizableParts, setCustomizableParts] = useState<CustomizablePart[]>([
    {
      id: 'hair',
      name: 'Hair',
      color: '#8B4513',
      price: 0,
      icon: <ShirtIcon />
    },
    {
      id: 'shirt',
      name: 'Shirt',
      color: '#0000FF',
      price: 10,
      icon: <HairIcon />
    },
    {
      id: 'pants',
      name: 'Pants',
      color: '#000000',
      price: 5,
      icon: <PantsIcon />
    },
    {
      id: 'eyes',
      name: 'Eyes',
      color: '#00FF00',
      price: 15,
      icon: <EyesIcon />
    }
  ]);

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

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) {
        setError('No product selected for customization');
        setLoading(false);
        return;
      }

      try {
        const products = await fetchProducts();
        const foundProduct = products.find((p: any) => p.product_id === productId);

        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError('Product not found');
          router.push('/customize');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId, router]);

  // Handle part color change
  const handlePartColorChange = (partId: string, color: string) => {
    setCustomizableParts(prevParts =>
      prevParts.map(part =>
        part.id === partId ? { ...part, color } : part
      )
    );
  };

  // Calculate customization price
  useEffect(() => {
    const totalCustomizationPrice = customizableParts.reduce((total, part) => total + part.price, 0);
    setCustomizationPrice(totalCustomizationPrice);
  }, [customizableParts]);

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    setIsExporting(true);

    try {
      // Calculate total customization price
      const totalCustomizationPrice = customizableParts.reduce(
        (total, part) => total + part.price,
        0
      );

      // Export the customized 3D model if available
      let customModelUrl = null;

      try {
        if (modelViewerRef.current) {
          console.log("Exporting customized 3D model...");

          // Export the model as GLB
          const modelBlob = await modelViewerRef.current.exportModel();

          if (modelBlob) {
            console.log("Model exported, size:", modelBlob.size, "bytes");

            // Generate a unique filename for the customized model
            const fileName = `customized_${product.product_id}_${Date.now()}.glb`;
            console.log("Generated filename for customized model:", fileName);

            // Get a presigned URL for uploading
            const uploadData = await generateOrderUploadUrl(fileName, 'model/gltf-binary');
            console.log("Received presigned URL for model upload:", uploadData.uploadUrl);
            
            // Add null checks before creating URL objects
            if (uploadData.uploadUrl && uploadData.modelUrl) {
              console.log("Upload URL structure:", new URL(uploadData.uploadUrl));
              console.log("Model URL structure:", new URL(uploadData.modelUrl));
            } else {
              console.error("Missing upload or model URL in response");
              throw new Error("Failed to get valid upload URLs");
            }
            
            // We don't need to test if the URL is accessible before upload
            // This was causing 403 errors since the file doesn't exist yet
            // The S3 bucket permissions will determine if the file is accessible after upload
            
            // Upload the model file with improved error handling
            console.log("Starting model upload...");
            try {
              if (!uploadData.uploadUrl) {
                throw new Error('Failed to get a valid upload URL');
              }
              
              const uploadResponse = await fetch(uploadData.uploadUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'model/gltf-binary'
                  // Remove the x-amz-acl header since we removed it from the backend
                  // 'x-amz-acl': 'public-read'
                  // IMPORTANT: Remove cache control headers as they cause signature mismatch
                  // These headers were not part of the signature calculation on the server
                  // 'Cache-Control': 'no-cache, no-store, must-revalidate',
                  // 'Pragma': 'no-cache'
                },
                body: modelBlob
              });
              
              console.log("Upload response status:", uploadResponse.status);
              
              if (!uploadResponse.ok) {
                // Try to get the error details
                const errorText = await uploadResponse.text().catch(() => 'No error details available');
                console.error(`Upload failed with status: ${uploadResponse.status}`, errorText);
                
                if (uploadResponse.status === 403) {
                  console.error('This is likely a signature mismatch or S3 permissions issue.');
                  console.error('S3 error details:', errorText);
                  throw new Error(`Upload failed (403 Forbidden): Signature mismatch - ${errorText}`);
                }
                
                throw new Error(`Failed to upload model: ${uploadResponse.status} - ${errorText}`);
              }
              
              console.log("Customized model uploaded successfully to:", uploadData.modelUrl);
              customModelUrl = uploadData.modelUrl;
              
              // Verify the uploaded file is accessible
              try {
                if (!uploadData.modelUrl) {
                  throw new Error('Missing model URL for verification');
                }
                
                const verifyResponse = await fetch(uploadData.modelUrl, { method: 'HEAD' });
                if (!verifyResponse.ok) {
                  console.warn(`⚠️ Uploaded model URL returned ${verifyResponse.status}. The file may not be publicly accessible.`);
                } else {
                  console.log("✅ Uploaded model is accessible");
                }
              } catch (verifyError) {
                console.warn("Could not verify model accessibility:", verifyError);
              }
            } catch (uploadError) {
              console.error("Error during model upload:", uploadError);
              throw uploadError;
            }
          }
        }
      } catch (exportError) {
        console.error("Error exporting/uploading model:", exportError);
        // Continue without the customized model
      } finally {
        setIsExporting(false);
      }

      // Create customized product object for cart
      const customizedProduct = {
        productId: product.product_id,
        name: product.name,
        price: product.price,
        quantity: 1,
        modelUrl: customModelUrl || product.model_url, // S3 URL for the customized model (used for order creation)
        baseModelUrl: product.model_url, // Original model URL (used for display in cart)
        isCustomized: true,
        customizations: customizableParts.map(part => ({
          partId: part.id,
          partName: part.name,
          color: part.color,
          price: part.price
        })),
        totalCustomizationPrice: totalCustomizationPrice
      };

      // Add to cart using context
      addItem(customizedProduct);

      // Show success message
      toast.success('Added to cart!', {
        duration: 3000,
        position: 'bottom-center',
      });

      // Navigate to cart page
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(`Failed to add to cart: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsAddingToCart(false);
    }
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

  if (error && !product) {
    return (
      <CustomerLayout userName={userName} activePage="customize">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold font-montreal mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/customize')}
            className="px-6 py-2 bg-black text-white rounded-sm font-montreal transition-colors hover:bg-gray-800"
          >
            Back to Customize
          </button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout userName={userName} activePage="customize">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/customize')}
            className="flex items-center text-black hover:text-gray-700 font-montreal"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Customize
          </button>
        </div>

        <h1 className="text-3xl font-bold font-montreal mb-8 text-black">
          Customize {product?.name}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3D Model Viewer - Left Side (2 columns on large screens) */}
          <div className="lg:col-span-2 bg-white rounded-lg overflow-hidden border-2 border-gray-200 relative" style={{ height: '650px' }}>
            {product?.model_url && (
              <div className="h-full w-full">
                <ModelViewer
                  ref={modelViewerRef}
                  key={`model-viewer-${product.product_id}`}
                  modelUrl={product.model_url}
                  customizations={customizableParts.reduce((acc, part) => ({
                    ...acc,
                    [part.id]: part.color
                  }), {})}
                  parts={customizableParts.map(part => ({
                    partId: part.id,
                    color: part.color
                  }))}
                  onModelLoaded={() => {
                    console.log("Model loaded callback triggered");
                    setModelLoading(false);
                  }}
                  onError={(errorMsg: string) => {
                    console.error("Model loading error:", errorMsg);
                    setError(errorMsg);
                  }}
                />
              </div>
            )}

            {(modelLoading || isExporting) && (
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-white bg-opacity-70 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mb-4"></div>
                <p className="text-black font-montreal">
                  {isExporting ? 'Exporting 3D Model...' : 'Loading 3D Model...'}
                </p>
              </div>
            )}
          </div>

          {/* Customization Panel - Right Side */}
          <div className="lg:col-span-1">
            <CustomizationPanel
              parts={customizableParts}
              onPartColorChange={handlePartColorChange}
              onRandomize={(randomParts) => {
                // Apply all random colors at once
                console.log('Randomized colors:', randomParts);
                // Show success toast when randomization is applied
                toast.success('Random design applied!', {
                  icon: '🎨',
                  style: {
                    borderRadius: '4px',
                    background: '#333',
                    color: '#fff',
                  },
                });
              }}
              basePrice={product?.price || 0}
              additionalPrice={customizationPrice}
            />

            <button
              className={`w-full py-3 mt-6 text-white rounded-md font-montreal transition-colors ${
                isAddingToCart ? 'bg-gray-500' : 'bg-black hover:bg-gray-800'
              }`}
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding to Cart...
                </span>
              ) : (
                'Add to Cart'
              )}
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}