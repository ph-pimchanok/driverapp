import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContexts'; // นำเข้า AuthContext แทน AuthProvider

export const useAuth = () => {
  const context = useContext(AuthContext); // ใช้ AuthContext ที่นี่
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};