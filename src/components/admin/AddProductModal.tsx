"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { generateUploadUrl, API_BASE_URL } from "@/app/api/products";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (newProduct: any) => void;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onProductCreated,
}: AddProductModalProps) {
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    category: "base",
  });
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if file is a GLB file
      if (file.name.endsWith(".glb")) {
        setModelFile(file);
        setUploadError("");
      } else {
        setModelFile(null);
        setUploadError("Please upload a GLB file");
      }
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();

    if (!modelFile) {
      setUploadError("Please upload a 3D model file");
      return;
    }

    try {
      setIsSubmitting(true);
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError("");

      console.log(
        `Preparing to upload file: ${modelFile.name} (${(modelFile.size / (1024 * 1024)).toFixed(2)} MB)`,
      );

      // Step 1: Get a presigned URL
      const { uploadUrl, modelUrl, fileKey } = await generateUploadUrl(
        modelFile.name,
        modelFile.type || "model/gltf-binary",
      );

      console.log("Received presigned URL:", uploadUrl);

      // Step 2: Upload file directly to S3 using the presigned URL
      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader(
          "Content-Type",
          modelFile.type || "model/gltf-binary",
        );

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100,
            );
            setUploadProgress(percentComplete);
            console.log(`Upload progress: ${percentComplete}%`);
          }
        };

        // Handle response
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log("File uploaded successfully to S3");
            resolve();
          } else {
            console.error(
              "S3 upload failed with status:",
              xhr.status,
              xhr.statusText,
            );
            reject(new Error(`S3 upload failed: ${xhr.statusText}`));
          }
        };

        // Handle errors
        xhr.onerror = () => {
          console.error("Network error during S3 upload");
          reject(new Error("Network error during S3 upload"));
        };

        // Send the file
        xhr.send(modelFile);
      });

      // Wait for the upload to complete
      await uploadPromise;

      // Step 3: Create the product with the S3 URL
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity),
        category: newProduct.category,
        model_url: modelUrl,
      };

      // Use the API endpoint to create the product
      const token = localStorage.getItem("adminToken") || "";
      const createProductResponse = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(productData),
      });

      if (!createProductResponse.ok) {
        throw new Error(
          `Failed to create product: ${createProductResponse.statusText}`,
        );
      }

      const createdProduct = await createProductResponse.json();
      console.log("Product created successfully:", createdProduct);

      // Show success message
      setUploadSuccess(true);

      // Notify parent component
      onProductCreated(createdProduct);

      // Close modal after delay
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error creating product:", error);
      setUploadError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: "",
      description: "",
      price: "",
      quantity: "",
      category: "base",
    });
    setModelFile(null);
    setUploadError("");
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-sm border border-black shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-montreal text-black">Add New Product</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
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

        {uploadSuccess ? (
          <div className="p-4 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-sm">
            <p className="font-montreal text-sm">
              Product created successfully!
            </p>
          </div>
        ) : (
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block mb-1 font-montreal text-sm text-black"
              >
                Product Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-black font-montreal text-black focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block mb-1 font-montreal text-sm text-black"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={newProduct.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-black font-montreal text-black focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="price"
                  className="block mb-1 font-montreal text-sm text-black"
                >
                  Price (₱)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={newProduct.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-black font-montreal text-black focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="block mb-1 font-montreal text-sm text-black"
                >
                  Initial Stock
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={newProduct.quantity}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-black font-montreal text-black focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="category"
                className="block mb-1 font-montreal text-sm text-black"
              >
                Category / Pose Type
              </label>
              <select
                id="category"
                name="category"
                value={newProduct.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-black font-montreal text-black focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="base">Base</option>
                <option value="sad">Sad</option>
                <option value="shy">Shy</option>
                <option value="wave">Wave</option>
                <option value="casual">Casual</option>
                <option value="cutesy">Cutesy</option>
                <option value="sassy">Sassy</option>
                <option value="crouch">Crouch</option>
                <option value="exercise">Exercise</option>
                <option value="walk">Walk</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="model_file"
                className="block mb-1 font-montreal text-sm text-black"
              >
                3D Model File (GLB format)
              </label>
              <div className="border border-black p-4 rounded-sm">
                {modelFile ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-montreal text-sm text-black">
                        {modelFile.name}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({(modelFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModelFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
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
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer px-4 py-2 bg-black text-white font-montreal hover:bg-white hover:text-black border border-black transition-colors rounded-sm"
                    >
                      Choose File
                      <input
                        id="file-upload"
                        type="file"
                        accept=".glb"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-2 text-xs text-center font-montreal text-gray-500">
                      Only GLB files are supported
                    </p>
                  </div>
                )}
              </div>
            </div>

            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-black h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {uploadError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-sm">
                <p className="font-montreal text-sm">{uploadError}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 mr-2 border border-black text-black font-montreal hover:bg-gray-100 transition-colors rounded-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || isSubmitting}
                className="px-6 py-2 bg-black text-white font-montreal hover:bg-white hover:text-black border border-black transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? "Creating..." : "Create Product"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
