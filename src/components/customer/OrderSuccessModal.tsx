// /src/components/customer/OrderSuccessModal.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderSuccessModalProps {
  isOpen?: boolean;
  onClose: () => void;
  orderId?: string;
}

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ isOpen = true, onClose, orderId }) => {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Auto-redirect to orders page after 5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRedirecting(true);
            // Use setTimeout to ensure state updates before redirect
            setTimeout(() => {
              onClose();
              router.push('/orders');
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isOpen, onClose, router]);

  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full animate-slideUp">
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-scaleIn">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold font-montreal mb-4 text-center text-black">Thank You for Your Order!</h2>
        
        {orderId && (
          <p className="text-center text-gray-600 mb-2">
            Order #{orderId.slice(-8)}
          </p>
        )}
        
        <p className="text-gray-600 mb-6 text-center">
          We&apos;ve received your purchase and will begin processing it right away. You&apos;ll receive updates as your order progresses.
        </p>
        
        <div className="relative w-full h-1 bg-gray-200 rounded-full mb-4">
          <div className="animate-progressBar h-full bg-green-500 rounded-full"></div>
        </div>
        
        <p className="text-sm text-gray-500 text-center mb-6">
          {isRedirecting 
            ? "Redirecting to your orders..." 
            : `Redirecting to your orders in ${timeLeft} seconds...`}
        </p>
        
        <div className="flex justify-between">
          <button
            onClick={() => {
              onClose();
              router.push('/products');
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Continue Shopping
          </button>
          
          <button
            onClick={() => {
              onClose();
              router.push('/orders');
            }}
            className="px-4 py-2 text-sm font-medium bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            View My Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessModal;