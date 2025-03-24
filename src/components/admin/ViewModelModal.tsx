'use client';
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ViewModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelUrl: string | null;
  modelType?: 'base' | 'custom' | 'customized';
  modelName?: string;
}

export default function ViewModelModal({ 
  isOpen, 
  onClose, 
  modelUrl,
  modelType = 'base',
  modelName
}: ViewModelModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const modelRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    controls?: OrbitControls;
    frameId?: number;
  }>({});

  // Set up and clean up the 3D scene
  useEffect(() => {
    if (!isOpen || !modelUrl || !containerRef.current) return;

    setLoading(true);
    setError(null);

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5); // Light gray background

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45, // Field of view
      1, // Initial aspect ratio (will be updated)
      0.1,
      1000
    );
    camera.position.set(0, 0, 5); // Position camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      precision: 'mediump' // Medium precision instead of highp
    });
    renderer.setClearColor(0xf5f5f5); // Light gray background
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Add renderer to DOM
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    containerRef.current.appendChild(canvas);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.target.set(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(3, 5, 3);
    scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-3, 2, -3);
    scene.add(fillLight);

    // Save references for cleanup
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls
    };

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
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

    // Load the model
    const loader = new GLTFLoader();
    
    // Add loading manager to track progress
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = Math.floor((itemsLoaded / itemsTotal) * 100);
      setLoadingProgress(progress);
    };
    
    loadingManager.onError = (url) => {
      setError(`Failed to load model from ${url}`);
      setLoading(false);
    };
    
    const gltfLoader = new GLTFLoader(loadingManager);
    
    gltfLoader.load(
      modelUrl,
      (gltf) => {
        // Success callback
        if (modelRef.current && sceneRef.current.scene) {
          sceneRef.current.scene.remove(modelRef.current);
        }

        const model = gltf.scene;
        
        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Calculate the max dimension to scale the model appropriately
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim; // Scale to fit within a 2 unit sphere
        
        model.position.set(-center.x, -center.y, -center.z);
        model.scale.set(scale, scale, scale);
        
        // Add the model to the scene
        if (sceneRef.current.scene) {
          sceneRef.current.scene.add(model);
          modelRef.current = model;
          
          // Position camera to view the entire model
          const distance = maxDim * 1.5;
          if (sceneRef.current.camera) {
            sceneRef.current.camera.position.set(distance, distance / 2, distance);
          }
          if (sceneRef.current.controls) {
            sceneRef.current.controls.target.set(0, 0, 0);
            sceneRef.current.controls.update();
          }
        }
        
        setLoading(false);
        setModelLoaded(true);
      },
      // Progress callback
      (xhr) => {
        const progress = Math.floor((xhr.loaded / xhr.total) * 100);
        setLoadingProgress(progress);
      },
      // Error callback
      (error) => {
        console.error('Error loading model:', error);
        setError('Failed to load 3D model. Please try again later.');
        setLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      if (!sceneRef.current.scene || !sceneRef.current.camera || !sceneRef.current.renderer) return;
      
      sceneRef.current.frameId = requestAnimationFrame(animate);
      
      if (sceneRef.current.controls) {
        sceneRef.current.controls.update();
      }
      
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    };
    
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (sceneRef.current.frameId) {
        cancelAnimationFrame(sceneRef.current.frameId);
      }
      
      if (containerRef.current && canvas.parentElement === containerRef.current) {
        containerRef.current.removeChild(canvas);
      }
      
      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.dispose();
      }
      
      if (sceneRef.current.controls) {
        sceneRef.current.controls.dispose();
      }
      
      // Clear the scene
      if (modelRef.current && sceneRef.current.scene) {
        sceneRef.current.scene.remove(modelRef.current);
      }
      
      modelRef.current = null;
    };
  }, [isOpen, modelUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-sm max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-montreal text-black">
              {modelName ? modelName : '3D Model Viewer'}
              {modelType !== 'base' && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                  {modelType === 'custom' ? 'Custom Model' : 'Customized'}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {modelUrl ? (
                <span className="truncate block max-w-md" title={modelUrl}>
                  {modelUrl.split('/').pop()}
                </span>
              ) : 'No model URL provided'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="relative flex-grow min-h-[400px] bg-gray-100 rounded-sm">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-80 z-10">
              <div className="w-full max-w-xs">
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Loading model...</span>
                  <span className="text-sm font-medium text-gray-700">{loadingProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-black h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
              <div className="text-center p-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-red-500 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Model</h3>
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <div
            ref={containerRef}
            className="w-full h-full min-h-[400px]"
          />
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {modelLoaded ? 'Model loaded successfully' : 'Loading 3D model...'}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-sm hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}