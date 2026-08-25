import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import axiosInstance from '../api/axiosInstance';
import { LoginPayload, LoginResponse } from '../types/api';

type AuthContextType = {
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  isInactive: boolean; // 💡 เช็คว่าโดนแบน/ระงับไหม
  statusChecked: boolean; // 💡 เช็คว่าเช็คสถานะพนักงานเสร็จหรือยัง (กันหน้ากระพริบตอน redirect)
  login: (payload: LoginPayload) => Promise<{ success: boolean; data?: any; error?: string }>;
  logout: () => Promise<void>;
  checkEmployeeStatus: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInactive, setIsInactive] = useState<boolean>(false);
  const [statusChecked, setStatusChecked] = useState<boolean>(false); // 💡 เริ่มต้น false เสมอ

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
    setStatusChecked(false); // 💡 reset ทุกครั้งก่อน login ใหม่ กันเคสค่าเก่าค้าง
    try {
      const response = await axiosInstance.post<any, LoginResponse>(
        '/auth/login',
        payload
      );

      if (response.token && response.role_ID && response.employee_name) {

        await AsyncStorage.setItem('user_token', response.token);
        await AsyncStorage.setItem('role_ID', response.role_ID.toString());
        await AsyncStorage.setItem('employee_name', response.employee_name);

        console.log(response)

        const empId = response.employee_id;

        if (empId) {
          await AsyncStorage.setItem('employee_id', empId.toString());
        }

        if (response.vehicle_id) {
          await AsyncStorage.setItem('vehicle_id', response.vehicle_id.toString());
        }

        setIsInactive(false); // ล้างค่าระงับตอนล็อกอินสำเร็จ
        setIsLoggedIn(true);
      }

      return { success: true, data: response };
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([
      'user_token',
      'role_ID',
      'employee_name',
      'vehicle_id',
      'employee_id'
    ]);
    setIsInactive(false); // รีเซ็ตสถานะระงับ
    setStatusChecked(false); // 💡 รีเซ็ตด้วย เผื่อ login ใหม่รอบหน้า
    setIsLoggedIn(false);
  };

  const checkEmployeeStatus = async () => {
    try {
      const employeeId = await AsyncStorage.getItem('employee_id');
      if (!employeeId) return;

      const response: any = await axiosInstance.get(`/employee/status/${employeeId}`);
      const employeeStatus = response?.status;

      console.log("employeestatus from API:", employeeStatus);

      if (employeeStatus === 'inactive') {
        setIsInactive(true); // 💡 ถ้าโดนแบน ให้เปลี่ยนสถานะเป็น true
      } else {
        setIsInactive(false);
      }
    } catch (error) {
      console.error("Error checking status", error);
    } finally {
      setStatusChecked(true); // 💡 ไม่ว่าสำเร็จหรือ error ก็ต้องปิด flag นี้ ไม่งั้นแอปค้างที่หน้า loading ตลอด
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, loading, error, isInactive, statusChecked, login, logout, checkEmployeeStatus }}
    >
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