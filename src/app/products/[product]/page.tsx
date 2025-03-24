'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import CustomerLayout from '../../../components/customer/layout';
import { fetchProducts } from '../../api/products';
import ProductCard from '../../../components/customer/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'react-hot-toast';

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
  image_url?: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.product as string;
  const { addItem } = useCart(); // Get addItem function from cart context
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const modelContainerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    controls?: OrbitControls;
    frameId?: number;
  }>({});

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
      try {
        const products = await fetchProducts();
        const foundProduct = products.find((p: any) => p.product_id === productId);
        
        if (foundProduct) {
          setProduct(foundProduct);
          
          // Get 2 random products for "You May Also Like" section (excluding current product)
          const otherProducts = products.filter((p: any) => p.product_id !== productId);
          const shuffled = [...otherProducts].sort(() => 0.5 - Math.random());
          setRelatedProducts(shuffled.slice(0, 2));
        } else {
          setError('Product not found');
          router.push('/products');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductData();
    }
  }, [productId, router]);

  // Validate model URL
  const isValidModelUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.glb') || url.toLowerCase().endsWith('.gltf');
  };

  // Handle retry loading
  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setModelLoading(true);
      setError(null);
    }
  };

  // Set up and clean up the 3D scene
  useEffect(() => {
    if (!product?.model_url || !modelContainerRef.current || !isValidModelUrl(product.model_url)) {
      setModelLoading(false);
      if (product && !isValidModelUrl(product.model_url)) {
        setError('Invalid model URL');
      }
      return;
    }

    console.log(`[ProductDetail] Setting up 3D scene for model: ${product.model_url}`);
    setModelLoading(true);
    setError(null);

    // Scene setup with pure black background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Pure black background

    // Camera setup with better positioning for detail view
    const camera = new THREE.PerspectiveCamera(
      35, // Wider field of view for product detail
      1, // Initial aspect ratio (will be updated)
      0.1,
      1000
    );
    camera.position.set(0, 0, 6); // Position camera slightly further back

    // Optimized renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      precision: 'mediump',
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 1); // Pure black background
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    
    // Add renderer to DOM
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.borderRadius = '0'; // Remove border radius
    modelContainerRef.current.appendChild(canvas);

    // Controls - optimized for product detail view
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enableZoom = true; // Enable zoom for product detail page
    controls.enablePan = false;
    controls.autoRotate = true; // Always rotate slowly
    controls.autoRotateSpeed = 0.8; // Slower, more elegant rotation for detail view
    controls.target.set(0, 0, 0);
    controls.update();

    // Lighting setup for dark background
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(1, 1, 2);
    scene.add(keyLight);
    
    // Add fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-1, 0.5, 1);
    scene.add(fillLight);
    
    // Add rim light for edge highlights
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, 0, -2);
    scene.add(rimLight);
    
    console.log('[ProductDetail] Lighting setup added to scene');

    // Save references for cleanup
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls
    };

    // Handle window resize
    const handleResize = () => {
      if (!modelContainerRef.current) return;
      
      const width = modelContainerRef.current.clientWidth;
      const height = modelContainerRef.current.clientHeight;
      
      if (sceneRef.current.camera) {
        sceneRef.current.camera.aspect = width / height;
        sceneRef.current.camera.updateProjectionMatrix();
      }
      
      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.setSize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    // Load the model with timeout and error handling
    console.log(`[ProductDetail] Starting to load model from URL: ${product.model_url}`);
    
    // Set a timeout to detect slow loading
    const loadingTimeout = setTimeout(() => {
      console.log('[ProductDetail] Model loading is taking longer than expected');
    }, 5000);
    
    // Create a loader with loading manager
    const loader = new GLTFLoader();
    
    // Add a try-catch around the loader
    try {
      // Fix TypeScript error by ensuring model_url is a string
      const modelUrlString = product.model_url as string;
      
      loader.load(
        modelUrlString,
        (gltf) => {
          clearTimeout(loadingTimeout);
          console.log('[ProductDetail] Model loaded successfully', gltf);
          
          // Process the loaded model
          const model = gltf.scene;
          
          // Center the model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          
          // Adjust vertical position to center the model visually rather than geometrically
          // This helps when models have their origin at the feet rather than the center
          const size = box.getSize(new THREE.Vector3());
          model.position.x = -center.x;
          model.position.z = -center.z;
          model.position.y = -center.y - (size.y * 0.25); // Offset downward by 25% of height
          
          // Scale the model to fit the view
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) {
            const scale = 2.5 / maxDim; // Larger scale for detail view
            model.scale.multiplyScalar(scale);
          }
          
          // Optimize materials
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              
              // Ensure materials use physically-based rendering
              if (mesh.material) {
                const material = mesh.material as THREE.MeshStandardMaterial;
                material.needsUpdate = true;
                
                // Enhance material properties for better appearance
                material.roughness = 0.7;
                material.metalness = 0.3;
              }
            }
          });
          
          // Add model to scene
          scene.add(model);
          modelRef.current = model;
          setModelLoading(false);
          
          // Start animation loop
          animate();
        },
        (progress) => {
          // Progress callback
          console.log(`[ProductDetail] Loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        },
        (error) => {
          clearTimeout(loadingTimeout);
          console.error('[ProductDetail] Error loading model:', error);
          setError('Failed to load 3D model');
          setModelLoading(false);
          
          if (retryCount < 3) {
            console.log(`[ProductDetail] Will retry loading (attempt ${retryCount + 1}/3)`);
          }
        }
      );
    } catch (err) {
      clearTimeout(loadingTimeout);
      console.error('[ProductDetail] Exception during model loading:', err);
      setError('Error loading 3D model');
      setModelLoading(false);
    }

    // Animation loop - simplified for better performance
    const animate = () => {
      if (!sceneRef.current.scene || !sceneRef.current.camera || !sceneRef.current.renderer) return;
      
      sceneRef.current.frameId = requestAnimationFrame(animate);
      
      // Update controls
      if (sceneRef.current.controls) {
        sceneRef.current.controls.update();
      }
      
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    };

    // Cleanup function
    return () => {
      console.log('[ProductDetail] Cleaning up 3D scene');
      window.removeEventListener('resize', handleResize);
      
      if (sceneRef.current.frameId !== undefined) {
        cancelAnimationFrame(sceneRef.current.frameId);
      }
      
      if (sceneRef.current.renderer && modelContainerRef.current) {
        modelContainerRef.current.removeChild(sceneRef.current.renderer.domElement);
        sceneRef.current.renderer.dispose();
      }
      
      // Clear references
      modelRef.current = null;
      sceneRef.current = {};
    };
  }, [product, retryCount]);

  // Handle adding product to cart
  const handleAddToCart = () => {
    if (!product || product.quantity <= 0) return;
    
    setAddingToCart(true);
    
    try {
      addItem({
        productId: product.product_id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.model_url ? undefined : product.image_url || `/images/products/${product.product_id}.jpg`,
        modelUrl: product.model_url || undefined,
        isCustomized: false,
        totalCustomizationPrice: 0
      });
      
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout userName={userName} activePage="products">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
        </div>
      </CustomerLayout>
    );
  }

  if (error && !product) {
    return (
      <CustomerLayout userName={userName} activePage="products">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold font-montreal mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/products')}
            className="px-6 py-2 bg-black text-white rounded-sm font-montreal transition-colors hover:bg-gray-800"
          >
            Back to Products
          </button>
        </div>
      </CustomerLayout>
    );
  }

  if (!product) {
    return (
      <CustomerLayout userName={userName} activePage="products">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold font-montreal mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => router.push('/products')}
            className="px-6 py-2 bg-black text-white rounded-sm font-montreal hover:bg-gray-800 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout userName={userName} activePage="products">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="mb-8 flex justify-center">
          <button 
            onClick={() => router.push('/products')}
            className="flex items-center text-black hover:text-gray-700 font-montreal"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Products
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {/* 3D Model Viewer - Left Side (3 columns on large screens) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-md overflow-hidden shadow-sm border border-gray-100">
              <div 
                ref={modelContainerRef} 
                className="w-full h-[450px] md:h-[550px] relative"
              >
                {modelLoading && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center bg-white bg-opacity-80 z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800 mb-4"></div>
                    <p className="text-gray-800 font-montreal">Loading 3D Model...</p>
                  </div>
                )}
                
                {error && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center bg-white bg-opacity-80 z-10 p-6">
                    <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-gray-800 font-montreal text-center mb-4">{error}</p>
                    {retryCount < 3 && (
                      <button 
                        onClick={handleRetry}
                        className="px-4 py-2 bg-black text-white rounded-sm font-montreal hover:bg-gray-800 transition-colors"
                      >
                        Retry Loading
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Model controls */}
              <div className="bg-white p-3 flex justify-center border-t border-gray-100">
                <div className="text-gray-600 text-xs font-montreal">
                  Click and drag to rotate • Scroll to zoom
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Details - Right Side (2 columns on large screens) */}
          <div className="lg:col-span-2 flex flex-col p-6 bg-white rounded-md shadow-sm border border-gray-100">
            {/* Product badges */}
            <div className="flex gap-2 mb-4 justify-center">
              {product.isNew && (
                <span className="bg-gray-800 text-white text-xs font-montreal px-2.5 py-1 rounded-sm">
                  NEW
                </span>
              )}
              {product.isFeatured && (
                <span className="bg-gray-700 text-white text-xs font-montreal px-2.5 py-1 rounded-sm">
                  FEATURED
                </span>
              )}
              {product.model_url && (
                <span className="bg-black text-white text-xs px-2.5 py-1 rounded-sm font-montreal">
                  3D MODEL
                </span>
              )}
            </div>
            
            {/* Category */}
            {product.category && (
              <div className="mb-2 text-center">
                <span className="text-xs text-gray-600 uppercase tracking-wider font-montreal">
                  {product.category}
                </span>
              </div>
            )}
            
            {/* Product title */}
            <h1 className="text-3xl font-bold font-montreal mb-3 text-gray-900 text-center">{product.name}</h1>
            
            {/* Price */}
            <div className="text-2xl font-montreal mb-5 text-gray-900 text-center">${product.price.toFixed(2)}</div>
            
            {/* Availability */}
            <div className="mb-6 flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${product.quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-montreal text-gray-700">
                {product.quantity > 0 ? `In Stock (${product.quantity} available)` : 'Out of Stock'}
              </span>
            </div>
            
            {/* Divider */}
            <div className="border-t border-gray-200 my-5 max-w-xs mx-auto w-full"></div>
            
            {/* Product description */}
            <div className="mb-8 flex-grow text-center">
              <p className="text-gray-700 font-montreal leading-relaxed mb-4">
                {product.description}
              </p>
            </div>
            
            {/* Buttons */}
            <div className="space-y-3 mt-auto max-w-xs mx-auto w-full">
              {/* Add to Cart Button */}
              <button 
                className={`w-full py-3 rounded-sm font-montreal transition-colors ${
                  product.quantity > 0 
                    ? 'bg-black text-white hover:bg-gray-800' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={product.quantity <= 0 || addingToCart}
                onClick={handleAddToCart}
              >
                {addingToCart ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : (
                  'Add to Cart'
                )}
              </button>
              
              {/* Customize Button */}
              <button 
                className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-sm font-montreal transition-colors hover:bg-gray-50"
                onClick={() => router.push(`/customize/${product.product_id}`)}
              >
                Customize
              </button>
            </div>
          </div>
        </div>
        
        {/* Related Products Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold font-montreal mb-6 text-gray-900 text-center">You May Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedProducts.length > 0 ? (
              relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.product_id}
                  id={relatedProduct.product_id}
                  product_id={relatedProduct.product_id}
                  name={relatedProduct.name}
                  description={relatedProduct.description}
                  price={relatedProduct.price}
                  model_url={relatedProduct.model_url}
                  category={relatedProduct.category}
                  isNew={relatedProduct.isNew}
                  isFeatured={relatedProduct.isFeatured}
                  quantity={relatedProduct.quantity}
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <p className="text-gray-500 font-montreal">No related products available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}