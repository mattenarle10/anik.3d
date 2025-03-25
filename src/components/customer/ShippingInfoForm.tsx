'use client';
import React, { useState, useEffect } from 'react';
import { updateUserProfile } from '@/app/api/users';
import { toast } from 'react-hot-toast';

interface ShippingInfoFormProps {
  onUpdate?: () => void;
}

const ShippingInfoForm: React.FC<ShippingInfoFormProps> = ({ onUpdate }) => {
  const [shippingAddress, setShippingAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasShippingInfo, setHasShippingInfo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Get user data from localStorage on client side
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData.shipping_address) {
        setShippingAddress(parsedUserData.shipping_address);
        setHasShippingInfo(true);
      }
      if (parsedUserData.phone_number) {
        setPhoneNumber(parsedUserData.phone_number);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedUser = await updateUserProfile({
        shipping_address: shippingAddress,
        phone_number: phoneNumber
      });

      if (updatedUser) {
        // Update localStorage with new data
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          parsedUserData.shipping_address = shippingAddress;
          parsedUserData.phone_number = phoneNumber;
          localStorage.setItem('userData', JSON.stringify(parsedUserData));
        }

        toast.success('Shipping information updated successfully');
        setHasShippingInfo(true);
        setIsEditing(false);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error updating shipping information:', error);
      toast.error('Failed to update shipping information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 mb-4 rounded-lg border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-xl font-semibold font-montreal flex items-center text-black">
          <span className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </span>
          Shipping Information
        </h3>
        
        {hasShippingInfo && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-sm text-gray-600 hover:text-black transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Edit
          </button>
        )}
      </div>
      
      {(!hasShippingInfo || isEditing) ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="shippingAddress" className="block text-sm font-montreal mb-2 text-gray-700">
              Shipping Address
            </label>
            <input
              type="text"
              id="shippingAddress"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full p-3 border-b border-gray-300 focus:outline-none focus:border-black font-montreal bg-gray-50 rounded-sm"
              placeholder="Enter your shipping address"
              required
            />
          </div>
          
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-montreal mb-2 text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 border-b border-gray-300 focus:outline-none focus:border-black font-montreal bg-gray-50 rounded-sm"
              placeholder="Enter your phone number"
              required
            />
          </div>
          
          <div className="pt-3 flex space-x-3">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-3 text-sm font-montreal ${
                isLoading ? 'bg-gray-300' : 'bg-black text-white hover:bg-gray-800'
              } rounded-sm transition-colors`}
            >
              {isLoading ? 'Updating...' : 'Save Information'}
            </button>
            
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 text-sm font-montreal border border-gray-300 rounded-sm hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="space-y-4 bg-gray-50 p-4 rounded-sm border border-gray-100">
          <div>
            <p className="text-sm text-gray-600 font-montreal mb-1">Shipping Address:</p>
            <p className="font-montreal text-black">{shippingAddress || 'Not provided'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 font-montreal mb-1">Phone Number:</p>
            <p className="font-montreal text-black">{phoneNumber || 'Not provided'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingInfoForm;
