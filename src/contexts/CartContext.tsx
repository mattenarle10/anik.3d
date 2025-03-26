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
  
  // Add item to cart
  const addItem = (item: Omit<CartItem, 'id'>) => {
    // Generate unique ID for new items
    const newItem = { ...item, id: generateId() };
    
    setItems(prevItems => {
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
        const existingItem = updatedItems[existingItemIndex];
        
        // Check if adding would exceed stock
        if (existingItem.stock !== undefined) {
          const newQuantity = existingItem.quantity + newItem.quantity;
          
          if (newQuantity > existingItem.stock) {
            // Show an alert to inform the user
            alert(`Sorry, only ${existingItem.stock} units available in stock.`);
            updatedItems[existingItemIndex].quantity = existingItem.stock;
            return updatedItems;
          }
        }
        
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      } else {
        // Otherwise add as new item
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
    
    setItems(prevItems => 
      prevItems.map(item => {
        // Check if we have stock information and enforce the limit
        if (item.id === id) {
          // If stock is defined, don't allow quantity to exceed it
          if (item.stock !== undefined && quantity > item.stock) {
            // Show an alert to inform the user
            alert(`Sorry, only ${item.stock} units available in stock.`);
            return { ...item, quantity: item.stock };
          }
          return { ...item, quantity };
        }
        return item;
      })
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