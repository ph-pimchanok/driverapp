import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router"; // 1. นำเข้า useRouter สำหรับเปลี่ยนหน้า
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Snackbar } from "../components/Snackbar";
import { WeatherCard } from "../components/WeatherCard";
import { useAuth } from "../contexts/AuthContexts";
import { useOrder } from "../hooks/useOrder";

const ORDER_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "รอดำเนินการ", bg: "#fef9c3", text: "#854d0e" },
  delivering: { label: "กำลังจัดส่ง", bg: "#e0f2fe", text: "#0369a1" },
  delivered: { label: "จัดส่งสำเร็จ", bg: "#dcfce7", text: "#166534" },
  cancelled: { label: "ยกเลิกแล้ว", bg: "#fee2e2", text: "#991b1b" },
};

export const HomeScreen: React.FC = () => {
  const router = useRouter(); // 2. ประกาศใช้ router
  const { logout } = useAuth();
  const { data: orders, loading, error, refetch } = useOrder(); 

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [employeeName, setEmployeeName] = useState("คนขับสุดหล่อ");
  const [refreshing, setRefreshing] = useState(false);

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

  const handleLogoutPress = () => {
    Alert.alert(
      "ยืนยันการออกจากระบบ",
      "คุณต้องการออกจากระบบใช่หรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
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
      { cancelable: true }
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refetch) {
        await refetch();
      }
    } catch (error) {
      console.error("Failed to refresh orders", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const totalOrders = orders?.length || 0;
  const completedOrders = orders?.filter(
    (order: any) => order.delivery_status === "completed" || order.delivery_status === "delivered"
  ).length || 0;

  const activeOrders = orders?.filter(
    (order: any) =>
      order.delivery_status !== "completed" &&
      order.delivery_status !== "delivered" &&
      order.delivery_status !== "cancelled"
  ) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.fixedHeaderSection}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>สวัสดี, {employeeName}</Text>
            <Text style={styles.subtitle}>พร้อมส่งแก๊สวันนี้หรือยัง?</Text>
          </View>
          <TouchableOpacity onPress={handleLogoutPress}>
            <Ionicons name="log-out-outline" size={36} color="#eb2929" />
          </TouchableOpacity>
        </View>

        {/* Weather Card */}
        <WeatherCard />

        {/* Summary Stats */}
        <Text style={styles.sectionTitle}>สรุปยอดวันนี้</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="cube-outline" size={24} color="#0284c7" />
            <Text style={styles.statValue}>{totalOrders}</Text>
            <Text style={styles.statLabel}>ออเดอร์ทั้งหมด</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
            <Text style={styles.statValue}>{completedOrders}</Text>
            <Text style={styles.statLabel}>ส่งสำเร็จ</Text>
          </View>
        </View>

        {/* Recent Jobs Header */}
        <View style={styles.recentJobsHeader}>
          <Text style={styles.sectionTitle}>งานวันนี้ (ที่ยังไม่ส่ง)</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- ส่วนที่เลื่อนได้ --- */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0284c7"]}
            tintColor={"#0284c7"}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.loadingText}>กำลังโหลดรายการออเดอร์...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : activeOrders.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="cube-outline" size={40} color="#94a3b8" />
            <Text style={styles.emptyText}>ไม่มีรายการออเดอร์ที่ต้องจัดส่งในขณะนี้</Text>
          </View>
        ) : (
          activeOrders.map((order: any) => {
            const statusInfo = ORDER_STATUS_CONFIG[order.delivery_status] || {
              label: order.delivery_status || "ไม่ทราบสถานะ",
              bg: "#f1f5f9",
              text: "#475569",
            };

            return (
              // 3. เปลี่ยนจาก View ธรรมดาเป็น TouchableOpacity แล้วส่ง order_id ไปยังหน้า subdetail
              <TouchableOpacity
                key={order.order_id}
                style={styles.jobCard}
                activeOpacity={0.7}
                onPress={() => {
                  router.push({
                    pathname: "/subdetail", // หรือชื่อ path ของหน้า SubDetail ตามโครงสร้างโฟลเดอร์ของคุณ (เช่น "/(routes)/subdetail" หรือ "./subdetail")
                    params: { order_id: order.order_id },
                  });
                }}
              >
                <View style={styles.jobIcon}>
                  <Ionicons name="flame" size={20} color="#ef4444" />
                </View>
                <View style={styles.jobDetails}>
                  <Text style={styles.jobTitle} numberOfLines={1}>
                    {order.customer_name}
                  </Text>
                  <Text style={styles.jobAddress} numberOfLines={1}>
                    {order.address}
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.jobPrice}>
                    ฿{Number(order.total_amount).toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusInfo.bg },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusInfo.text }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Snackbar */}
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
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statBox: {
    width: "48%",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
    marginBottom: 8,
  },
  seeAllText: {
    color: "#0284c7",
    fontSize: 14,
    fontWeight: "600",
  },
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  jobIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  jobDetails: {
    flex: 1,
    marginLeft: 12,
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
  priceContainer: {
    alignItems: "flex-end",
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
  },
});