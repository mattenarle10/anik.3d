'use client';
import { useState, FormEvent, useEffect } from 'react';
import { Product, updateProductStock } from '@/app/api/products';

interface StockHistoryItem {
  date: string;
  quantity: number;
  productId: string;
}

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onStockUpdated: (updatedProduct: Product) => void;
}

export default function AddStockModal({ 
  isOpen, 
  onClose, 
  product, 
  onStockUpdated 
}: AddStockModalProps) {
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [stockHistory, setStockHistory] = useState<StockHistoryItem[]>([]);

  // Load stock history from localStorage when modal opens
  useEffect(() => {
    if (isOpen && product) {
      const savedHistory = localStorage.getItem(`stock-history-${product.product_id}`);
      if (savedHistory) {
        try {
          setStockHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Error parsing stock history:', e);
          setStockHistory([]);
        }
      }
    }
  }, [isOpen, product]);

  const handleAddStock = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    setIsUpdating(true);
    setUpdateError('');
    
    try {
      // Send the request to update the product stock
      const result = await updateProductStock(product.product_id, quantityToAdd);
      
      // Show success message
      setUpdateSuccess(true);
      
      // Add to history
      const newHistoryItem: StockHistoryItem = {
        date: new Date().toISOString(),
        quantity: quantityToAdd,
        productId: product.product_id
      };
      
      const updatedHistory = [newHistoryItem, ...stockHistory.slice(0, 9)]; // Keep only the last 10 entries
      setStockHistory(updatedHistory);
      
      // Save to localStorage
      localStorage.setItem(`stock-history-${product.product_id}`, JSON.stringify(updatedHistory));
      
      // Notify parent component
      onStockUpdated(result);
      
      // Reset quantity input
      setQuantityToAdd(1);
      
    } catch (err) {
      console.error('Error updating stock:', err);
      setUpdateError('Failed to update stock. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-sm border border-black shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-montreal text-black">Add Stock</h2>
          <button 
            onClick={onClose}
            className="text-black hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="font-montreal text-black mb-1">Product:</p>
          <p className="font-montreal text-black font-semibold">{product.name}</p>
          <p className="font-montreal text-sm text-black mt-1">
            Current Stock: <span className={`font-semibold ${
              product.quantity > 10 ? 'text-green-600' : product.quantity > 0 ? 'text-yellow-600' : 'text-red-600'
            }`}>{product.quantity}</span>
          </p>
        </div>
        
        {updateSuccess ? (
          <div className="p-4 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-sm">
            <p className="font-montreal text-sm">Stock updated successfully!</p>
            <button
              onClick={() => setUpdateSuccess(false)}
              className="mt-2 px-4 py-1 bg-green-600 text-white font-montreal text-sm rounded-sm hover:bg-green-700"
            >
              Add More Stock
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddStock} className="mb-6">
            <div className="mb-4">
              <label htmlFor="quantity" className="block mb-1 font-montreal text-sm text-black">
                Quantity to Add
              </label>
              <input
                type="number"
                id="quantity"
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(Math.max(1, parseInt(e.target.value) || 0))}
                min="1"
                className="w-full px-4 py-2 border border-black font-montreal text-black focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
            
            {updateError && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-sm">
                <p className="font-montreal text-sm">{updateError}</p>
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
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-black text-white font-montreal hover:bg-white hover:text-black border border-black transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Add Stock'}
              </button>
            </div>
          </form>
        )}
        
        {/* Stock History Section */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-montreal font-semibold text-black mb-3">Stock Update History</h3>
          
          {stockHistory.length === 0 ? (
            <p className="text-sm font-montreal text-gray-500">No history available</p>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {stockHistory.map((item, index) => (
                <div key={index} className="mb-2 pb-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-montreal text-black">
                      +{item.quantity} units
                    </span>
                    <span className="text-xs font-montreal text-gray-500">
                      {formatDate(item.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}