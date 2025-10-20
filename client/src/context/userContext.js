// src/context/userContext.js

import { createContext, useContext } from 'react';

// 1. Create and export the Context
export const UserContext = createContext(null);

// 2. Create and export the custom hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};