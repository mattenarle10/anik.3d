// /src/contexts/CartContext.tsx
'use client';
import React, { createContext, useState, useContext, useEffect } from 'react';

// Types for cart items
export interface CustomizationDetail {
  partId: string;
  partName: string;
  color: string;
  price: number;
}

export interface CartItem {
  id: string; // Unique identifier for the cart item
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock?: number; // Available stock for the item
  imageUrl?: string;
  modelUrl?: string;
  baseModelUrl?: string; // Original model URL for display in cart
  isCustomized: boolean;
  customizations?: CustomizationDetail[];
  totalCustomizationPrice: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Initialize from localStorage with error handling
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        return [];
      }
    }
    return [];
  });
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items]);
  
  // Helper function to get total quantity of a product across all variants (base and customized)
  const getTotalProductQuantity = (productId: string, currentItems: CartItem[]) => {
    const sameProductItems = currentItems.filter(item => item.productId === productId);
    const totalQuantity = sameProductItems.reduce((total, item) => total + item.quantity, 0);
    
    console.log('[DEBUG] getTotalProductQuantity', {
      productId,
      sameProductItems,
      totalQuantity,
      allItems: currentItems
    });
    
    return totalQuantity;
  };
  
  // Helper function to check if adding a quantity would exceed stock
  const wouldExceedStock = (productId: string, quantity: number, stock: number, currentItems: CartItem[], excludeItemId?: string) => {
    // Get total quantity of this product already in cart (excluding the current item if updating)
    const currentQuantity = currentItems
      .filter(item => item.productId === productId && (excludeItemId ? item.id !== excludeItemId : true))
      .reduce((total, item) => total + item.quantity, 0);
    
    // Check if adding the new quantity would exceed stock
    return (currentQuantity + quantity) > stock;
  };
  
  // Helper function to get remaining stock for a product
  const getRemainingStock = (productId: string, totalStock: number, currentItems: CartItem[], excludeItemId?: string) => {
    // Get all items with the same product ID (both base and customized variants)
    const sameProductItems = currentItems.filter(item => 
      item.productId === productId && (excludeItemId ? item.id !== excludeItemId : true)
    );
    
    // Calculate total quantity of this product in cart
    const currentQuantity = sameProductItems.reduce((total, item) => total + item.quantity, 0);
    
    // Calculate remaining stock
    const remainingStock = Math.max(0, totalStock - currentQuantity);
    
    console.log('[DEBUG] getRemainingStock', {
      productId,
      totalStock,
      excludeItemId,
      sameProductItems,
      currentQuantity,
      remainingStock,
      allItems: currentItems
    });
    
    // Return the remaining stock
    return remainingStock;
  };
  
  // Add item to cart
  const addItem = (item: Omit<CartItem, 'id'>) => {
    // Generate unique ID for new items
    const newItem = { ...item, id: generateId() };
    
    setItems(prevItems => {
      // Get ALL items with the same product ID (both base and customized variants)
      const sameProductItems = prevItems.filter(i => i.productId === newItem.productId);
      
      // Calculate total quantity of this product already in cart
      const totalInCart = sameProductItems.reduce((total, i) => total + i.quantity, 0);
      
      // Check if stock information is missing (this shouldn't happen now that we've fixed the product page)
      if (newItem.stock === undefined) {
        console.log('[STOCK CHECK] WARNING: Missing stock information for product:', newItem.name);
        console.log('[STOCK CHECK] This should not happen as both base and customized models should include stock info');
        // We won't set a default value anymore - the product page should provide the actual stock
      }
      
      // Detailed debug log for stock check
      console.log('[STOCK CHECK] Adding to cart:', {
        productId: newItem.productId,
        name: newItem.name,
        isCustomized: newItem.isCustomized,
        totalStock: newItem.stock,
        quantityToAdd: newItem.quantity,
        totalAlreadyInCart: totalInCart,
        wouldExceedStock: newItem.stock !== undefined && (totalInCart + newItem.quantity) > newItem.stock,
        itemsInCart: sameProductItems.map(i => ({
          id: i.id.substring(0, 8),
          isCustomized: i.isCustomized,
          quantity: i.quantity
        }))
      });
      
      // Check if we have stock information and if adding would exceed stock
      if (newItem.stock !== undefined && totalInCart + newItem.quantity > newItem.stock) {
        // Calculate how many can be added
        const canAdd = Math.max(0, newItem.stock - totalInCart);
        
        // Show alert with clear information
        alert(`Stock limitation for ${newItem.name}:\n\n` +
              `Total stock: ${newItem.stock} units\n` +
              `Already in cart (all variants): ${totalInCart} units\n` +
              `You can only add ${canAdd} more units.`);
        
        if (canAdd <= 0) {
          console.log('[STOCK EXCEEDED] Cannot add more items');
          return prevItems; // Can't add any more
        }
        
        // Adjust the quantity to what's available
        newItem.quantity = canAdd;
        console.log('[STOCK ADJUSTED] Quantity adjusted to:', canAdd);
      }
      
      // Check if item already exists in cart (by productId and customization)
      const existingItemIndex = prevItems.findIndex(i => {
        // For customized items, match both productId and customizations
        if (newItem.isCustomized && i.isCustomized) {
          // Check if product IDs match
          if (i.productId !== newItem.productId) return false;
          
          // Check if customizations match
          const iCustomizations = JSON.stringify(i.customizations || []);
          const newCustomizations = JSON.stringify(newItem.customizations || []);
          return iCustomizations === newCustomizations;
        }
        // For regular items, just match by productId
        return i.productId === newItem.productId && !i.isCustomized && !newItem.isCustomized;
      });
      
      if (existingItemIndex !== -1) {
        // If item exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        console.log('[UPDATED EXISTING ITEM] New quantity:', updatedItems[existingItemIndex].quantity);
        return updatedItems;
      } else {
        // Add as new item
        console.log('[ADDED NEW ITEM]', newItem);
        return [...prevItems, newItem];
      }
    });
  };
  
  // Remove item from cart
  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };
  
  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    setItems(prevItems => {
      // Find the item to update
      const itemToUpdate = prevItems.find(item => item.id === id);
      if (!itemToUpdate) return prevItems;
      
      // SIMPLE STOCK CHECK: Get all items with the same product ID
      const sameProductItems = prevItems.filter(item => item.productId === itemToUpdate.productId);
      
      // Calculate total quantity of this product in cart (excluding the current item)
      const otherVariantsQuantity = sameProductItems
        .filter(item => item.id !== id)
        .reduce((total, item) => total + item.quantity, 0);
      
      // Debug log for stock check
      console.log('[UPDATE QUANTITY STOCK CHECK]', {
        productId: itemToUpdate.productId,
        name: itemToUpdate.name,
        isCustomized: itemToUpdate.isCustomized,
        stockLimit: itemToUpdate.stock,
        currentQuantity: itemToUpdate.quantity,
        requestedQuantity: quantity,
        otherVariantsQuantity,
        itemsInCart: sameProductItems.map(i => ({ id: i.id, quantity: i.quantity, isCustomized: i.isCustomized }))
      });
      
      // Check if stock information is missing
      if (itemToUpdate.stock === undefined) {
        console.log('[UPDATE QUANTITY] WARNING: Missing stock information for product:', itemToUpdate.name);
        // No stock limit enforcement for items without stock information
      } else {
        // Get ALL items with the same product ID (both base and customized variants)
        const allVariantsQuantity = prevItems
          .filter(item => item.productId === itemToUpdate.productId)
          .reduce((total, item) => total + item.quantity, 0);
        
        // Calculate how much we're changing the quantity by
        const quantityChange = quantity - itemToUpdate.quantity;
        
        // Calculate if the new total would exceed stock
        const wouldExceedStock = (allVariantsQuantity + quantityChange) > itemToUpdate.stock;
        
        console.log('[STOCK CHECK] Detailed calculation:', {
          productId: itemToUpdate.productId,
          name: itemToUpdate.name,
          totalStock: itemToUpdate.stock,
          currentQuantity: itemToUpdate.quantity,
          requestedQuantity: quantity,
          quantityChange,
          allVariantsInCart: allVariantsQuantity,
          wouldExceedStock
        });
        
        if (wouldExceedStock) {
          // Calculate maximum allowed quantity for this item
          const maxAllowed = Math.max(0, itemToUpdate.quantity + (itemToUpdate.stock - allVariantsQuantity));
          
          // Show an alert with clear information
          alert(`Stock limitation for ${itemToUpdate.name}:\n\n` +
                `Total stock: ${itemToUpdate.stock} units\n` +
                `Total in cart (all variants): ${allVariantsQuantity} units\n` +
                `Maximum allowed for this item: ${maxAllowed} units`);
          
          console.log('[QUANTITY ADJUSTED] Limited to:', maxAllowed);
          quantity = maxAllowed;
        }
      }
      
      // Update the item quantity
      console.log('[QUANTITY UPDATED] New quantity:', quantity);
      return prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      );
    });
  };
  
  // Clear cart
  const clearCart = () => {
    setItems([]);
  };
  
  // Calculate total item count
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  // Calculate total price
  const totalPrice = items.reduce((total, item) => {
    const itemTotal = (item.price + (item.totalCustomizationPrice || 0)) * item.quantity;
    return total + itemTotal;
  }, 0);
  
  // Generate unique ID for cart items
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  return (
    <CartContext.Provider 
      value={{ 
        items, 
        addItem, 
        removeItem, 
        updateQuantity, 
        clearCart, 
        itemCount, 
        totalPrice 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};