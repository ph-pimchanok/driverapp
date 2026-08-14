import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOrder } from "../hooks/useOrder";
import { useRouter } from "expo-router";

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "รอดำเนินการ", bg: "#fef9c3", text: "#854d0e" },
  delivering: { label: "กำลังจัดส่ง", bg: "#e0f2fe", text: "#0369a1" },
  delivered: { label: "จัดส่งสำเร็จ", bg: "#dcfce7", text: "#166534" },
  success: { label: "จัดส่งสำเร็จ", bg: "#dcfce7", text: "#166534" },
  cancelled: { label: "ยกเลิกแล้ว", bg: "#fee2e2", text: "#991b1b" },
};

export const DetailsScreen: React.FC = () => {
  const router = useRouter();
  const { data: orders, loading, error, refetch } = useOrder();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

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

  const filteredOrders =
    orders?.filter((order: any) => {
      const status = order.delivery_status;
      if (selectedFilter === "all") return true;
      if (selectedFilter === "delivering") return status === "delivering";
      if (selectedFilter === "delivered")
        return (
          status === "completed" ||
          status === "delivered" ||
          status === "success"
        );
      if (selectedFilter === "cancelled") return status === "cancelled";
      return true;
    }) || [];

  const filters = [
    { key: "all", label: "ทั้งหมด" },
    { key: "delivering", label: "กำลังส่ง" },
    { key: "delivered", label: "ส่งแล้ว" },
    { key: "cancelled", label: "ยกเลิก" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>รายการงานทั้งหมด</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((filter) => {
            const isActive = selectedFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          แสดงผล{" "}
          <Text style={{ fontWeight: "bold" }}>{filteredOrders.length}</Text>{" "}
          รายการ (จากทั้งหมด {orders?.length || 0} รายการ)
        </Text>
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
        ) : filteredOrders.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="documents-outline" size={40} color="#94a3b8" />
            <Text style={styles.emptyText}>
              ไม่มีรายการออเดอร์ในเงื่อนไขนี้
            </Text>
          </View>
        ) : (
          filteredOrders.map((order: any) => {
            const statusInfo = ORDER_STATUS_CONFIG[order.delivery_status] || {
              label: order.delivery_status || "ไม่ทราบสถานะ",
              bg: "#f1f5f9",
              text: "#475569",
            };

            return (
              <TouchableOpacity
                key={order.order_id}
                style={styles.jobCard}
                onPress={() =>
                  router.push({
                    pathname: "/subdetail",
                    params: {
                      order_id: order.order_id,
                    },
                  })
                }
              >
                <View style={styles.jobIcon}>
                  <Ionicons name="receipt-outline" size={20} color="#0284c7" />
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
                    <Text
                      style={[styles.statusText, { color: statusInfo.text }]}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  filterContainer: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterChipActive: { backgroundColor: "#3c92bd", borderColor: "#e4e4e4" },
  filterText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  filterTextActive: { color: "#ffffff" },
  summaryContainer: { paddingHorizontal: 20, paddingVertical: 12 },
  summaryText: { fontSize: 14, color: "#64748b" },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
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
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
  },
  jobDetails: { flex: 1, marginLeft: 12 },
  jobTitle: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  jobAddress: { fontSize: 13, color: "#64748b", marginTop: 2 },
  priceContainer: { alignItems: "flex-end" },
  jobPrice: { fontSize: 16, fontWeight: "bold", color: "#10b981" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  centerContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { marginTop: 10, color: "#64748b", fontSize: 14 },
  errorText: {
    marginTop: 10,
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: { marginTop: 10, color: "#94a3b8", fontSize: 14 },
});
