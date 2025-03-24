// ModelViewer.tsx
'use client';
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, ForwardRefRenderFunction } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Define the ref type that will be exposed
interface ModelViewerRef {
  exportModel: () => Promise<Blob>;
}

interface ModelViewerProps {
  modelUrl: string;
  customizations: Record<string, string>;
  parts: {
    partId: string;
    color: string;
  }[];
  onModelLoaded?: () => void;
  onError?: (error: string) => void;
  onExport?: (blob: Blob) => void;
}

// Use ForwardRefRenderFunction to properly type the component with forwardRef
const ModelViewerComponent: ForwardRefRenderFunction<ModelViewerRef, ModelViewerProps> = (
  {
    modelUrl,
    customizations,
    parts,
    onModelLoaded,
    onError,
    onExport
  },
  ref
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    controls?: OrbitControls;
    frameId?: number;
    materials?: Record<string, THREE.Material>;
  }>({});

  // Function to export the customized model as GLB
  const exportModel = async (): Promise<Blob> => {
    return new Promise<Blob>((resolve, reject) => {
      try {
        if (!sceneRef.current.scene || !modelRef.current) {
          console.error('Export failed: Scene or model not loaded');
          reject(new Error('Scene or model not loaded'));
          return;
        }

        console.log('Starting model export process...');
        
        // Instead of creating a new scene, we'll export the model directly
        // This preserves the original structure including bones and animations
        const modelToExport = modelRef.current;
        console.log('Preparing model for export...');
        
        // Create a new exporter
        const exporter = new GLTFExporter();
        console.log('GLTFExporter created, starting export...');
        
        // Export options to preserve animations and skeletal data
        const options = {
          binary: true, // Export as GLB
          animations: modelToExport.animations, // Preserve animations if any
          includeCustomExtensions: true, // Include any custom extensions
          trs: false, // Use matrix transforms instead of TRS
          onlyVisible: true, // Only export visible objects
        };
        
        // Parse the model to generate the GLB
        exporter.parse(
          modelToExport,
          (result) => {
            // Handle both ArrayBuffer and object result types
            if (result instanceof ArrayBuffer) {
              console.log(`Export successful, size: ${result.byteLength} bytes`);
              const blob = new Blob([result], { type: 'model/gltf-binary' });
              if (onExport) {
                onExport(blob);
              }
              resolve(blob);
            } else {
              console.error('Unexpected result type from GLTFExporter:', typeof result);
              reject(new Error('Unexpected result type from GLTFExporter'));
            }
          },
          (error) => {
            console.error('Error in GLTFExporter.parse:', error);
            reject(new Error(`Export failed: ${error.message || 'Unknown error'}`));
          },
          options
        );
      } catch (error) {
        console.error('Exception during export:', error);
        reject(error);
      }
    });
  };

  // Expose the exportModel method via the ref
  useImperativeHandle(ref, () => ({
    exportModel
  }));

  // Set up and clean up the 3D scene
  useEffect(() => {
    console.log("ModelViewer: Setting up with model URL:", modelUrl);
    
    if (!modelUrl || !containerRef.current) {
      console.error("ModelViewer: Invalid model URL or container");
      if (onError) onError('Invalid model URL or container');
      return;
    }

    // Scene setup with white background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // Pure white background
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45, // Field of view
      1,  // Initial aspect ratio (will be updated)
      0.1,
      1000
    );
    camera.position.set(0, 0, 5); // Position camera directly in front of model
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false, // No need for alpha with white background
      precision: 'mediump',
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0xffffff, 1); // White background
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; // Standard exposure
    
    // Add renderer to DOM
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'relative'; // Change from absolute to relative
    canvas.style.zIndex = '1'; // Ensure canvas is visible
    
    if (containerRef.current) {
      // Clear any existing canvas first
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      containerRef.current.appendChild(canvas);
    }
    console.log("ModelViewer: Renderer added to DOM");
    
    // Update renderer size
    const updateRendererSize = () => {
      if (containerRef.current && renderer) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        console.log(`ModelViewer: Updating renderer size to ${width}x${height}`);
        renderer.setSize(width, height);
        if (camera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      }
    };
    updateRendererSize();
    
    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.autoRotate = autoRotate; // Use state for auto-rotation
    controls.autoRotateSpeed = 1.0;
    controls.target.set(0, 0, 0);
    controls.update();
    
    // Lighting setup for white background
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Brighter ambient light
    scene.add(ambientLight);
    
    // Key light (main light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2); // Brighter key light
    keyLight.position.set(1, 1, 2);
    scene.add(keyLight);
    
    // Fill light (softer light from another angle)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8); // Brighter fill light
    fillLight.position.set(-1, 0.5, 1);
    scene.add(fillLight);
    
    // Rim light for edge definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 0, -2);
    scene.add(rimLight);
    
    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      materials: {}
    };
    
    // Handle window resize
    const handleResize = () => {
      updateRendererSize();
    };
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      const frameId = requestAnimationFrame(animate);
      sceneRef.current.frameId = frameId;
      
      if (sceneRef.current.controls) {
        sceneRef.current.controls.update();
      }
      
      if (sceneRef.current.renderer && sceneRef.current.scene && sceneRef.current.camera) {
        sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      }
    };
    
    // Start animation immediately
    animate();
    console.log("ModelViewer: Animation loop started");
    
    // Load 3D model
    try {
      console.log("ModelViewer: Loading model from URL:", modelUrl);
      const loader = new GLTFLoader();
      
      // Set a timeout for loading
      const loadingTimeout = setTimeout(() => {
        console.error("ModelViewer: Model loading timeout");
        if (onError) onError('Loading timeout - please try again');
      }, 15000); // 15 second timeout
      
      loader.load(
        modelUrl,
        (gltf) => {
          clearTimeout(loadingTimeout);
          console.log("ModelViewer: Model loaded successfully:", gltf);
          
          try {
            // Make sure the model has content
            if (!gltf.scene || !gltf.scene.children || gltf.scene.children.length === 0) {
              throw new Error('Model has no content');
            }
            
            const model = gltf.scene;
            
            // Store materials for customization
            model.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material) {
                // Store original materials for later customization
                const meshName = child.name.toLowerCase();
                console.log("ModelViewer: Found mesh:", meshName);
                
                // Optimize materials
                if (child.material) {
                  // Ensure materials render correctly
                  child.material.side = THREE.FrontSide;
                  child.material.needsUpdate = true;
                  
                  // Optimize materials
                  if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                      mat.roughness = 0.7;
                      mat.metalness = 0.3;
                    });
                  } else {
                    child.material.roughness = 0.7;
                    child.material.metalness = 0.3;
                  }
                }
                
                // Associate materials with parts
                parts.forEach(part => {
                  if (meshName.includes(part.partId.toLowerCase())) {
                    console.log(`ModelViewer: Associating mesh ${meshName} with part ${part.partId}`);
                    
                    // Clone the material to avoid shared materials
                    let material;
                    if (Array.isArray(child.material)) {
                      material = child.material[0].clone();
                    } else {
                      material = child.material.clone();
                    }
                    
                    // Convert to MeshStandardMaterial if it's not already
                    if (!(material instanceof THREE.MeshStandardMaterial)) {
                      const newMaterial = new THREE.MeshStandardMaterial();
                      newMaterial.copy(material);
                      material = newMaterial;
                    }
                    
                    // Apply initial color
                    material.color.set(part.color);
                    material.needsUpdate = true;
                    
                    // Apply material to mesh
                    if (Array.isArray(child.material)) {
                      child.material = [material];
                    } else {
                      child.material = material;
                    }
                    
                    // Store material reference
                    if (!sceneRef.current.materials) {
                      sceneRef.current.materials = {};
                    }
                    sceneRef.current.materials[part.partId] = material;
                  }
                });
              }
            });
            
            // Center and scale the model using a more reliable approach
            const box = new THREE.Box3().setFromObject(model);
            
            // Check if bounding box is valid
            if (box.min.x === Infinity || box.max.x === -Infinity) {
              throw new Error('Invalid model dimensions');
            }
            
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Move the model to center
            model.position.x = -center.x;
            model.position.y = -center.y + (size.y * 0.1); // Slight vertical adjustment to better frame the model
            model.position.z = -center.z;
            
            // Scale the model to fit the view
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim === 0) {
              throw new Error('Model has zero dimensions');
            }
            
            const scale = 2.0 / maxDim; // Larger scale for better visibility
            model.scale.set(scale, scale, scale);
            
            // Set initial camera position to better view the model
            camera.position.set(0, 0.5, 4); // Adjust camera height slightly to better frame humanoid models
            controls.update();
            
            // Debug info about model
            console.log("ModelViewer: Model position after adjustment:", model.position);
            console.log("ModelViewer: Model scale after adjustment:", model.scale);
            console.log("ModelViewer: Model size:", size);
            console.log("ModelViewer: Camera position:", camera.position);
            
            // Add model to scene
            scene.add(model);
            modelRef.current = model;
            
            // Force a render
            renderer.render(scene, camera);
            console.log("ModelViewer: Initial render complete");
            
            // Remove debug helpers
            // const gridHelper = new THREE.GridHelper(10, 10);
            // scene.add(gridHelper);
            
            // const axesHelper = new THREE.AxesHelper(5);
            // scene.add(axesHelper);
            
            // Notify that model is loaded
            if (onModelLoaded) {
              console.log("ModelViewer: Calling onModelLoaded callback");
              onModelLoaded();
            }
          } catch (err) {
            console.error("ModelViewer: Error processing model:", err);
            if (onError) onError(`Error processing model: ${err instanceof Error ? err.message : String(err)}`);
          }
        },
        (progress) => {
          console.log(`ModelViewer: Loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        },
        (error: any) => {
          clearTimeout(loadingTimeout);
          console.error("ModelViewer: Error loading model:", error);
          if (onError) onError(`Failed to load 3D model: ${error.message}`);
        }
      );
    } catch (err) {
      console.error("ModelViewer: Exception during model loading:", err);
      if (onError) onError(`Error setting up 3D viewer: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    // Cleanup function
    return () => {
      console.log("ModelViewer: Cleaning up");
      window.removeEventListener('resize', handleResize);
      
      if (sceneRef.current.frameId !== undefined) {
        cancelAnimationFrame(sceneRef.current.frameId);
      }
      
      if (containerRef.current && sceneRef.current.renderer) {
        containerRef.current.removeChild(sceneRef.current.renderer.domElement);
      }
      
      // Dispose of Three.js resources
      if (sceneRef.current.scene) {
        sceneRef.current.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
      
      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.dispose();
      }
      
      // Clear references
      modelRef.current = null;
      sceneRef.current = {};
    };
  }, [modelUrl, onError, onModelLoaded, parts]);

  // Toggle auto-rotation
  const toggleAutoRotate = () => {
    setAutoRotate(prev => !prev);
    if (sceneRef.current.controls) {
      sceneRef.current.controls.autoRotate = !autoRotate;
    }
  };

  // Effect to update controls when autoRotate state changes
  useEffect(() => {
    if (sceneRef.current.controls) {
      sceneRef.current.controls.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Apply customization to the 3D model
  useEffect(() => {
    if (!modelRef.current || !sceneRef.current.materials) {
      console.log("ModelViewer: Cannot apply customizations - model or materials not ready");
      return;
    }
    
    console.log("ModelViewer: Applying customizations:", customizations);
    
    // Apply customizations based on selected options without affecting camera position
    parts.forEach(part => {
      if (customizations[part.partId] && sceneRef.current.materials?.[part.partId]) {
        console.log(`ModelViewer: Applying color ${customizations[part.partId]} to part ${part.partId}`);
        // Apply material change
        const material = sceneRef.current.materials[part.partId];
        if (material instanceof THREE.MeshStandardMaterial) {
          material.color.set(customizations[part.partId]);
          material.needsUpdate = true;
        } else {
          console.warn(`ModelViewer: Material for part ${part.partId} is not a MeshStandardMaterial`);
        }
      }
    });
    
    // Force a render without changing camera position
    if (sceneRef.current.renderer && sceneRef.current.scene && sceneRef.current.camera) {
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    }
  }, [customizations, parts]);

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden relative">
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '600px' }}
      />
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500 pointer-events-none z-10">
        Drag to rotate • Scroll to zoom
      </div>
      
      {/* Auto-rotate toggle button */}
      <button 
        onClick={toggleAutoRotate}
        className="absolute top-4 right-4 bg-black rounded-full p-2 shadow-md hover:shadow-lg transition-shadow z-20 focus:outline-none"
        title={autoRotate ? "Stop auto-rotation" : "Start auto-rotation"}
      >
        {autoRotate ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
     
    </div>
  );
};

// Create the forwarded ref component
const ModelViewer = forwardRef<ModelViewerRef, ModelViewerProps>(ModelViewerComponent);

// Export the component and the ref type
export default ModelViewer;
export type { ModelViewerRef };