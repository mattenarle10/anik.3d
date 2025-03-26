'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ProductCardProps {
  id?: string;
  product_id: string;
  name: string;
  description: string;
  price: number;
  model_url?: string;
  category?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  quantity?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  product_id,
  name,
  description,
  price,
  model_url,
  category,
  isNew = false,
  isFeatured = false,
  quantity
}) => {
  // Use product_id as fallback if id is not available
  const productId = id || product_id || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const modelContainerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    controls?: OrbitControls;
    frameId?: number;
  }>({});

  // Validate model URL
  const isValidModelUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    // Check if URL ends with .glb or .gltf
    return url.toLowerCase().endsWith('.glb') || url.toLowerCase().endsWith('.gltf');
  };
  
  // Function to retry loading the model
  const retryLoadModel = useCallback(() => {
    if (retryCount < 3) {
      console.log(`[ProductCard] Retrying model load (${retryCount + 1}/3)`);
      setRetryCount(prev => prev + 1);
      setLoading(true);
      setError(null);
    }
  }, [retryCount]);
  
  // Set up and clean up the 3D scene
  useEffect(() => {
    // Check if model_url is valid
    if (!isValidModelUrl(model_url) || !modelContainerRef.current) {
      console.log(`[ProductCard] Invalid model URL or container not ready: ${model_url}`);
      setLoading(false);
      setError('Invalid model URL');
      return;
    }

    console.log(`[ProductCard] Setting up 3D scene for model: ${model_url}`);
    setLoading(true);
    setError(null);

    // Scene setup with radial gradient background
    const scene = new THREE.Scene();
    
    // Create a dramatic radial gradient background
    const bgTexture = createGradientTexture();
    scene.background = bgTexture;

    // Camera setup with better positioning
    const camera = new THREE.PerspectiveCamera(
      40, // Narrower field of view for better focus
      1, // Initial aspect ratio (will be updated)
      0.1,
      1000
    );
    camera.position.set(0, 0, 5); // Position camera

    // Optimized renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      precision: 'mediump', // Medium precision for better performance
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 1); // Pure black background
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Add cinematic tone mapping
    renderer.toneMappingExposure = 1.5; // Brighter exposure to make model stand out
    
    // Add renderer to DOM
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    modelContainerRef.current.appendChild(canvas);
    console.log('[ProductCard] Renderer added to DOM');

    // Controls - disable auto-rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = false; // Disable auto-rotation
    controls.target.set(0, 0, 0);
    controls.update();

    // Lighting setup for dark background
    // Stronger lighting to make model stand out against dark background
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
    
    console.log('[ProductCard] Lighting setup added to scene');

    // Save references for cleanup
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls
    };

    // Handle resize
    const handleResize = () => {
      if (!modelContainerRef.current) return;
      
      const width = modelContainerRef.current.clientWidth;
      const height = modelContainerRef.current.clientHeight;
      console.log(`[ProductCard] Resize: ${width}x${height}`);
      
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

    // Create a gradient texture for background
    function createGradientTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      
      const context = canvas.getContext('2d');
      if (!context) return new THREE.Color(0x000000);
      
      // Create a radial gradient from dark gray center to black edges
      const gradient = context.createRadialGradient(
        256, 256, 80,  // Inner circle center x, y, radius (increased for more focused highlight)
        256, 256, 350  // Outer circle center x, y, radius
      );
      
      // Add color stops for a more dramatic radial gradient (darker)
      gradient.addColorStop(0, '#222222');   // Darker center
      gradient.addColorStop(0.3, '#111111'); // Very dark gray
      gradient.addColorStop(1, '#000000');   // Pure black edges
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 512, 512);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }

    // Load the model with error handling
    const loader = new GLTFLoader();
    
    try {
      const modelUrlString = model_url as string;
      
      loader.load(
        modelUrlString,
        (gltf) => {
          if (!gltf.scene || !gltf.scene.children || gltf.scene.children.length === 0) {
            setError('Model has no content');
            setLoading(false);
            return;
          }
          
          // Basic material setup to prevent shader issues
          gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.material) {
                child.material.side = THREE.FrontSide;
                child.material.needsUpdate = true;
                // Ensure material is properly initialized
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    if (mat) {
                      mat.dispose();
                      mat.needsUpdate = true;
                    }
                  });
                } else {
                  child.material.dispose();
                  child.material.needsUpdate = true;
                }
              }
            }
          });
          
          // Center and scale the model
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          gltf.scene.position.x = -center.x;
          gltf.scene.position.y = -center.y;
          gltf.scene.position.z = -center.z;
          
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim === 0) {
            setError('Model has zero dimensions');
            setLoading(false);
            return;
          }
          
          const scale = 2.0 / maxDim;
          gltf.scene.scale.set(scale, scale, scale);
          
          // Add model to scene
          modelRef.current = gltf.scene;
          scene.add(gltf.scene);
          setLoading(false);
          
          // Single render
          renderer.render(scene, camera);
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
          setError('Failed to load 3D model');
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Exception during model loading:', err);
      setError('Exception during model loading');
      setLoading(false);
    }

    // Cleanup
    return () => {
      console.log('[ProductCard] Cleaning up 3D scene');
      window.removeEventListener('resize', handleResize);
      
      if (modelContainerRef.current && canvas.parentElement === modelContainerRef.current) {
        modelContainerRef.current.removeChild(canvas);
      }
      
      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.dispose();
      }
      
      if (sceneRef.current.controls) {
        sceneRef.current.controls.dispose();
      }
      
      if (modelRef.current && sceneRef.current.scene) {
        sceneRef.current.scene.remove(modelRef.current);
      }
      
      modelRef.current = null;
    };
  }, [model_url]);
  
  return (
    <div className="group relative bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      {/* Badge for new or featured products */}
      {(isNew || isFeatured || model_url) && (
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          {isNew && (
            <span className="bg-black text-white text-xs font-montreal px-2.5 py-1 rounded-sm">
              NEW
            </span>
          )}
          {isFeatured && (
            <span className="bg-gradient-to-r from-yellow-200 to-yellow-300 text-black text-xs font-montreal px-2.5 py-1 rounded-sm">
              POPULAR
            </span>
          )}
          {model_url && (
            <span className="bg-black bg-opacity-70 text-white text-xs px-2.5 py-1 rounded-sm font-montreal">
              3D
            </span>
          )}
        </div>
      )}
      
      {/* Link wrapper for the entire card */}
      <Link href={`/products/${productId}`} className="flex flex-col h-full">
        {/* 3D Model Preview */}
        <div className="relative h-72 w-full overflow-hidden bg-black rounded-t-sm">
          {model_url ? (
            <>
              <div 
                ref={modelContainerRef} 
                className="w-full h-full"
              ></div>
              
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  <p className="text-sm font-montreal mt-2">Loading 3D model...</p>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-montreal mb-2 text-center">{error}</p>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      retryLoadModel();
                    }}
                    className="px-3 py-1 bg-white text-black text-xs rounded-sm hover:bg-gray-200 transition-colors font-montreal"
                  >
                    Retry Loading
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 h-full bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-montreal">No 3D model available</p>
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-5 flex flex-col flex-grow">
          {category && (
            <span className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-montreal">
              {category}
            </span>
          )}
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 font-montreal">
            {name}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow font-montreal">
            {description}
          </p>
          
          {/* Price and Availability */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
            <div>
              <span className="text-lg font-bold text-gray-900 font-montreal">${price.toFixed(2)}</span>
              {quantity !== undefined && (
                <span className="ml-2 text-xs font-montreal text-gray-500">
                  {quantity > 0 ? `${quantity} in stock` : 'Out of stock'}
                </span>
              )}
            </div>
            
            <div className="bg-black text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors hover:bg-gray-800 font-montreal">
              View Details
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;