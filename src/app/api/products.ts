// Define the Product type
export type Product = {
    product_id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    model_url: string;
    category?: string;
  };
  
  // API base URL
  export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  
  /**
   * Fetch all products
   * @returns Promise with array of products
   */
  export const fetchProducts = async (): Promise<Product[]> => {
    try {


      const response = await fetch(`${API_BASE_URL}/products`, {
       
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  };
  
  /**
   * Fetch a single product by ID
   * @param productId The ID of the product to fetch
   * @returns Promise with product data
   */
  export const fetchProductById = async (productId: string): Promise<Product> => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  };

  /**
   * Create a new product with a 3D model using direct file upload
   * @param formData FormData containing product details and model file
   * @returns Promise with the created product data
   */
  export const createProductWithFormData = async (formData: FormData): Promise<Product> => {
    try {
  

      const response = await fetch(`${API_BASE_URL}/products/direct-upload`, {
        method: 'POST',
        headers: {
        },
        body: formData,
        // Don't set Content-Type header, it will be set automatically with boundary
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating product with file upload:', error);
      throw error;
    }
  };

  /**
   * Create a new product with a 3D model (base64 method - legacy)
   * @param productData Object containing product details and model file
   * @returns Promise with the created product data
   */
  export const createProduct = async (productData: {
    name: string;
    description: string;
    price: number;
    quantity: number;
    model_file: string; // base64 encoded file
    file_name: string;
  }): Promise<Product> => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  /**
   * Helper function to convert a file to base64
   * @param file The file to convert
   * @returns Promise with the base64 string (without data URL prefix)
   */
  export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:application/octet-stream;base64,")
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  /**
   * Updates an existing product with the provided data
   * @param productId - The ID of the product to update
   * @param productData - The updated product data
   * @returns The updated product data
   */
  export async function updateProduct(productId: string, productData: {
    name: string;
    description: string;
    price: number;
  }): Promise<Product> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Deletes a product by its ID
   * @param productId - The ID of the product to delete
   * @returns Success message
   */
  export async function deleteProduct(productId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Updates the stock quantity of a product
   * @param productId - The ID of the product to update stock for
   * @param quantityChange - The amount to change the stock by (positive or negative)
   * @returns The updated product data
   */
  export async function updateProductStock(productId: string, quantityChange: number): Promise<Product> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity_change: quantityChange }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product stock: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  }

  /**
   * Generate a presigned URL for direct S3 upload
   * @param fileName The name of the file to upload
   * @param fileType The MIME type of the file
   * @returns Promise with presigned URL and file details
   */
  export const generateUploadUrl = async (fileName: string, fileType: string): Promise<{
    uploadUrl: string;
    modelUrl: string;
    fileKey: string;
  }> => {
    try {
     

      const response = await fetch(`${API_BASE_URL}/products/generate-upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({
          fileName,
          fileType
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get upload URL: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw error;
    }
  };