'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface CustomizeCardProps {
  product_id: string;
  name: string;
  price: number;
  model_url?: string;
  category?: string;
  onClick?: (productId: string) => void;
}

const CustomizeCard: React.FC<CustomizeCardProps> = ({
  product_id,
  name,
  price,
  model_url,
  category,
  onClick
}) => {
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
    return url.toLowerCase().endsWith('.glb') || url.toLowerCase().endsWith('.gltf');
  };
  
  // Function to retry loading the model
  const retryLoadModel = useCallback(() => {
    if (retryCount < 3) {
      console.log(`[CustomizeCard] Retrying model load (${retryCount + 1}/3)`);
      setRetryCount(prev => prev + 1);
      setLoading(true);
      setError(null);
    }
  }, [retryCount]);
  
  // Set up and clean up the 3D scene
  useEffect(() => {
    // Check if model_url is valid
    if (!isValidModelUrl(model_url) || !modelContainerRef.current) {
      console.log(`[CustomizeCard] Invalid model URL or container not ready: ${model_url}`);
      setLoading(false);
      setError('Invalid model URL');
      return;
    }

    console.log(`[CustomizeCard] Setting up 3D scene for model: ${model_url}`);
    setLoading(true);
    setError(null);

    // Scene setup with radial gradient background
    const scene = new THREE.Scene();
    
    // Create a radial gradient background
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
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Add cinematic tone mapping
    renderer.toneMappingExposure = 1.5; // Brighter exposure to make model stand out
    
    // Add renderer to DOM
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    modelContainerRef.current.appendChild(canvas);
    console.log('[CustomizeCard] Renderer added to DOM');

    // Controls - always auto-rotate for better preview
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1; // Increased for smoother response
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true; // Always auto-rotate for better preview
    controls.autoRotateSpeed = 1.5; // Slower rotation for smoother appearance
    controls.target.set(0, 0, 0);
    controls.update(); // Initial update to apply settings

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
    
    console.log('[CustomizeCard] Lighting setup added to scene');

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
      console.log(`[CustomizeCard] Resize: ${width}x${height}`);
      
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

    // Set a timeout for loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.error('[CustomizeCard] Model loading timeout');
        setError('Loading timeout - please try again');
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    // Load 3D model
    const loader = new GLTFLoader();
    
    try {
      // Fix TypeScript error by ensuring model_url is a string
      const modelUrlString = model_url as string;
      
      loader.load(
        modelUrlString,
        (gltf) => {
          clearTimeout(loadingTimeout);
          console.log('[CustomizeCard] Model loaded successfully', gltf);
          
          try {
            // Make sure the model has content
            if (!gltf.scene || !gltf.scene.children || gltf.scene.children.length === 0) {
              throw new Error('Model has no content');
            }
            
            // Optimize materials for better performance
            gltf.scene.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                if (child.material) {
                  // Ensure materials render correctly
                  child.material.side = THREE.FrontSide; // Use FrontSide for better performance
                  child.material.needsUpdate = true;
                  
                  // Optimize materials
                  if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                      mat.roughness = 0.7; // Better default appearance
                      mat.metalness = 0.3;
                    });
                  } else {
                    child.material.roughness = 0.7;
                    child.material.metalness = 0.3;
                  }
                }
                
                // Optimize geometry if possible
                if (child.geometry) {
                  child.geometry.computeBoundingSphere();
                }
              }
            });
            
            // Center and scale the model using a more reliable approach
            const box = new THREE.Box3().setFromObject(gltf.scene);
            
            // Check if bounding box is valid
            if (box.min.x === Infinity || box.max.x === -Infinity) {
              throw new Error('Invalid model dimensions');
            }
            
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Move the model to center
            gltf.scene.position.x = -center.x;
            gltf.scene.position.y = -center.y;
            gltf.scene.position.z = -center.z;
            
            // Scale the model to fit the view
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim === 0) {
              throw new Error('Model has zero dimensions');
            }
            
            const scale = 2.0 / maxDim;
            gltf.scene.scale.set(scale, scale, scale);
            
            // Slightly rotate the model for a better initial view
            gltf.scene.rotation.y = Math.PI / 6; // 30 degrees
            
            console.log(`[CustomizeCard] Model centered and scaled by ${scale}`);
            
            // Add model to scene
            modelRef.current = gltf.scene;
            scene.add(gltf.scene);
            setLoading(false);
            
            // Render once without animation loop
            renderer.render(scene, camera);
            console.log('[CustomizeCard] Initial render complete');
            
            // Animation loop
            const animate = () => {
              if (!sceneRef.current.scene || !sceneRef.current.camera || !sceneRef.current.renderer) return;
              
              sceneRef.current.frameId = requestAnimationFrame(animate);
              
              // Update controls
              if (sceneRef.current.controls) {
                sceneRef.current.controls.update();
              }
              
              // Render scene
              sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
            };
            
            animate();
          } catch (err) {
            console.error('[CustomizeCard] Error processing model:', err);
            setError('Error processing model');
            setLoading(false);
          }
        },
        (xhr) => {
          // Progress callback
          const percent = Math.floor((xhr.loaded / xhr.total) * 100);
          console.log(`[CustomizeCard] Loading progress: ${percent}%`);
        },
        (error) => {
          clearTimeout(loadingTimeout);
          console.error('[CustomizeCard] Error loading model:', error);
          setError('Failed to load 3D model');
          setLoading(false);
        }
      );
    } catch (err) {
      clearTimeout(loadingTimeout);
      console.error('[CustomizeCard] Exception during model loading:', err);
      setError('Error loading 3D model');
      setLoading(false);
    }

    // Cleanup function
    return () => {
      console.log('[CustomizeCard] Cleaning up 3D scene');
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
  }, [model_url, retryCount]);

  const handleCardClick = () => {
    if (onClick) {
      onClick(product_id);
    }
  };

  return (
    <div 
      className="group relative bg-white rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-transparent hover:border-gray-200"
      onClick={handleCardClick}
    >
      {/* Badge for 3D */}
      <div className="absolute top-0 left-0 z-10 p-2 flex gap-1">
        <span className="bg-black text-white text-xs px-2.5 py-1 rounded-sm font-montreal">
          3D
        </span>
      </div>
      
      {/* 3D Model Preview */}
      <div className="relative h-72 w-full overflow-hidden bg-black rounded-t-sm group-hover:brightness-110 transition-all">
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
        
        {/* Customize button overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button 
            className="bg-white text-black px-4 py-2 rounded-sm text-sm font-medium transition-transform transform hover:scale-105 font-montreal flex items-center"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onClick) onClick(product_id);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Customize
          </button>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-5 flex flex-col">
        {category && (
          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-montreal">
            {category}
          </span>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 font-montreal group-hover:text-blue-900 transition-colors">
          {name}
        </h3>
        
        {/* Color palette design - innovative approach */}
        <div className="flex items-center space-x-1 mb-3">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 border border-white shadow-sm"></div>
            <div className="w-4 h-4 rounded-full bg-purple-500 border border-white shadow-sm"></div>
            <div className="w-4 h-4 rounded-full bg-red-500 border border-white shadow-sm"></div>
            <div className="w-4 h-4 rounded-full bg-yellow-500 border border-white shadow-sm"></div>
            <div className="w-4 h-4 rounded-full bg-green-500 border border-white shadow-sm"></div>
          </div>
          <span className="text-xs text-gray-500 ml-1 font-montreal">Customize</span>
        </div>
        
        {/* Price and Customize Button */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 font-montreal">₱{price.toFixed(2)}</span>

          </div>
          
          <div className="flex items-center bg-gray-100 hover:bg-gray-200 transition-colors px-2 py-1 rounded-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-xs font-medium text-gray-700 font-montreal">
              Preview
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizeCard;