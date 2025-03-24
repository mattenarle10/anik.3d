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
  
  // Add item to cart
  const addItem = (item: Omit<CartItem, 'id'>) => {
    setItems(prevItems => {
      // Check if this exact item (with same customizations) already exists
      const existingItemIndex = prevItems.findIndex(i => 
        i.productId === item.productId && 
        i.isCustomized === item.isCustomized &&
        JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
      );
      
      if (existingItemIndex !== -1) {
        // If item exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += item.quantity;
        return updatedItems;
      } else {
        // Otherwise add as new item
        return [...prevItems, { ...item, id: generateId() }];
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
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
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