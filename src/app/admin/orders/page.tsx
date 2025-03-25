'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Order, fetchAllOrders, deleteOrder } from '../../api/orders';
import { User, fetchAllUsers, fetchUserById } from '../../api/users';
import ViewOrderItemsModal from '../../../components/admin/ViewOrderItemsModal';
// ViewModelModal is used in the JSX below
import ViewModelModal from '../../../components/admin/ViewModelModal';
import UpdateOrderStatusModal from '../../../components/admin/UpdateOrderStatusModal';
import ViewCustomerModal from '../../../components/admin/ViewCustomerModal';
import MiniModelViewer from '../../../components/customer/MiniModelViewer';

// Define valid sort keys including special cases
type SortKey = keyof Order | 'items.length';

// Define the valid order status types
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Define type for order items to avoid using 'any'
type OrderItemType = {
  product_id: string;
  product_name?: string;
  quantity: number;
  price: number;
  [key: string]: unknown;
};

export default function AdminOrders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [modelViewerUrl, setModelViewerUrl] = useState<string | null>(null);
  const [viewingItems, setViewingItems] = useState<{
    orderId: string;
    items: OrderItemType[];
    customModelUrl?: string;
    customModelUrls?: string[];
    total_amount: number;
  } | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<{
    userId: string;
    userData: User | null;
  } | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: 'asc' | 'desc';
  }>({
    key: 'created_at',
    direction: 'desc',
  });
  const [editingStatus, setEditingStatus] = useState<{
    orderId: string;
    currentStatus: OrderStatus;
  } | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Check if admin is logged in
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    if (!isAdminLoggedIn) {
      router.push('/admin/login');
      return;
    }

    const loadOrders = async () => {
      try {
        setLoading(true);
        const allOrders = await fetchAllOrders();
        setOrders(allOrders);
        setFilteredOrders(allOrders);

        // Fetch all users
        const allUsers = await fetchAllUsers();
        const usersMap = new Map<string, User>();
        allUsers.forEach((user) => {
          usersMap.set(user.user_id, user);
        });
        setUsers(usersMap);

        setLoading(false);
      } catch (error) {
        console.error('Error loading orders:', error);
        setError('Failed to load orders. Please try again.');
        setLoading(false);
      }
    };

    loadOrders();
  }, [router]);

  // Memoize filtered orders to avoid unnecessary re-renders
  const memoizedFilteredOrders = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return orders.filter((order) =>
      order.order_id.toLowerCase().includes(lowerCaseSearch) ||
      order.status.toLowerCase().includes(lowerCaseSearch) ||
      order.shipping_address.toLowerCase().includes(lowerCaseSearch) ||
      (users.get(order.user_id)?.name || '').toLowerCase().includes(lowerCaseSearch) ||
      (users.get(order.user_id)?.email || '').toLowerCase().includes(lowerCaseSearch)
    );
  }, [orders, searchTerm, users]);

  // Update filtered orders when search or sort changes
  useEffect(() => {
    setFilteredOrders(memoizedFilteredOrders);
  }, [memoizedFilteredOrders]);

  // Optimize user data lookup with a memoized function
  const getUserData = useCallback((userId: string) => {
    return users.get(userId) || null;
  }, [users]);

  // Define handleCloseModal with useCallback to prevent dependency changes on every render
  const handleCloseModal = useCallback(() => {
    // If we're viewing a model, just close the model viewer but keep the order items open
    if (modelViewerUrl) {
      setModelViewerUrl(null);
    } else {
      // Otherwise close everything
      setModelViewerUrl(null);
      setViewingItems(null);
      setEditingStatus(null);
      setViewingCustomer(null);
      setDeletingOrder(null);
    }
  }, [modelViewerUrl]);

  // Handle keyboard events for modals (Escape key to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };

    if (
      viewingItems ||
      modelViewerUrl ||
      editingStatus ||
      viewingCustomer ||
      deletingOrder
    ) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent scrolling on body when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [
    viewingItems,
    modelViewerUrl,
    editingStatus,
    viewingCustomer,
    deletingOrder,
    handleCloseModal, // Added missing dependency
  ]);

  // Sort orders based on sort configuration
  useEffect(() => {
    if (!sortConfig) return;

    const sortedOrders = [...memoizedFilteredOrders].sort((a, b) => {
      if (sortConfig.key === 'created_at') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (sortConfig.key === 'total_amount') {
        return sortConfig.direction === 'asc'
          ? a.total_amount - b.total_amount
          : b.total_amount - a.total_amount;
      }

      // Special case for items array length
      if (sortConfig.key === 'items' || sortConfig.key === 'items.length') {
        return sortConfig.direction === 'asc'
          ? a.items.length - b.items.length
          : b.items.length - a.items.length;
      }

      if (sortConfig.key === 'status') {
        return sortConfig.direction === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }

      // For other string properties
      if (
        typeof a[sortConfig.key as keyof Order] === 'string' &&
        typeof b[sortConfig.key as keyof Order] === 'string'
      ) {
        return sortConfig.direction === 'asc'
          ? (a[sortConfig.key as keyof Order] as string).localeCompare(
              b[sortConfig.key as keyof Order] as string
            )
          : (b[sortConfig.key as keyof Order] as string).localeCompare(
              a[sortConfig.key as keyof Order] as string
            );
      }

      return 0;
    });

    setFilteredOrders(sortedOrders);
  }, [sortConfig, memoizedFilteredOrders]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';

    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
  };

  const handleViewModel = (modelUrl: string | undefined) => {
    if (modelUrl) {
      setModelViewerUrl(modelUrl);
    }
  };

  const handleViewItems = (orderId: string, items: OrderItemType[], customModelUrl?: string, customModelUrls?: string[]) => {
    const order = orders.find((o) => o.order_id === orderId);
    setViewingItems({
      orderId,
      items,
      customModelUrl,
      customModelUrls,
      total_amount: order?.total_amount || 0
    });
  };

  const handleViewCustomer = async (userId: string) => {
    // Check if we already have the user data in our map
    let userData = getUserData(userId);

    // If not in our map, fetch it directly
    if (!userData) {
      try {
        userData = await fetchUserById(userId);
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
      }
    }

    setViewingCustomer({ userId, userData });
  };

  // handleCloseModal is now defined above

  // Function to handle opening the status update modal
  const handleEditStatus = (orderId: string, currentStatus: string) => {
    setEditingStatus({
      orderId,
      currentStatus: currentStatus as OrderStatus,
    });
  };

  // Used when an order status is updated - referenced in UpdateOrderStatusModal
  const refreshOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await fetchAllOrders();
      setOrders(allOrders);
      setFilteredOrders(allOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error reloading orders:', error);
      setError('Failed to refresh orders. Please try again.');
      setLoading(false);
    }
  };

  // Update a single order's status in the UI without reloading all orders
  const updateOrderStatusLocally = (orderId: string, newStatus: OrderStatus) => {
    const updatedOrders = orders.map((order) => {
      if (order.order_id === orderId) {
        return { ...order, status: newStatus };
      }
      return order;
    });

    setOrders(updatedOrders);
    setFilteredOrders(
      filteredOrders.map((order) => {
        if (order.order_id === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      })
    );
  };

  // Function to copy order ID to clipboard
  const copyOrderId = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderId)
      .then(() => {
        setCopiedOrderId(orderId);
        setTimeout(() => setCopiedOrderId(null), 2000); // Reset after 2 seconds
      })
      .catch((err) => {
        console.error('Failed to copy order ID:', err);
      });
  };

  // Function to handle order deletion
  const handleDeleteOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingOrder(orderId);
  };

  // Function to confirm and execute order deletion
  const confirmDeleteOrder = async () => {
    if (!deletingOrder) return;

    try {
      setIsDeleting(true);
      await deleteOrder(deletingOrder);

      // Update the orders list by removing the deleted order
      const updatedOrders = orders.filter((order) => order.order_id !== deletingOrder);
      setOrders(updatedOrders);
      setFilteredOrders(filteredOrders.filter((order) => order.order_id !== deletingOrder));

      // Close the modal
      setDeletingOrder(null);
      setIsDeleting(false);
    } catch (error) {
      console.error('Error deleting order:', error);
      setError('Failed to delete order. Please try again.');
      setIsDeleting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time ago for status updates - used in the rendered JSX below
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (seconds > 0) {
      return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Tab navigation */}
        <div className="flex border-b border-gray-100 mb-8">
          <a href="/admin/products" className="mr-8 pb-2 font-montreal text-black opacity-50">Products</a>
          <div className="mr-8 pb-2 border-b-2 border-black font-montreal text-black">Orders</div>
          <a href="/admin/users" className="mr-8 pb-2 font-montreal text-black opacity-50">Users</a>
        </div>
        
        <div className="border border-black rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 bg-white">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tab navigation */}
      <div className="flex border-b border-gray-100 mb-8">
        <a href="/admin/products" className="mr-8 pb-2 font-montreal text-black opacity-50">Products</a>
        <div className="mr-8 pb-2 border-b-2 border-black font-montreal text-black">Orders</div>
        <a href="/admin/users" className="mr-8 pb-2 font-montreal text-black opacity-50">Users</a>
      </div>

      <div className="border border-black rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 bg-white">
        <div className="flex justify-between items-center mb-8">
          {/* Improved search bar */}
          <div className="relative w-1/2">
            <input
              type="text"
              placeholder="Find orders by ID, status, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-black font-montreal text-black placeholder-black placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <div className="absolute right-3 top-2.5 text-black">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-sm">
            <p className="font-montreal text-sm">{error}</p>
          </div>
        )}

        {filteredOrders.length === 0 && !error ? (
          <div className="py-8 text-center">
            <p className="text-lg font-montreal text-black">
              {searchTerm ? "No orders match your search." : "No orders found."}
            </p>
          </div>
        ) : (
          <div
            className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b border-black">
                  <th className="py-3 text-left font-montreal text-black bg-white">
                    ID
                  </th>
                  <th className="py-3 text-left font-montreal text-black bg-white">
                    Date
                  </th>
                  <th
                    className="py-3 text-left font-montreal text-black cursor-pointer group bg-white"
                    onClick={() => handleSort('user_id')}
                  >
                    <div className="flex items-center">
                      Customer
                      <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === 'user_id' ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : (
                          '↕'
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 text-left font-montreal text-black bg-white">
                    Items
                  </th>
                  <th
                    className="py-3 text-left font-montreal text-black cursor-pointer group bg-white"
                    onClick={() => handleSort('total_amount')}
                  >
                    <div className="flex items-center">
                      Total
                      <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === 'total_amount' ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : (
                          '↕'
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-3 text-left font-montreal text-black cursor-pointer group bg-white"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === 'status' ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : (
                          '↕'
                        )}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.order_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 font-montreal text-black">
                      <div
                        className="font-medium group relative flex items-center"
                        title="Click to copy order ID"
                      >
                        <span>{order.order_id.substring(0, 8)}...</span>
                        <button
                          onClick={(e) => copyOrderId(order.order_id, e)}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4a2 2 0 012 2v4m-4 4h10a2 2 0 002-2V9a2 2 0 00-2-2h-4m-6 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2m0-6h6a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                        {copiedOrderId === order.order_id && (
                          <span
                            className="absolute -top-8 left-0 bg-black text-white text-xs py-1 px-2 rounded-sm shadow-md z-10"
                          >
                            Copied!
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 font-montreal text-black">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-4 font-montreal text-black">
                      <div
                        className="font-medium cursor-pointer hover:text-gray-700 transition-colors flex items-center group"
                        onClick={() => handleViewCustomer(order.user_id)}
                        title="Click to view customer details"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>
                          {users.get(order.user_id)?.name || `User #${order.user_id.substring(0, 6)}`}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </td>
                    <td className="py-4 font-montreal text-black">
                      <div
                        className="font-medium flex items-center cursor-pointer hover:text-gray-700 transition-colors group"
                        onClick={() => handleViewItems(
                          order.order_id, 
                          order.items, 
                          order.custom_model,
                          order.custom_models
                        )}
                        title="Click to view order items"
                      >
                        <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </td>
                    <td className="py-4 font-montreal text-black font-bold">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="py-4 font-montreal">
                      <div className="flex items-center">
                        <div
                          className="inline-flex items-center cursor-pointer group mr-3"
                          title="Click to update status"
                          onClick={() => handleEditStatus(order.order_id, order.status)}
                        >
                          <span
                            className={`px-3 py-1.5 text-xs rounded-sm font-medium ${
                              order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : order.status === 'processing'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : order.status === 'shipped'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : order.status === 'delivered'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>

                        <button
                          onClick={(e) => handleDeleteOrder(order.order_id, e)}
                          className="text-gray-400 hover:text-red-600 transition-colors ml-1"
                          title="Delete order"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewingItems && (
        <ViewOrderItemsModal
          isOpen={!!viewingItems}
          onClose={handleCloseModal}
          orderId={viewingItems.orderId}
          items={viewingItems.items}
          customModelUrl={viewingItems.customModelUrl}
          customModelUrls={viewingItems.customModelUrls}
          onViewModel={handleViewModel}
          total_amount={viewingItems.total_amount}
        />
      )}

      {modelViewerUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white w-full max-w-4xl h-[80vh] flex flex-col rounded-lg shadow-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-medium">3D Model Viewer</h3>
              <button 
                onClick={() => setModelViewerUrl(null)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close model viewer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-grow bg-white relative">
              <div className="absolute inset-0">
                <MiniModelViewer modelUrl={modelViewerUrl} size="large" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-center">
                <p>Scroll to zoom • Click and drag to rotate the model</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingStatus && (
        <UpdateOrderStatusModal
          isOpen={!!editingStatus}
          onClose={handleCloseModal}
          orderId={editingStatus.orderId}
          currentStatus={editingStatus.currentStatus}
          onUpdateStatus={updateOrderStatusLocally}
        />
      )}

      {viewingCustomer && (
        <ViewCustomerModal
          isOpen={!!viewingCustomer}
          onClose={handleCloseModal}
          userId={viewingCustomer.userId}
          userData={viewingCustomer.userData}
          orders={filteredOrders}
          formatDate={formatDate}
        />
      )}

      {/* Delete Order Confirmation Modal */}
      {deletingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 font-montreal text-black">
              Confirm Delete
            </h2>
            <p className="mb-6 font-montreal text-gray-800">
              Are you sure you want to delete order #{deletingOrder.substring(0, 8)}...? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 transition-colors font-montreal"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteOrder}
                className="px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors font-montreal flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}