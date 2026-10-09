import { useState, useCallback, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";

export type Location = {
    location_id?: number;
    latitude: number;
    longitude: number;
};

type ApiResponse = {
    success: boolean;
    data: Array<{
        location_id: number;
        latitude: string | number;
        longitude: string | number;
    }>;
};

export const useLocation = () => {
    const [location, setLocation] = useState<Location | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLocation = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axiosInstance.get<any, ApiResponse>("/location/");
            const firstLocation = response?.data?.[0];

            console.log("Fetched Location:", firstLocation);

            if (firstLocation) {
                const lat = Number(firstLocation.latitude);
                const lng = Number(firstLocation.longitude);

                if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                    setLocation({
                        location_id: firstLocation.location_id,
                        latitude: lat,
                        longitude: lng,
                    });
                } else {
                    setError("พิกัดร้านค้าไม่ถูกต้อง (NaN)");
                }
            } else {
                setError("ไม่พบข้อมูลพิกัดร้านค้า");
            }
        } catch (err: any) {
            console.error("Fetch Location Error:", err);
            setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลพิกัด");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocation();
    }, [fetchLocation]);

    return { location, loading, error, fetchLocation };
};