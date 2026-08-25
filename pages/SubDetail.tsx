import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSubDetail } from "../hooks/useSubDetail";
import { Snackbar, SnackbarType } from "../components/Snackbar";
import { useOrder } from "@/hooks/useOrder";

import AsyncStorage from '@react-native-async-storage/async-storage';


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

export const SubDetail: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const order_id = String(params.order_id || "30");

  // State สำหรับ Snackbar (อิงตามรูปแบบหน้า Login)
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarType, setSnackbarType] = useState<SnackbarType>("info");


  const { data: orders, refetch } = useOrder();

  const triggerSnackbar = (message: string, type: SnackbarType = "info") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const {
    data: currentOrder,
    loading,
    error,
    proofPhoto,
    isConfirming,
    handleTakePhoto,
    handleRetakePhoto,
    handleConfirmDelivery,
    updateStatusVihicle
  } = useSubDetail(order_id, router);

  const onSubmitDelivery = async () => {
    try {
      await handleConfirmDelivery();
      triggerSnackbar("ยืนยันการจัดส่งสำเร็จ", "success");

      refetch()

      const remainingOrders = (orders || []).filter(
        (o: any) => o.order_id !== Number(order_id) && o.delivery_status !== "delivered"
      );

      if (remainingOrders.length === 0) {

            const vehicleId = await AsyncStorage.getItem('vehicle_id'); 

            if (vehicleId) {
              await updateStatusVihicle(vehicleId);
            } else {
              console.log("ไม่พบ ID รถใน Storage");
            }
      }

      setTimeout(() => {
        router.back();
      }, 1000);

    } catch (err: any) {
      triggerSnackbar(err?.message || "เกิดข้อผิดพลาดในการยืนยัน", "error");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </SafeAreaView>
    );
  }

  if (error || !currentOrder) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error || "ไม่พบข้อมูลออเดอร์"}</Text>
        <TouchableOpacity
          style={styles.backButtonSimple}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonSimpleText}>ย้อนกลับ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const {
    order_date,
    delivery_status,
    customer_name,
    phone,
    address,
    delivery_note,
    latitude,
    longitude,
    items,
  } = currentOrder;

  const total_amount = (items || []).reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const openGoogleMap = () => {
    const lat = latitude ? Number(latitude) : null;
    const lng = longitude ? Number(longitude) : null;
    const query =
      lat && lng ? `${lat},${lng}` : encodeURIComponent(String(address || ""));
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.canOpenURL(webUrl).then((supported) => {
      if (supported) {
        Linking.openURL(webUrl);
      }
    });
  };

  const statusInfo = ORDER_STATUS_CONFIG[delivery_status] || {
    label: delivery_status || "ไม่ทราบสถานะ",
    bg: "#f1f5f9",
    text: "#475569",
  };

  const isCompleted = ["delivered", "success", "cancelled"].includes(
    delivery_status,
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Custom Animated Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายละเอียดออเดอร์ #{order_id}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>สถานะการจัดส่ง</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}
            >
              <Text style={[styles.statusText, { color: statusInfo.text }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          {order_date && (
            <>
              <View style={styles.divider} />
              <Text style={styles.dateText}>
                วันที่สั่งซื้อ:{" "}
                {new Date(String(order_date)).toLocaleString("th-TH")}
              </Text>
            </>
          )}
        </View>

        {/* Order Items Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>รายการสินค้า (แก๊ส)</Text>
          {(items || []).map((item, index) => {
            const itemTotal = Number(item.price) * Number(item.quantity);
            return (
              <View key={item.id || index} style={styles.itemRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  ฿{itemTotal.toLocaleString()}
                </Text>
              </View>
            );
          })}
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>ยอดรวมทั้งสิ้น</Text>
            <Text style={styles.priceText}>
              ฿{total_amount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Customer Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ข้อมูลลูกค้า & การจัดส่ง</Text>

          <View style={styles.infoRow}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#64748b"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{customer_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#64748b"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{phone}</Text>
            {phone && (
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Ionicons name="call" size={16} color="#ffffff" />
                <Text style={styles.callButtonText}>โทร</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#64748b"
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { flex: 1 }]}>{address}</Text>
          </View>

          {delivery_note ? (
            <View style={styles.noteContainer}>
              <Text style={styles.noteTitle}>หมายเหตุการจัดส่ง:</Text>
              <Text style={styles.noteText}>{delivery_note}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.mapButton} onPress={openGoogleMap}>
            <Ionicons name="map-outline" size={20} color="#ffffff" />
            <Text style={styles.mapButtonText}>นำทางด้วย Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Confirmation Photo Card */}
        {!isCompleted && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ยืนยันการจัดส่ง</Text>
            <Text style={styles.helperText}>
              ถ่ายรูปหน้างานเพื่อยืนยันว่าจัดส่งสำเร็จ
            </Text>

            {proofPhoto ? (
              <View style={styles.photoPreviewContainer}>
                <Image
                  source={{ uri: proofPhoto }}
                  style={styles.photoPreview}
                />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={handleRetakePhoto}
                >
                  <Ionicons
                    name="camera-reverse-outline"
                    size={16}
                    color="#0284c7"
                  />
                  <Text style={styles.retakeButtonText}>ถ่ายใหม่</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.takePhotoButton}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={22} color="#ffffff" />
                <Text style={styles.takePhotoButtonText}>ถ่ายรูปยืนยัน</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!proofPhoto || isConfirming) && styles.confirmButtonDisabled,
              ]}
              onPress={onSubmitDelivery}
              disabled={!proofPhoto || isConfirming}
            >
              {isConfirming ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#ffffff"
                  />
                  <Text style={styles.confirmButtonText}>ยืนยันการจัดส่ง</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { marginTop: 10, color: "#64748b", fontSize: 14 },
  errorText: {
    marginTop: 10,
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  backButtonSimple: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonSimpleText: { color: "#ffffff", fontWeight: "bold" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  backButton: { padding: 4 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },
  cardLabel: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  priceText: { fontSize: 18, fontWeight: "bold", color: "#10b981" },
  totalLabel: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  dateText: { fontSize: 12, color: "#94a3b8", textAlign: "right" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  helperText: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 14,
    marginTop: -6,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: { fontSize: 14, color: "#334155", fontWeight: "500" },
  itemQty: { fontSize: 12, color: "#64748b", marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  infoIcon: { marginRight: 10 },
  infoText: { fontSize: 14, color: "#334155" },
  noteContainer: {
    backgroundColor: "#fef9c3",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#854d0e",
    marginBottom: 2,
  },
  noteText: { fontSize: 13, color: "#713f12" },
  callButton: {
    flexDirection: "row",
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: "auto",
    alignItems: "center",
    gap: 4,
  },
  callButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  mapButton: {
    flexDirection: "row",
    backgroundColor: "#0284c7",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 8,
  },
  mapButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: "600" },
  takePhotoButton: {
    flexDirection: "row",
    backgroundColor: "#334155",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
  },
  takePhotoButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
  photoPreviewContainer: { marginBottom: 12 },
  photoPreview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
  },
  retakeButtonText: { color: "#0284c7", fontSize: 13, fontWeight: "600" },
  confirmButton: {
    flexDirection: "row",
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmButtonDisabled: { backgroundColor: "#94a3b8" },
  confirmButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
});
