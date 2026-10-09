import { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    optimizeRoute,
    OptimizedRoute,
} from "@/services/routeService";
import { useLocation } from "@/hooks/useLocation"; // 1. Import useLocation

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
        if (!orders?.length) {
            setOptimizedOrders([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const savedRoute = await AsyncStorage.getItem(ROUTE_STORAGE);

            if (savedRoute) {

                const routeResult: OptimizedRoute[] =
                    JSON.parse(savedRoute);

                setOptimizedOrders(
                    mergeRouteWithOrders(routeResult, orders)
                );

                return;
            }

            const activeOrders = orders.filter(
                (order: any) =>
                    order.delivery_status !== "delivered" &&
                    order.delivery_status !== "completed" &&
                    order.delivery_status !== "cancelled"
            );

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

            setOptimizedOrders(
                mergeRouteWithOrders(routeResult, orders)
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
    }, [location]); // 4. ใส่ location ลงใน Dependency Array ของ useCallback

    const syncRouteWithOrders = useCallback(async (orders: any[]) => {
        try {
            const savedRoute = await AsyncStorage.getItem(ROUTE_STORAGE);

            if (!savedRoute) return;

            const routeResult: OptimizedRoute[] =
                JSON.parse(savedRoute);

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

        console.log("จบรอบแล้ว ลบ Route ออกจาก Store");
    }, []);

    return {
        optimizedOrders,
        loading,
        error,
        loadOrCreateRoute,
        syncRouteWithOrders,
        clearRoute,
    };
};