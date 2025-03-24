'use client';
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Product, updateProduct } from '@/app/api/products';

interface UpdateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onProductUpdated: (updatedProduct: Product) => void;
}

export default function UpdateProductModal({ 
  isOpen, 
  onClose, 
  product, 
  onProductUpdated 
}: UpdateProductModalProps) {
  const [updatedProduct, setUpdatedProduct] = useState({
    name: '',
    description: '',
    price: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Update form when product changes
  useEffect(() => {
    if (product) {
      setUpdatedProduct({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
      });
    }
  }, [product]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdatedProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    setIsUpdating(true);
    setUpdateError('');
    
    try {
      // Prepare the request body
      const productData = {
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: parseFloat(updatedProduct.price),
      };
      
      // Send the request to update the product
      const result = await updateProduct(product.product_id, productData);
      
      // Show success message
      setUpdateSuccess(true);
      
      // Notify parent component
      onProductUpdated(result);
      
      // Close modal after delay
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error updating product:', err);
      setUpdateError('Failed to update product. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const resetForm = () => {
    setUpdateError('');
    setUpdateSuccess(false);
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-sm border border-black shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-montreal text-black">Update Product</h2>
          <button 
            onClick={onClose}
            className="text-black hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {updateSuccess ? (
          <div className="p-4 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-sm">
            <p className="font-montreal text-sm">Product updated successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1 font-montreal text-sm text-black">
                Product Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={updatedProduct.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-black font-montreal text-black focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block mb-1 font-montreal text-sm text-black">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={updatedProduct.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-black font-montreal text-black focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
            
            <div>
              <label htmlFor="price" className="block mb-1 font-montreal text-sm text-black">
                Price ($)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={updatedProduct.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-black font-montreal text-black focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
            
            {updateError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-sm">
                <p className="font-montreal text-sm">{updateError}</p>
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
                disabled={isUpdating}
                className="px-6 py-2 bg-black text-white font-montreal hover:bg-white hover:text-black border border-black transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}