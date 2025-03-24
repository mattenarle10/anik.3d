'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '@/components/customer/layout';
import { getUserData, updateUserProfile } from '@/app/api/auth';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    shipping_address: '',
    phone: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('userToken');
        if (!token) {
          router.push('/login');
          return;
        }

        // Get user data from local storage
        const user = getUserData();
        if (user) {
          setUserData(user);
          setFormData({
            name: user.name || '',
            shipping_address: user.shipping_address || '',
            phone: user.phone || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load your profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await updateUserProfile({
        name: formData.name,
        shipping_address: formData.shipping_address,
        phone: formData.phone
      });

      if (result && result.user) {
        setUserData(result.user);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CustomerLayout userName={userData?.name} activePage={undefined}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout userName={userData?.name} activePage={undefined}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-medium mb-6">My Profile</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Email (read-only) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={userData?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Your email address cannot be changed</p>
                </div>
                
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black"
                  />
                </div>
                
                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black"
                    placeholder="e.g. (123) 456-7890"
                  />
                </div>
                
                {/* Shipping Address */}
                <div>
                  <label htmlFor="shipping_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Address
                  </label>
                  <textarea
                    id="shipping_address"
                    name="shipping_address"
                    rows={3}
                    value={formData.shipping_address || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black"
                    placeholder="Enter your full shipping address"
                  />
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Member Since</span>
                <span className="text-sm">
                  {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
