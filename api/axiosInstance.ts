import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});


axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('user_token');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;