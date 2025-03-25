// Define the User type
export type User = {
  user_id: string;
  email: string;
  name: string;
  date_created: string;
  shipping_address?: string;
  phone_number?: string;
  orders_count?: number;
};

// API base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

/**
 * Fetch all users (admin only)
 * @returns Promise with array of users
 */
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    // Get the admin token from localStorage
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      throw new Error('Admin authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      // No headers needed
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
    // We'll use the users endpoint directly with a query parameter
    const response = await fetch(`${API_BASE_URL}/admin/users?userId=${userId}`);
    
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
    // Get the user ID from localStorage if available
    const userDataStr = localStorage.getItem('userData');
    let userId = '';
    
    if (userDataStr) {
      const user = JSON.parse(userDataStr);
      userId = user.user_id;
    } else {
      throw new Error('User data not found');
    }
    
    const response = await fetch(`${API_BASE_URL}/users/profile?userId=${userId}`);
    
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
  phone_number?: string;
}): Promise<User | null> => {
  try {
    // Get the user ID from localStorage if available
    const userDataStr = localStorage.getItem('userData');
    let userId = '';
    
    if (userDataStr) {
      const user = JSON.parse(userDataStr);
      userId = user.user_id;
    }
    
    const response = await fetch(`${API_BASE_URL}/users/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        ...userData
      })
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

/**
 * Delete user account
 * @returns Promise with success message
 */
export const deleteUserAccount = async (): Promise<{ message: string } | null> => {
  try {
    // Get the user ID from localStorage if available
    const userData = localStorage.getItem('userData');
    let userId = '';
    
    if (userData) {
      const user = JSON.parse(userData);
      userId = user.user_id;
    }
    
    const response = await fetch(`${API_BASE_URL}/users/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    } 
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting user account:', error);
    return null;
  }
};

/**
 * Update user by admin
 * @param userId User ID to update
 * @param userData User data to update
 * @returns Promise with updated user data
 */
export const updateUserByAdmin = async (userId: string, userData: {
  name?: string;
  email?: string;
  shipping_address?: string;
  phone_number?: string;
}): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        ...userData
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    } 
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    return null;
  }
};

/**
 * Delete user by admin
 * @param userId User ID to delete
 * @returns Promise with success message
 */
export const deleteUserByAdmin = async (userId: string): Promise<{ message: string } | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    } 
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    return null;
  }
};