// Define the OrderItem type
export type OrderItem = {
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  product_name?: string; // We'll populate this from the product data if needed
  customization_price?: number; // Price for customizations
  customization_details?: any[]; // Array of customization details
  model_url?: string; // URL to the model file
};

// Define the Order type
export type Order = {
  order_id: string;
  user_id: string;
  items: OrderItem[];
  created_at: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  total_amount: number;
  custom_model?: string;      // Single custom model URL (legacy support)
  custom_models?: string[];   // Array of custom model URLs for multiple customized items
};

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
/**
 * Fetch all orders (admin only)
 * @returns Promise with array of orders
 */
export const fetchAllOrders = async (): Promise<Order[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders`, {

    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
};

/**
 * Fetch orders for the current user
 * @returns Promise with array of user orders
 */
export const fetchUserOrders = async (): Promise<Order[]> => {
  try {
    // Get the user token from localStorage
    const token = localStorage.getItem('userToken');
    
    if (!token) {
      throw new Error('User authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}/users/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

/**
 * Create a new order
 * @param orderData Order data including items and shipping address
 * @param customModelFile Optional custom 3D model file
 * @returns Promise with the created order
 */
export const createOrder = async (
  orderData: {
    items: { 
      product_id: string; 
      quantity: number;
      customization_price?: number;
      customization_details?: any[];
    }[];
    shipping_address: string;
    total_price?: number;
    total_customization_price?: number;
  },
  customModelFile?: { file: string; file_name: string } | { files: string[]; file_names: string[] }
): Promise<{ message: string; order: Order }> => {
  try {
    // Get the user token from localStorage
    const token = localStorage.getItem('userToken');
    
    if (!token) {
      throw new Error('User authentication required');
    }
    
    // Calculate total customization price if not provided
    const totalCustomizationPrice = orderData.total_customization_price || 
      orderData.items.reduce((sum, item) => sum + (item.customization_price || 0) * item.quantity, 0);
    
    // Prepare items with customization details
    const enhancedItems = orderData.items.map(item => ({
      ...item,
      // Include customization price in the item to ensure backend includes it
      price_adjustment: item.customization_price || 0,
      // Ensure customization details are included
      customization_details: item.customization_details || []
    }));
    
    console.log('Creating order with data:', JSON.stringify({
      items: enhancedItems,
      shipping_address: orderData.shipping_address,
      has_custom_model: !!customModelFile,
      total_customization_price: totalCustomizationPrice
    }));
    
    // Check if we have multiple custom models or a single one
    const isMultipleModels = customModelFile && 'files' in customModelFile && Array.isArray(customModelFile.files);
    
    // Verify model URL(s) accessibility
    if (customModelFile) {
      if (isMultipleModels) {
        // Verify multiple model URLs
        const modelUrls = (customModelFile as { files: string[] }).files;
        console.log(`Verifying ${modelUrls.length} custom model URLs`);
        
        for (const url of modelUrls) {
          try {
            const modelResponse = await fetch(url, { 
              method: 'HEAD',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            if (!modelResponse.ok) {
              console.warn(`⚠️ Custom model URL ${url} returned ${modelResponse.status} ${modelResponse.statusText}`);
            } else {
              console.log(`✅ Custom model URL ${url} is accessible`);
            }
          } catch (urlCheckError) {
            console.warn(`Could not verify model URL accessibility for ${url}:`, urlCheckError);
          }
        }
      } else if ('file' in customModelFile && customModelFile.file) {
        // Verify single model URL
        console.log('Verifying custom model URL accessibility:', customModelFile.file);
        try {
          const modelResponse = await fetch(customModelFile.file, { 
            method: 'HEAD',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!modelResponse.ok) {
            console.warn(`⚠️ Custom model URL returned ${modelResponse.status} ${modelResponse.statusText}`);
            if (modelResponse.status === 403) {
              console.error('403 Forbidden error accessing model URL. This is likely due to S3 bucket permissions.');
              console.error('Make sure the S3 bucket has proper CORS and public read access configured.');
            }
          } else {
            console.log('✅ Custom model URL is accessible');
          }
        } catch (urlCheckError) {
          console.warn('Could not verify model URL accessibility:', urlCheckError);
        }
      }
    }
    
    // Prepare the request data with customization details
    const requestData: {
      items: typeof enhancedItems;
      shipping_address: string;
      total_price?: number;
      total_customization_price: number;
      include_customization_in_total: boolean;
      custom_model?: string;
      file_name?: string;
      custom_models?: string[];
      file_names?: string[];
    } = {
      ...orderData,
      items: enhancedItems, // Use enhanced items with price_adjustment
      total_customization_price: totalCustomizationPrice,
      // Include a flag to tell backend to include customization in price
      include_customization_in_total: true
    };

    // Add custom model information based on what was provided
    if (customModelFile) {
      if ('files' in customModelFile && Array.isArray(customModelFile.files)) {
        // Add multiple custom model URLs
        requestData.custom_models = customModelFile.files;
        
        // Check if file_names exists
        if ('file_names' in customModelFile && Array.isArray(customModelFile.file_names)) {
          requestData.file_names = customModelFile.file_names;
        } else {
          // Generate default file names if not provided
          requestData.file_names = customModelFile.files.map((_, index) => `model_${index}.glb`);
          console.warn('No file_names provided, using generated names');
        }
        
        console.log(`Adding ${customModelFile.files.length} custom model URLs to order`);
      } else if ('file' in customModelFile) {
        // Add single custom model URL (for backward compatibility)
        requestData.custom_model = customModelFile.file;
        requestData.file_name = customModelFile.file_name;
        console.log('Adding single custom model URL to order:', customModelFile.file);
      }
    }
    
    console.log('Sending order request to API');
    
    // Send the request to create the order
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    // Check for error responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`Order creation failed with status: ${response.status}`, errorText);
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    // Parse the response
    const result = await response.json();
    console.log('Order created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Update order status (admin only)
 * @param orderId ID of the order to update
 * @param status New status value
 * @returns Promise with the updated order
 */
export const updateOrderStatus = async (
  orderId: string,
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Delete an order (admin only)
 * @param orderId ID of the order to delete
 * @returns Promise with success message
 */
export const deleteOrder = async (orderId: string): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

/**
 * Helper function to format date string to a more readable format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export const formatOrderDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get the status color for UI display
 * @param status Order status
 * @returns CSS color class
 */
export const getStatusColor = (status: Order['status']): string => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'processing':
      return 'text-blue-600 bg-blue-100';
    case 'shipped':
      return 'text-purple-600 bg-purple-100';
    case 'delivered':
      return 'text-green-600 bg-green-100';
    case 'cancelled':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Get the status progress percentage for progress bar
 * @param status Order status
 * @returns Progress percentage (0-100)
 */
export const getStatusProgress = (status: Order['status']): number => {
  switch (status) {
    case 'pending': return 25;
    case 'processing': return 50;
    case 'shipped': return 75;
    case 'delivered': return 100;
    case 'cancelled': return 0;
    default: return 0;
  }
};

/**
 * Get the status step number (1-4) for display
 * @param status Order status
 * @returns Step number (1-4, or 0 for cancelled)
 */
export const getStatusStep = (status: Order['status']): number => {
  switch (status) {
    case 'pending': return 1;
    case 'processing': return 2;
    case 'shipped': return 3;
    case 'delivered': return 4;
    case 'cancelled': return 0;
    default: return 0;
  }
};

/**
 * Generate a pre-signed URL for uploading a 3D model file
 * @param fileName Name of the file to upload
 * @param fileType MIME type of the file
 * @param isMultiple Whether to generate multiple upload URLs
 * @param fileCount Number of files to generate URLs for (if isMultiple is true)
 * @returns Promise with upload URL and model URL
 */
export const generateOrderUploadUrl = async (
  fileName: string,
  fileType: string,
  isMultiple: boolean = false,
  fileCount: number = 1
): Promise<{
  uploadUrl?: string;
  modelUrl?: string;
  fileKey?: string;
  uploadUrls?: string[];
  modelUrls?: string[];
  fileKeys?: string[];
}> => {
  try {
    // Get the user token from localStorage
    const token = localStorage.getItem('userToken');
    
    if (!token) {
      throw new Error('User authentication required');
    }
    
    console.log('Requesting presigned URL for:', fileName, fileType, isMultiple ? `(${fileCount} files)` : '');
    
    // Add timestamp to avoid caching issues
    const endpoint = `${API_BASE_URL}/orders/generate-upload-url?_t=${Date.now()}`;
    console.log('Using endpoint:', endpoint);
    
    const requestBody = {
      fileName,
      fileType,
      isMultiple,
      fileCount
    };
    console.log('Request payload:', JSON.stringify(requestBody));
    
    // IMPORTANT: Keep the headers minimal for the API request
    // We should only include what's absolutely necessary
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
        // Remove cache control headers as they might cause issues
        // 'Cache-Control': 'no-cache, no-store, must-revalidate',
        // 'Pragma': 'no-cache'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Presigned URL response status:', response.status);
    
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (textError) {
        errorText = 'Could not extract error details';
      }
      
      console.error('Failed to get order upload URL:', response.status, errorText);
      throw new Error(`Failed to get order upload URL: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Successfully got presigned URL(s)');
    
    if (isMultiple) {
      console.log(`Received ${result.uploadUrls?.length || 0} upload URLs`);
      console.log(`Received ${result.modelUrls?.length || 0} model URLs`);
    } else {
      console.log('Upload URL:', result.uploadUrl);
      console.log('Model URL:', result.modelUrl);
    }
    
    // Verify the URLs are properly formed
    try {
      if (isMultiple) {
        // Verify multiple URLs if they exist
        if (result.uploadUrls && result.modelUrls) {
          for (const url of result.uploadUrls) {
            new URL(url);
          }
          for (const url of result.modelUrls) {
            new URL(url);
          }
        }
      } else {
        // Verify single URL
        if (result.uploadUrl) new URL(result.uploadUrl);
        if (result.modelUrl) new URL(result.modelUrl);
      }
    } catch (urlError) {
      console.error('Invalid URL in response:', urlError);
      throw new Error('Server returned invalid URL');
    }
    
    // Check if the upload URL has an expiration parameter
    if (!isMultiple && result.uploadUrl) {
      const uploadUrlObj = new URL(result.uploadUrl);
      const hasExpiration = uploadUrlObj.searchParams.has('X-Amz-Expires') || 
                            uploadUrlObj.searchParams.has('Expires');
      if (!hasExpiration) {
        console.warn('Warning: Upload URL does not appear to have an expiration parameter');
      }
    } else if (isMultiple && result.uploadUrls && result.uploadUrls.length > 0) {
      // Check the first URL for expiration as an example
      const uploadUrlObj = new URL(result.uploadUrls[0]);
      const hasExpiration = uploadUrlObj.searchParams.has('X-Amz-Expires') || 
                            uploadUrlObj.searchParams.has('Expires');
      if (!hasExpiration) {
        console.warn('Warning: Upload URLs may not have expiration parameters');
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error generating order upload URL:', error);
    throw error;
  }
};