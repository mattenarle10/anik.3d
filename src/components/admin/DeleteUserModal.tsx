'use client';
import { useState } from 'react';
import { deleteUserByAdmin } from '@/app/api/users';

interface DeleteUserModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onDelete: (userId: string) => void;
}

export default function DeleteUserModal({ userId, userName, onClose, onDelete }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await deleteUserByAdmin(userId);
      if (result) {
        setSuccess('User deleted successfully');
        onDelete(userId);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('An error occurred while deleting the user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-sm shadow-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">Delete User</h2>
          <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-sm">
              {success}
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700">
              Are you sure you want to delete the user <span className="font-semibold">{userName}</span>?
            </p>
            <p className="text-gray-700 mt-2">
              This action cannot be undone. All user data will be permanently removed.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-sm hover:bg-gray-100"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 border border-red-600 text-black rounded-sm hover:bg-red-50 disabled:opacity-70 flex items-center gap-2"
              disabled={loading}
            >
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              {loading ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
