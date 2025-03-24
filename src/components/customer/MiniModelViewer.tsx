// MiniModelViewer.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface MiniModelViewerProps {
  modelUrl: string;
  customizations?: {
    partId: string;
    color: string;
  }[];
  size?: 'small' | 'medium' | 'large';
}

const MiniModelViewer: React.FC<MiniModelViewerProps> = ({
  modelUrl,
  customizations = [],
  size = 'small'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    controls?: OrbitControls;
    frameId?: number;
  }>({});
  
  // Size classes based on the size prop
  const sizeClasses = {
    small: 'h-24 w-24',
    medium: 'h-32 w-32',
    large: 'h-40 w-40'
  };

  useEffect(() => {
    if (!modelUrl || !containerRef.current) return;

    // Scene setup with white background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 4); // Moved camera closer for clearer view
    
    // Renderer setup - improved for clarity
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      precision: 'mediump' // Better precision for clearer models
    });
    renderer.setClearColor(0xffffff, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(window.devicePixelRatio); // Better pixel ratio for clarity
    
    // Add renderer to DOM
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block'; // Ensure proper display
    
    if (containerRef.current) {
      // Clear container before adding new canvas
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      containerRef.current.appendChild(canvas);
    }
    
    // Update renderer size
    const updateRendererSize = () => {
      if (containerRef.current && renderer) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        renderer.setSize(width, height);
        if (camera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      }
    };
    
    // Add lighting for better clarity
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Increased intensity
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased intensity
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add a second directional light from another angle for better illumination
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-1, 0.5, -1);
    scene.add(directionalLight2);
    
    // Add orbit controls with limited functionality for mini viewer
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true; // Enable zooming
    controls.zoomSpeed = 1.0; // Standard zoom speed
    controls.autoRotate = false; // Disable auto-rotation
    controls.enableRotate = true; // Enable manual rotation
    controls.rotateSpeed = 1.0; // Standard rotation speed
    controls.enablePan = false; // Disable panning for simpler interaction
    
    // Set initial rotation for a good viewing angle
    camera.position.set(2, 1, 3);
    controls.update();
    
    // Load the 3D model
    const loader = new GLTFLoader();
    
    // Add error handling and fallback
    const loadModel = (url: string) => {
      console.log("Loading model from:", url);
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          
          // Center and scale the model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.0 / maxDim; // Scale to fit nicely in the viewport
          
          model.position.x = -center.x * scale;
          model.position.y = -center.y * scale;
          model.position.z = -center.z * scale;
          model.scale.set(scale, scale, scale);
          
          // Apply customizations
          if (customizations && customizations.length > 0) {
            model.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                const customization = customizations.find(c => 
                  child.name.toLowerCase().includes(c.partId.toLowerCase())
                );
                
                if (customization) {
                  if (child.material) {
                    // Clone the material to avoid affecting other instances
                    if (Array.isArray(child.material)) {
                      child.material = child.material.map(mat => {
                        if (mat) {
                          const newMat = mat.clone();
                          newMat.color.set(customization.color);
                          return newMat;
                        }
                        return new THREE.MeshStandardMaterial({ color: customization.color });
                      });
                    } else {
                      const newMaterial = child.material.clone();
                      newMaterial.color.set(customization.color);
                      child.material = newMaterial;
                    }
                  }
                }
              }
            });
          }
          
          scene.add(model);
          
          // Render once after model is loaded
          updateRendererSize();
          renderer.render(scene, camera);
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
          
          // If we get a 403 error or any other error, try to load a fallback model
          if (url !== '/models/default.glb') {
            console.log('Attempting to load fallback model');
            loadModel('/models/default.glb');
          } else {
            // Create a simple cube as a last resort fallback
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);
            
            // Render the fallback cube
            updateRendererSize();
            renderer.render(scene, camera);
          }
        }
      );
    };
    
    // Start loading the model
    loadModel(modelUrl);
    
    // Since we're not animating, we only need to render once
    const render = () => {
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    
    // Handle window resize
    const handleResize = () => {
      updateRendererSize();
      render(); // Re-render after resize
    };
    
    // Initial render and add event listeners
    updateRendererSize();
    render();
    window.addEventListener('resize', handleResize);
    
    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls
    };
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (sceneRef.current.controls) {
        sceneRef.current.controls.dispose();
      }
      
      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.dispose();
        
        if (containerRef.current && sceneRef.current.renderer.domElement) {
          containerRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
      }
      
      // Clear references
      sceneRef.current = {};
    };
  }, [modelUrl, customizations, size]);

  return (
    <div 
      ref={containerRef}
      className={`${sizeClasses[size]} relative overflow-hidden w-full h-full`}
      style={{ background: 'white' }}
    />
  );
};

export default MiniModelViewer;