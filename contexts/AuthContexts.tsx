import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import axiosInstance from '../api/axiosInstance';
import { LoginPayload, LoginResponse } from '../types/api';

type AuthContextType = {
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<{ success: boolean; data?: any; error?: string }>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  // เริ่มต้นเป็น true เพราะต้องเช็ค token ใน AsyncStorage ก่อนว่ามีอยู่ไหม
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // เช็ค token ที่เคยบันทึกไว้ ตอนเปิดแอปครั้งแรก
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('user_token');
        setIsLoggedIn(!!token);
      } catch (e) {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post<any, LoginResponse>(
        '/auth/login',
        payload
      );

      if (response.token && response.role_ID && response.employee_name) {
        // บันทึก Token สำหรับยืนยันตัวตน
        await AsyncStorage.setItem('user_token', response.token);

        // บันทึกข้อมูล Driver (id, name, phone, avatarUrl) เป็น JSON string
        await AsyncStorage.setItem('role_ID', response.role_ID.toString());
        await AsyncStorage.setItem('employee_name', response.employee_name);

        // สำคัญ: อัปเดต state ทันทีหลัง login สำเร็จ
        setIsLoggedIn(true);
      }

      return { success: true, data: response };
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // ล้างข้อมูลทั้งหมดที่เกี่ยวข้องเมื่อออกจากระบบ
    await AsyncStorage.multiRemove(['user_token', 'role_ID', 'employee_name']);
    // สำคัญ: อัปเดต state ทันทีหลัง logout
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};