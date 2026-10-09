import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Snackbar } from "../components/Snackbar";
import { WeatherCard } from "../components/WeatherCard";
import { useAuth } from "../contexts/AuthContexts";
import { useOrder } from "../hooks/useOrder";
import { useRouteOptimization } from "../hooks/useRouteOptimization";

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "รอดำเนินการ",
    bg: "#fef9c3",
    text: "#854d0e",
  },
  delivering: {
    label: "กำลังจัดส่ง",
    bg: "#e0f2fe",
    text: "#0369a1",
  },
  delivered: {
    label: "จัดส่งสำเร็จ",
    bg: "#dcfce7",
    text: "#166534",
  },
  cancelled: {
    label: "ยกเลิกแล้ว",
    bg: "#fee2e2",
    text: "#991b1b",
  },
};

const isActiveOrder = (order: any) =>
  order.delivery_status !== "delivered" &&
  order.delivery_status !== "completed" &&
  order.delivery_status !== "cancelled";

const formatDistance = (distanceKm: number) => {
  const distance = Number(distanceKm) || 0;

  if (distance <= 0) return "0 เมตร";
  if (distance < 1) return `${Math.round(distance * 1000)} เมตร`;

  return `${distance.toFixed(2)} กม.`;
};

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const { data: orders, loading, error, refetch } = useOrder();

  const {
    optimizedOrders,
    loading: routeLoading,
    error: routeError,
    loadOrCreateRoute,
    syncRouteWithOrders,
    clearRoute,
  } = useRouteOptimization();

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage] = useState("");
  const [employeeName, setEmployeeName] = useState("คนขับสุดหล่อ");
  const [refreshing, setRefreshing] = useState(false);

  const routeStartedRef = useRef(false);
  const firstFocusRef = useRef(true);

  useEffect(() => {
    const fetchEmployeeName = async () => {
      try {
        const storedName = await AsyncStorage.getItem("employee_name");

        if (storedName) {
          setEmployeeName(storedName);
        }
      } catch (error) {
        console.error("Failed to load employee name from storage", error);
      }
    };

    fetchEmployeeName();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (firstFocusRef.current) {
        firstFocusRef.current = false;
        return;
      }

      console.log("🏠 กลับ Home → โหลดสถานะ Order ล่าสุด");

      refetch();
    }, [refetch]),
  );

  const hasActiveOrder =
    orders?.some((order: any) => isActiveOrder(order)) || false;

  useEffect(() => {
    if (loading || !orders?.length || !hasActiveOrder) {
      return;
    }

    if (!routeStartedRef.current) {
      routeStartedRef.current = true;

      console.log("🚚 เริ่ม/โหลด Route ของรอบนี้");

      loadOrCreateRoute(orders);
      return;
    }

    console.log("🔄 Sync Order ใหม่กับ Route เดิม");

    syncRouteWithOrders(orders);
  }, [loading, orders, hasActiveOrder, loadOrCreateRoute, syncRouteWithOrders]);

  useEffect(() => {
    if (loading || !routeStartedRef.current) {
      return;
    }

    if (!hasActiveOrder && optimizedOrders.length > 0) {
      console.log("✅ ส่งครบทั้งรอบ → ลบ Route เก่า");

      routeStartedRef.current = false;
      clearRoute();
    }
  }, [loading, hasActiveOrder, optimizedOrders.length, clearRoute]);

  const handleLogoutPress = () => {
    Alert.alert(
      "ยืนยันการออกจากระบบ",
      "คุณต้องการออกจากระบบใช่หรือไม่?",
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ออกจากระบบ",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Failed to logout", error);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      console.log("🔄 Refresh Order อย่างเดียว");
      await refetch();
    } catch (error) {
      console.error("Failed to refresh orders", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const totalOrders = orders?.length || 0;

  const completedOrders = orders?.filter(
      (order: any) =>
        order.delivery_status === "completed" ||
        order.delivery_status === "delivered",
    ).length || 0;

  const activeOrders = (optimizedOrders || []).map((routeOrder: any) => {
      const latestOrder = orders?.find(
        (order: any) => Number(order.order_id) === Number(routeOrder.order_id),
      );

      if (!latestOrder) {
        return null;
      }

      return {
        ...routeOrder,
        ...latestOrder,
        sequence: routeOrder.sequence,
        distance_from_previous: routeOrder.distance_from_previous,
      };
    }).filter((order: any) => order && isActiveOrder(order));

  const totalRouteDistance = activeOrders.reduce(
    (total: number, order: any) =>
      total + Number(order.distance_from_previous || 0),
    0,
  );

  const isLoading = activeOrders.length === 0 && (loading || routeLoading) && !refreshing;

  const displayError = error || routeError;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.fixedHeaderSection}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>สวัสดี, {employeeName}</Text>

            <Text style={styles.subtitle}>พร้อมส่งแก๊สวันนี้หรือยัง?</Text>
          </View>

          <TouchableOpacity onPress={handleLogoutPress}>
            <Ionicons name="log-out-outline" size={36} color="#eb2929" />
          </TouchableOpacity>
        </View>

        <WeatherCard />

        <Text style={styles.sectionTitle}>สรุปยอดวันนี้</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="cube-outline" size={24} color="#0284c7" />

            <Text style={styles.statValue}>{totalOrders}</Text>

            <Text style={styles.statLabel}>ออเดอร์ทั้งหมด</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color="#10b981"
            />

            <Text style={styles.statValue}>{completedOrders}</Text>

            <Text style={styles.statLabel}>ส่งสำเร็จ</Text>
          </View>
        </View>

        <View style={styles.recentJobsHeader}>
          <View style={styles.routeHeaderLeft}>
            <Text style={styles.sectionTitle}>เส้นทางแนะนำวันนี้</Text>

            {activeOrders.length > 0 && (
              <Text style={styles.routeSubtitle}>
                เรียงตามลำดับที่ควรจัดส่ง
              </Text>
            )}
          </View>

          {activeOrders.length > 0 && (
            <View style={styles.totalDistanceContainer}>
              <View style={styles.totalDistanceIcon}>
                <Ionicons name="navigate-outline" size={18} color="#0284c7" />
              </View>

              <View style={styles.totalDistanceInfo}>
                <Text style={styles.totalDistanceLabel}>ระยะทางรวม</Text>

                <Text style={styles.totalDistanceValue}>
                  {formatDistance(totalRouteDistance)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0284c7"]}
            tintColor="#0284c7"
          />
        }
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0284c7" />

            <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : displayError ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />

            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        ) : activeOrders.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="cube-outline" size={40} color="#94a3b8" />

            <Text style={styles.emptyText}>
              ไม่มีรายการออเดอร์ที่ต้องจัดส่งในขณะนี้
            </Text>
          </View>
        ) : (
          activeOrders.map((order: any) => {
            const statusInfo = ORDER_STATUS_CONFIG[order.delivery_status] || {
              label: order.delivery_status || "ไม่ทราบสถานะ",
              bg: "#f1f5f9",
              text: "#475569",
            };

            return (
              <TouchableOpacity
                key={order.order_id}
                style={styles.jobCard}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/subdetail",
                    params: {
                      order_id: order.order_id,
                    },
                  })
                }
              >
                <View style={styles.sequenceContainer}>
                  <Text style={styles.sequenceNumber}>{order.sequence}</Text>
                </View>

                <View style={styles.jobDetails}>
                  <Text style={styles.jobTitle} numberOfLines={1}>
                    {order.customer_name}
                  </Text>

                  <Text style={styles.jobAddress} numberOfLines={1}>
                    {order.address}
                  </Text>

                  <View style={styles.distanceContainer}>
                    <Ionicons
                      name="navigate-outline"
                      size={13}
                      color="#0284c7"
                    />

                    <Text style={styles.distanceText}>
                      {order.sequence === 1 ? "จากร้าน " : "จากจุดก่อนหน้า "}

                      {formatDistance(
                        Number(order.distance_from_previous || 0),
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.jobPrice}>
                    ฿{Number(order.total_amount).toLocaleString()}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: statusInfo.bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,{color: statusInfo.text},
                      ]}
                    >
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  fixedHeaderSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  scrollArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },

  routeSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 1,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  statBox: {
    width: "48%",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 8,
  },

  statLabel: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  recentJobsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  routeHeaderLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },

  totalDistanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#f0f9ff",
  },

  totalDistanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    marginRight: 7,
  },

  totalDistanceInfo: {
    alignItems: "flex-end",
  },

  totalDistanceLabel: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 1,
  },

  totalDistanceValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0284c7",
  },

  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  sequenceContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
  },

  sequenceNumber: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0284c7",
  },

  jobDetails: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  jobTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },

  jobAddress: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },

  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  distanceText: {
    fontSize: 11,
    color: "#0284c7",
    marginLeft: 3,
    fontWeight: "500",
  },

  priceContainer: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  jobPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  centerContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 14,
  },

  errorText: {
    marginTop: 10,
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 10,
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
  },
});