// Define the User type
export type User = {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
  shipping_address?: string;
  phone?: string;
  orders_count?: number;
};

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://kebyzdods1.execute-api.us-east-2.amazonaws.com/dev';

/**
 * Fetch all users (admin only)
 * @returns Promise with array of users
 */
export const fetchAllUsers = async (): Promise<User[]> => {
  try {

    
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
  
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

/**
 * Fetch a specific user by ID (admin only)
 * @param userId ID of the user to fetch
 * @returns Promise with user data
 */
export const fetchUserById = async (userId: string): Promise<User | null> => {
  try {
    // Get the admin token from localStorage
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      throw new Error('Admin authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return null;
  }
};

/**
 * Get user profile (for logged in user)
 * @returns Promise with user profile data
 */
export const getUserProfile = async (): Promise<User | null> => {
  try {
    // Get the user token from localStorage
    const token = localStorage.getItem('userToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Update user profile information
 * @param userData User data to update
 * @returns Promise with updated user data
 */
export const updateUserProfile = async (userData: {
  name?: string;
  shipping_address?: string;
  phone?: string;
}): Promise<User | null> => {
  try {
    // Get the user token from localStorage
    const token = localStorage.getItem('userToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    } 
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};