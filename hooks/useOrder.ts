import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/api/axiosInstance";
import { OrderResponse } from '../types/api';
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface OrderPayload {
    vehicle_id: number | string;
}

export const useOrder = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // ฟังก์ชันสำหรับดึงข้อมูลออเดอร์ตาม vehicle_id
    const fetchData = useCallback(async (vehicle_id: string | number) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axiosInstance.get<OrderResponse>(`/order/driver/${vehicle_id}`);
            console.log("API Response Data:", response.data); // เช็คว่าข้อมูลที่ได้หน้าตาเป็นยังไง

            setData(response.data as any);
            
        } catch (err: any) {
            console.error("API Error:", err);
            setError(err.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
        } finally {
            setLoading(false);
        }
    }, []);

    // ฟังก์ชันสำหรับรีเฟรชข้อมูล (ดึง vehicle_id จาก AsyncStorage ให้อัตโนมัติ)
    const refetch = useCallback(async () => {
        try {
            const vehicle_id = await AsyncStorage.getItem("vehicle_id");
            console.log("Vehicle ID from AsyncStorage:", vehicle_id); // เช็คว่ามี vehicle_id เก็บไว้ไหม

            if (vehicle_id) {
                await fetchData(vehicle_id);
            } else {
                setError("ไม่พบรหัสยานพาหนะ (vehicle_id)");
            }
        } catch (err) {
            console.error("AsyncStorage Error:", err);
            setError("เกิดข้อผิดพลาดในการอ่านข้อมูลจากตัวเครื่อง");
        }
    }, [fetchData]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        data,
        loading,
        error,
        fetchData,
        refetch,
    };
};