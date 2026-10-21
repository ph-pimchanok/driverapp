import { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    optimizeRoute,
    OptimizedRoute,
} from "@/services/routeService";
import { useLocation } from "@/hooks/useLocation";

type OptimizedOrder = {
    order_id: number;
    order_date?: string;
    total_amount?: string;
    delivery_status?: string;
    customer_name?: string;
    phone?: string;
    address?: string;
    delivery_note?: string;
    latitude: string | number;
    longitude: string | number;
    sequence: number;
    distance_from_previous: number;
};

const ROUTE_STORAGE = "current_delivery_route";

export const useRouteOptimization = () => {
    const [optimizedOrders, setOptimizedOrders] = useState<OptimizedOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { location } = useLocation();

    const mergeRouteWithOrders = (
        routeResult: OptimizedRoute[],
        orders: any[]
    ): OptimizedOrder[] => {
        return routeResult
            .map((route) => {
                const order = orders.find(
                    (item: any) =>
                        Number(item.order_id) === Number(route.order_id)
                );

                if (!order) return null;

                return {
                    ...order,
                    sequence: route.sequence,
                    distance_from_previous: route.distance_from_previous,
                } as OptimizedOrder;
            })
            .filter(
                (order): order is OptimizedOrder => order !== null
            );
    };

    const loadOrCreateRoute = useCallback(async (orders: any[]) => {
        try {
            setLoading(true);
            setError(null);

            const savedRoute = await AsyncStorage.getItem(ROUTE_STORAGE);
            console.log("🔍 [Cache Check] Found saved route in Store:", savedRoute ? "Yes" : "No");

            // 📌 กรณีที่ 1: ถ้า API ว่าง (ไม่มีออเดอร์แล้ว) แต่ใน Store มีข้อมูลค้างอยู่ -> ให้ล้างทิ้งทันที
            if (!orders?.length) {
                if (savedRoute) {
                    console.log("🧹 [API Check] API ไม่มีออเดอร์แล้ว แต่พบ Cache ค้างอยู่ -> เคลียร์ Store ทิ้ง");
                    //ลบข้อมูลในstoreที่เป็นออเดอร์ทั้งหมด
                    await AsyncStorage.removeItem(ROUTE_STORAGE);
                }
                setOptimizedOrders([]);
                return;
            }
            // กรองออเดอร์ที่ยังไม่ได้ส่ง=สถานะไม่ตรงกับในนี้เลย
            const activeOrders = orders.filter(
                (order: any) =>
                    order.delivery_status !== "delivered" &&
                    order.delivery_status !== "completed" &&
                    order.delivery_status !== "cancelled"
            );

            console.log("🔍 [API Check] ออเดอร์ที่นำมาคำนวณ (Active Orders):", activeOrders); // 👈 เพิ่มบรรทัดนี้

            if (!activeOrders.length) {
                if (savedRoute) {
                    await AsyncStorage.removeItem(ROUTE_STORAGE);
                }
                setOptimizedOrders([]);
                return;
            }

            // 📌 กรณีที่ 2: ถ้าใน Store มีข้อมูลอยู่ -> เช็กว่าตรงกับ API ล่าสุดหรือไม่
            if (savedRoute) {
                const routeResult: OptimizedRoute[] = JSON.parse(savedRoute);

                console.log("🔍 [Store Check] Order ใน Store:", routeResult.map((r) => r.order_id));
                console.log("🔍 [API Check] Order ปัจจุบันจาก API:", activeOrders.map((o) => Number(o.order_id)));

                // เช็กความเหมือน (จำนวนเท่ากัน และ Order ID ข้างในตรงกันทุกตัว)
                const isSameOrders =
                    routeResult.length === activeOrders.length &&
                    routeResult.every((route) =>
                        activeOrders.some((o) => Number(o.order_id) === Number(route.order_id))
                    );

                if (isSameOrders) {
                    console.log("♻️ ออเดอร์ใน Store ตรงกับ API ปัจจุบัน ใช้ Route เดิมต่อได้เลย");
                    setOptimizedOrders(mergeRouteWithOrders(routeResult, activeOrders));
                    return;
                }

                console.log("⚠️ ออเดอร์ไม่ตรงกับใน Store -> ล้างของเก่าแล้วคำนวณเส้นทางใหม่");
                await AsyncStorage.removeItem(ROUTE_STORAGE);
            }

            // 📌 กรณีที่ 3: ถ้าไม่มี Store หรือข้อมูลไม่ตรงกัน -> คำนวณใหม่ผ่าน GraphHopper
            const routeInput = activeOrders
                .filter((order: any) => {
                    const latitude = Number(order.latitude);
                    const longitude = Number(order.longitude);

                    return (
                        order.latitude != null &&
                        order.longitude != null &&
                        !Number.isNaN(latitude) &&
                        !Number.isNaN(longitude)
                    );
                })
                .map((order: any) => ({
                    order_id: Number(order.order_id),
                    latitude: Number(order.latitude),
                    longitude: Number(order.longitude),
                }));

            if (!routeInput.length) {
                setOptimizedOrders([]);
                return;
            }

            const routeResult = await optimizeRoute(routeInput, location);

            await AsyncStorage.setItem(
                ROUTE_STORAGE,
                JSON.stringify(routeResult)
            );

            console.log("บันทึก Route ใหม่ลง Store เรียบร้อย");

            setOptimizedOrders(
                mergeRouteWithOrders(routeResult, activeOrders)
            );
        } catch (err: any) {
            console.error("Route Optimization Error:", err);

            setError(
                String(err?.message).includes("429")
                    ? "เรียก GraphHopper ถี่เกินไป กรุณารอสักครู่"
                    : err?.message || "เกิดข้อผิดพลาดในการคำนวณเส้นทาง"
            );
        } finally {
            setLoading(false);
        }
    }, [location]);
    //  เรียกไอเทที่อยู่ในstoreมาคำนวน
    const syncRouteWithOrders = useCallback(async (orders: any[]) => {
        try {
            const savedRoute = await AsyncStorage.getItem(ROUTE_STORAGE);

            if (!savedRoute) return;

            const routeResult: OptimizedRoute[] = JSON.parse(savedRoute);

            setOptimizedOrders(
                mergeRouteWithOrders(routeResult, orders)
            );
        } catch (err) {
            console.error("Sync Route Error:", err);
        }
    }, []);

    const clearRoute = useCallback(async () => {
        await AsyncStorage.removeItem(ROUTE_STORAGE);
        setOptimizedOrders([]);

        console.log("ลบ Route ออกจาก Store เรียบร้อย");
    }, []);

    const getSavedRoute = useCallback(async (): Promise<OptimizedRoute[] | null> => {
        try {
            const savedRoute = await AsyncStorage.getItem(ROUTE_STORAGE);
            return savedRoute ? JSON.parse(savedRoute) : null;
        } catch (err) {
            console.error("Error reading saved route from cache:", err);
            return null;
        }
    }, []);

    const logSavedRoute = useCallback(async () => {
        try {
            const cacheData = await getSavedRoute();
            console.log("[Cache Inspect] current_delivery_route:", cacheData);
            return cacheData;
        } catch (err) {
            console.error("Failed to log cache:", err);
        }
    }, [getSavedRoute]);

    return {
        optimizedOrders,
        loading,
        error,
        loadOrCreateRoute,
        syncRouteWithOrders,
        clearRoute,
        getSavedRoute,
        logSavedRoute,
    };
};