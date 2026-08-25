import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/api/axiosInstance";
import { OrderResponse } from '../types/api';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { socket } from "@/services/socket"; 

export const useOrder = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (vehicle_id: string | number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<OrderResponse>(`/order/driver/${vehicle_id}`);
            setData(response.data as any);
        } catch (err: any) {
            setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(async () => {
        const vehicle_id = await AsyncStorage.getItem("vehicle_id");
        if (vehicle_id) {
            await fetchData(vehicle_id);
        }
    }, [fetchData]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    // ** ส่วนจัดการ Socket Real-time **
    useEffect(() => {
        const handleStatusUpdate = (payload: { order_id: number, status: string }) => {
            console.log("⚡ ได้รับ Socket Update:", payload);

            // อัปเดตข้อมูลใน State ทันทีโดยไม่ต้องโหลด API ใหม่
            setData(prevData => prevData.map(order => 
                // เช็คว่า ID ตรงกันไหม (ต้องแน่ใจว่า order_id ของคุณเป็น Type เดียวกัน)
                Number(order.order_id) === Number(payload.order_id) 
                ? { ...order, delivery_status: payload.status } // อัปเดตเฉพาะฟิลด์ status
                : order
            ));
        };

        // ดักฟัง Event ตามที่ Backend ส่งมา
        socket.on("order_status_update", handleStatusUpdate);

        return () => {
            socket.off("order_status_update", handleStatusUpdate);
        };
    }, []); // ใส่ [] เพื่อให้รันแค่ครั้งเดียวตอน Hook โหลด

    return {
        data,
        loading,
        error,
        fetchData,
        refetch,
    };
};