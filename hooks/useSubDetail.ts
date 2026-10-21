import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { SubDetailResponse } from '../types/api';
import axiosInstance from '@/api/axiosInstance';

export const useSubDetail = (order_id: string | number, router: any) => {

  const [data, setData] = useState<SubDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get<SubDetailResponse>(`/order/subdetail/${order_id}`);

      if (response.data) {
        setData(response.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [order_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTakePhoto = async () => {

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ต้องการสิทธิ์การใช้กล้อง', 'กรุณาอนุญาตให้แอปเข้าถึงกล้องเพื่อถ่ายรูปยืนยันการจัดส่ง');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log(result.assets[0].uri);
      setProofPhoto(result.assets[0].uri);
    }
  };

  const handleRetakePhoto = () => {
    setProofPhoto(null);
  };


  const handleConfirmDelivery = async (paymentMethod: 'cash' | 'transfer' = 'cash') => {
    if (!proofPhoto) {
      Alert.alert('กรุณาถ่ายรูป', 'ต้องถ่ายรูปยืนยันการจัดส่งก่อน');
      return;
    }

    console.log("Payment Method",paymentMethod);
    
    setIsConfirming(true);
    try {

      const base64 = await FileSystem.readAsStringAsync(proofPhoto, {
        encoding: 'base64',
      });

      await axiosInstance.put(`/order/upload/${order_id}`, {
        imageBase64: base64,
        payment_method: paymentMethod,
      });

    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'ไม่สามารถยืนยันการจัดส่งได้ กรุณาลองใหม่อีกครั้ง';
      Alert.alert('เกิดข้อผิดพลาด', errorMsg);
      throw error; // ส่ง Error ต่อเพื่อให้ component แม่จับและแสดง Snackbar ได้ถูกต้อง
    } finally {
      setIsConfirming(false);
    }
  };

  const updateStatusVihicle = async (id: string | number) => {
    try{
      setError(null)
      await axiosInstance.put(`/vehicle/status/${id}`)
    }catch(err:any) {
      setError(err.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการอัพเดดข้อมูล"); 
    }finally{
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    proofPhoto,
    isConfirming,
    handleTakePhoto,
    handleRetakePhoto,
    handleConfirmDelivery,
    refetch: fetchData,
    updateStatusVihicle
  };
};