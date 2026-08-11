import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';
import { LoginPayload, LoginResponse } from '../types/api';

export const useAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post<any, LoginResponse>(
        '/auth/login',
        payload
      );

      if (response.token && response.driver) {
        // บันทึก Token สำหรับยืนยันตัวตน
        await AsyncStorage.setItem('user_token', response.token);

        // บันทึกข้อมูล Driver (id, name, phone, avatarUrl) เป็น JSON string
        await AsyncStorage.setItem('driver_info', JSON.stringify(response.driver));
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
    await AsyncStorage.multiRemove(['user_token', 'driver_info']);
  };

  return {
    login,
    logout,
    loading,
    error,
  };
};