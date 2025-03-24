'use client';
import { useState } from 'react';
import { deleteProduct } from '@/app/api/products';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  productName: string;
  onProductDeleted: (productId: string) => void;
}

export default function DeleteProductModal({ 
  isOpen, 
  onClose, 
  productId, 
  productName,
  onProductDeleted 
}: DeleteProductModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const handleDeleteProduct = async () => {
    if (!productId) return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      // Send the request to delete the product
      await deleteProduct(productId);
      
      // Show success message
      setDeleteSuccess(true);
      
      // Notify parent component
      onProductDeleted(productId);
      
      // Close modal after delay
      setTimeout(() => {
        resetState();
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error deleting product:', err);
      setDeleteError('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetState = () => {
    setDeleteError('');
    setDeleteSuccess(false);
  };

  if (!isOpen || !productId) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-sm border border-black shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-montreal text-black">Delete Product</h2>
          <button 
            onClick={onClose}
            className="text-black hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {deleteSuccess ? (
          <div className="p-4 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-sm">
            <p className="font-montreal text-sm">Product deleted successfully!</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="font-montreal text-black mb-2">
                Are you sure you want to delete this product?
              </p>
              <p className="font-montreal text-sm text-black font-semibold">
                {productName}
              </p>
              <p className="font-montreal text-sm text-red-600 mt-4">
                This action cannot be undone.
              </p>
            </div>
            
            {deleteError && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-sm">
                <p className="font-montreal text-sm">{deleteError}</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 mr-2 border border-black text-black font-montreal hover:bg-gray-100 transition-colors rounded-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="px-6 py-2 bg-red-600 text-white font-montreal hover:bg-red-700 border border-red-600 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}