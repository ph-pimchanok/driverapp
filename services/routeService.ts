export type RouteOrder = {
    order_id: number;
    latitude: string | number;
    longitude: string | number;
};

export type OptimizedRoute = {
    order_id: number;
    sequence: number;
    distance_from_previous: number;
};

// Type สำหรับพิกัดร้านค้าที่ได้มาจาก useLocation
export type ShopLocation = {
    latitude: string | number;
    longitude: string | number;
};

const GRAPH_HOPPER_API_KEY = "7bc441f0-eaa0-4862-8406-7aae576fec87";
const GRAPH_HOPPER_URL = "https://graphhopper.com/api/1/vrp";

type GraphHopperActivity = {
    type: string;
    id?: string;
    distance?: number;
    driving_time?: number;
    address?: {
        location_id?: string;
        lat?: number;
        lon?: number;
    };
};

type GraphHopperRoute = {
    vehicle_id?: string;
    distance?: number;
    transport_time?: number;
    activities?: GraphHopperActivity[];
};

type GraphHopperResponse = {
    solution?: {
        routes?: GraphHopperRoute[];
        unassigned?: {
            services?: string[];
        };
    };
    message?: string;
};

export const optimizeRoute = async (
    orders: RouteOrder[],
    shopLocation: ShopLocation | null, // รับค่า shopLocation จาก useLocation
): Promise<OptimizedRoute[]> => {
    // 1. ตรวจสอบข้อมูลพิกัดร้านค้า
    if (
        !shopLocation ||
        shopLocation.latitude == null ||
        shopLocation.longitude == null ||
        Number.isNaN(Number(shopLocation.latitude)) ||
        Number.isNaN(Number(shopLocation.longitude))
    ) {
        throw new Error("ไม่พบข้อมูลพิกัดร้านค้า หรือพิกัดไม่ถูกต้อง");
    }

    // 2. ตรวจสอบรายการออเดอร์
    if (!orders || orders.length === 0) {
        return [];
    }

    const validOrders = orders.filter((order) => {
        const latitude = Number(order.latitude);
        const longitude = Number(order.longitude);
        return !Number.isNaN(latitude) && !Number.isNaN(longitude);
    });

    if (validOrders.length === 0) {
        return [];
    }

    const requestBody = {
        vehicles: [
            {
                vehicle_id: "driver_vehicle",
                start_address: {
                    location_id: "shop_location",
                    lat: Number(shopLocation.latitude),
                    lon: Number(shopLocation.longitude),
                },
                return_to_depot: false,
            },
        ],
        services: validOrders.map((order) => ({
            id: `order_${order.order_id}`,
            name: `Delivery Order ${order.order_id}`,
            address: {
                location_id: `order_${order.order_id}`,
                lat: Number(order.latitude),
                lon: Number(order.longitude),
            },
        })),
    };

    try {
        const response = await fetch(
            `${GRAPH_HOPPER_URL}?key=${GRAPH_HOPPER_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GraphHopper Error ${response.status}: ${errorText}`);
        }

        const data: GraphHopperResponse = await response.json();
        const route = data.solution?.routes?.[0];

        if (!route) {
            throw new Error("GraphHopper ไม่คืนข้อมูลเส้นทาง");
        }

        const activities = route.activities || [];
        const serviceActivities = activities.filter(
            (activity) => activity.type === "service",
        );

        const result: OptimizedRoute[] = [];
        let previousDistance = 0;

        serviceActivities.forEach((activity, index) => {
            if (!activity.id) return;

            const orderId = Number(activity.id.replace("order_", ""));
            if (Number.isNaN(orderId)) return;

            const currentDistance = activity.distance || 0;
            const segmentDistance = currentDistance - previousDistance;
            const distanceKm = segmentDistance / 1000;

            result.push({
                order_id: orderId,
                sequence: index + 1,
                distance_from_previous: Math.round(distanceKm * 100) / 100,
            });

            previousDistance = currentDistance;
        });

        return result;
    } catch (error) {
        console.error("Route Optimization Error:", error);
        throw error;
    }
};