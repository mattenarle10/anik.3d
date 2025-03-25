'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { User, fetchAllUsers } from '../../api/users';
import UpdateUserModal from '../../../components/admin/UpdateUserModal';
import DeleteUserModal from '../../../components/admin/DeleteUserModal';

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToDeleteName, setUserToDeleteName] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check if admin is logged in
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    if (!isAdminLoggedIn) {
      router.push('/admin/login');
      return;
    }
    
    // Fetch users using the API service
    const getUsers = async () => {
      try {
        const data = await fetchAllUsers();
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    getUsers();
  }, [router]);

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Sort users based on sort configuration
  useEffect(() => {
    if (!sortConfig) return;
    
    const sortedUsers = [...filteredUsers].sort((a, b) => {
      // Handle undefined values safely
      const aValue = a[sortConfig.key as keyof User];
      const bValue = b[sortConfig.key as keyof User];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredUsers(sortedUsers);
  }, [sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const handleUpdateUser = (user: User) => {
    setSelectedUser(user);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setUserToDelete(userId);
    setUserToDeleteName(userName);
    setIsDeleteModalOpen(true);
  };



  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    setCopiedUserId(userId);
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  const handleCloseModal = () => {
    setIsUpdateModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
    setUserToDelete(null);
  };

  const updateUsersList = (updatedUser: User) => {
    const updatedUsers = users.map(user => 
      user.user_id === updatedUser.user_id ? updatedUser : user
    );
    setUsers(updatedUsers);
    setFilteredUsers(updatedUsers);
  };

  const removeUserFromList = (userId: string) => {
    const updatedUsers = users.filter(user => user.user_id !== userId);
    setUsers(updatedUsers);
    setFilteredUsers(updatedUsers);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tab navigation */}
      <div className="flex border-b border-gray-100 mb-8">
        <a href="/admin/products" className="mr-8 pb-2 font-montreal text-black opacity-50">Products</a>
        <a href="/admin/orders" className="mr-8 pb-2 font-montreal text-black opacity-50">Orders</a>
        <div className="mr-8 pb-2 border-b-2 border-black font-montreal text-black">Users</div>
      </div>
      
      <div className="border border-black rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 bg-white">
        <div className="flex justify-between items-center mb-8">
          {/* Improved search bar */}
          <div className="relative w-1/2">
            <input
              type="text"
              placeholder="Find users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-black font-montreal text-black placeholder-black placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <div className="absolute right-3 top-2.5 text-black">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-black">
                <th
                  className="py-3 text-left font-montreal text-black bg-white cursor-pointer group"
                  onClick={() => handleSort('user_id')}
                >
                  <div className="flex items-center">
                    ID
                    <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig?.key === 'user_id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </div>
                </th>
                <th
                  className="py-3 text-left font-montreal text-black bg-white cursor-pointer group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </div>
                </th>
                <th
                  className="py-3 text-left font-montreal text-black bg-white cursor-pointer group"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email
                    <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig?.key === 'email' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </div>
                </th>
                <th
                  className="py-3 text-left font-montreal text-black bg-white cursor-pointer group"
                  onClick={() => handleSort('date_created')}
                >
                  <div className="flex items-center">
                    Date Created
                    <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig?.key === 'date_created' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </div>
                </th>

                <th
                  className="py-3 text-left font-montreal text-black bg-white"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-montreal text-black">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 whitespace-nowrap">
                      <div className="font-medium group relative flex items-center" title="Click to copy user ID">
                        <span className="font-montreal text-black">{user.user_id.substring(0, 8)}...</span>
                        <button
                          onClick={() => handleCopyUserId(user.user_id)}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedUserId === user.user_id ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                          )}
                        </button>
                        {copiedUserId === user.user_id && (
                          <span className="absolute -top-8 left-0 bg-black text-white text-xs py-1 px-2 rounded-sm shadow-md z-10">
                            Copied!
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 whitespace-nowrap">
                      <div className="font-montreal text-black">{user.name}</div>
                    </td>
                    <td className="py-4 whitespace-nowrap">
                      <div className="font-montreal text-black">{user.email}</div>
                    </td>
                    <td className="py-4 whitespace-nowrap">
                      <div className="font-montreal text-black">{formatDate(user.date_created)}</div>
                    </td>

                    <td className="py-4 whitespace-nowrap">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleUpdateUser(user)}
                          className="text-black hover:text-gray-700 transition-colors"
                          title="Edit User"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.user_id, user.name)}
                          className="text-black hover:text-red-600 transition-colors"
                          title="Delete User"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Update User Modal */}
      {isUpdateModalOpen && selectedUser && (
        <UpdateUserModal
          user={selectedUser}
          onClose={handleCloseModal}
          onUpdate={updateUsersList}
        />
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && userToDelete && (
        <DeleteUserModal
          userId={userToDelete}
          userName={userToDeleteName}
          onClose={handleCloseModal}
          onDelete={removeUserFromList}
        />
      )}


      </div>
    </div>
  );
}
