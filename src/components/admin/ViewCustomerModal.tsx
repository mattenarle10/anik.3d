import React from 'react';
import { User } from '../../app/api/users';
import { Order } from '../../app/api/orders';

interface ViewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userData: User | null;
  orders: Order[];
  formatDate: (dateString: string) => string;
}

const ViewCustomerModal: React.FC<ViewCustomerModalProps> = ({
  isOpen,
  onClose,
  userId,
  userData,
  orders,
  formatDate
}) => {
  if (!isOpen) return null;

  // Get all orders for this user
  const userOrders = orders.filter(order => order.user_id === userId);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-sm max-w-md w-full shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-black text-xl font-montreal font-bold tracking-tight">Customer Details</h2>
          <button 
            onClick={onClose}
            className="text-black hover:text-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          {userData ? (
            <>
              <div className="bg-gray-50 p-4 rounded-sm border-l-2 border-black">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-montreal">Customer Name</h3>
                <p className="font-montreal font-medium text-black text-lg">{userData.name}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-sm">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-montreal">Email</h3>
                <p className="font-montreal text-black flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {userData.email}
                </p>
              </div>
              
              {userData.phone && (
                <div className="bg-gray-50 p-4 rounded-sm">
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-montreal">Phone</h3>
                  <p className="font-montreal text-black flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {userData.phone}
                  </p>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-sm">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-montreal">User ID</h3>
                <p className="font-montreal text-gray-600 text-sm font-mono">{userId}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-sm">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-montreal">Shipping Address</h3>
                <p className="font-montreal text-black flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{userData.shipping_address || userOrders[0]?.shipping_address || "No address provided"}</span>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 p-4 rounded-sm border-l-2 border-black">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-montreal">User ID</h3>
                <p className="font-montreal font-medium text-black text-lg">{userId}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-sm">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-montreal">Shipping Address</h3>
                <p className="font-montreal text-black flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{userOrders[0]?.shipping_address || "No address provided"}</span>
                </p>
              </div>
            </>
          )}
          
          <div className="bg-gray-50 p-4 rounded-sm">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-montreal">Order History</h3>
            <div className="flex items-center justify-between">
              <p className="font-montreal text-black flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {userOrders.length} order{userOrders.length !== 1 ? 's' : ''} placed
              </p>
              {userOrders.length > 0 && (
                <span className="text-xs font-montreal bg-black text-white px-2 py-1 rounded-sm">
                  ${userOrders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)} total
                </span>
              )}
            </div>
          </div>
          
          <div className="pt-4">
            <button 
              className="w-full py-2.5 bg-black text-white font-montreal text-sm hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCustomerModal;