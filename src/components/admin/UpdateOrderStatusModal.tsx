'use client';
import { useState } from 'react';

// Define the valid order status types
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface UpdateOrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  currentStatus: OrderStatus;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export default function UpdateOrderStatusModal({
  isOpen,
  onClose,
  orderId,
  currentStatus,
  onUpdateStatus
}: UpdateOrderStatusModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus);

  if (!isOpen) return null;

  const statuses: Array<{value: OrderStatus; label: string; color: string}> = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' }
  ];

  const updateOrderStatus = async () => {
    // Don't do anything if status hasn't changed
    if (selectedStatus === currentStatus) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      // Use the correct API base URL - this should match your API Gateway URL
      const apiBaseUrl = 'https://kebyzdods1.execute-api.us-east-2.amazonaws.com/dev';
      const response = await fetch(`${apiBaseUrl}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: selectedStatus }),
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || 'Failed to update order status');
        } else {
          // Handle non-JSON error response
          const textError = await response.text();
          console.error('Non-JSON error response:', textError);
          throw new Error(`Server error (${response.status}): Please check the API endpoint`);
        }
      }
      
      // Success - try to parse as JSON if possible
      if (isJson) {
        await response.json(); // We don't need the result, just confirming it's valid
      }
      
      // Update the UI with the new status without a full page reload
      onUpdateStatus(orderId, selectedStatus);
      onClose();
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-sm max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-montreal font-bold text-black">
            Update Order Status <span className="text-sm opacity-70">#{orderId.substring(0, 8)}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-black hover:text-gray-700"
            disabled={isUpdating}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="font-montreal mb-4 text-black text-lg">Select new status:</div>
          <div className="grid grid-cols-1 gap-3">
            {statuses.map(status => {
              const isCurrentStatus = status.value === currentStatus;
              const isSelected = status.value === selectedStatus;
              return (
                <button
                  key={status.value}
                  className={`px-4 py-3 text-left font-montreal text-sm ${
                    isSelected 
                      ? status.color
                      : 'bg-white hover:bg-gray-50'
                  } border ${isSelected ? 'border-current' : 'border-gray-200'} rounded-sm`}
                  onClick={() => {
                    if (!isUpdating) {
                      setSelectedStatus(status.value);
                    }
                  }}
                  disabled={isUpdating}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border ${isSelected ? 'border-current' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-current"></div>
                      )}
                    </div>
                    <span className={`font-medium ${isSelected ? '' : 'text-black'}`}>
                      {status.label}
                      {isCurrentStatus && <span className="ml-2 text-xs opacity-70">(current)</span>}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Confirmation button */}
          <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-montreal text-gray-600 hover:text-gray-800 mr-3"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              onClick={updateOrderStatus}
              disabled={isUpdating || selectedStatus === currentStatus}
              className={`px-4 py-2 text-sm font-montreal text-white bg-black hover:bg-gray-800 rounded-sm
                ${(isUpdating || selectedStatus === currentStatus) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isUpdating ? (
                <span className="flex items-center">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Updating...
                </span>
              ) : (
                'Confirm Update'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}