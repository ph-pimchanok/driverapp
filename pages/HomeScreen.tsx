import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Snackbar } from "../components/Snackbar";

export const HomeScreen: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // ฟังก์ชันสลับสถานะออนไลน์
  const toggleOnlineStatus = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    setSnackbarMessage(
      newStatus
        ? "🟢 เปิดรับงานแล้ว! พร้อมลุย"
        : "🔴 ปิดรับงาน พักผ่อนให้เต็มที่ครับ",
    );
    setSnackbarVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* --- ส่วนที่ฟิกซ์อยู่กับที่ (ไม่เลื่อน) --- */}
      <View style={styles.fixedHeaderSection}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>สวัสดี, คนขับสุดหล่อ 👋</Text>
            <Text style={styles.subtitle}>พร้อมส่งแก๊สวันนี้หรือยัง?</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon}>
            <Ionicons name="person-circle" size={48} color="#0284c7" />
          </TouchableOpacity>
        </View>

        {/* Status (เปิด/ปิดรับงาน) */}
        <View style={styles.statusCard}>
          <View style={styles.statusTextContainer}>
            <Ionicons
              name={isOnline ? "car" : "car-outline"}
              size={28}
              color={isOnline ? "#10b981" : "#64748b"}
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.statusTitle}>สถานะปัจจุบัน</Text>
              <Text
                style={[
                  styles.statusSubtitle,
                  { color: isOnline ? "#10b981" : "#64748b" },
                ]}
              >
                {isOnline ? "กำลังออนไลน์รับงาน" : "ออฟไลน์"}
              </Text>
            </View>
          </View>
          <Switch
            trackColor={{ false: "#cbd5e1", true: "#34d399" }}
            thumbColor={isOnline ? "#10b981" : "#f1f5f9"}
            onValueChange={toggleOnlineStatus}
            value={isOnline}
          />
        </View>

        {/* Summary Stats */}
        <Text style={styles.sectionTitle}>สรุปยอดวันนี้</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="cash-outline" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>฿1,250</Text>
            <Text style={styles.statLabel}>รายได้วันนี้</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="cube-outline" size={24} color="#8b5cf6" />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>รอบจัดส่ง</Text>
          </View>
        </View>

        {/* Recent Jobs Header (ฟิกซ์ไว้ด้วยจะได้ดูสวย) */}
        <View style={styles.recentJobsHeader}>
          <Text style={styles.sectionTitle}>งานล่าสุด</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- ส่วนที่เลื่อนได้ (เฉพาะรายการงาน) --- */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.jobCard}>
          <View style={styles.jobIcon}>
            <Ionicons name="flame" size={20} color="#ef4444" />
          </View>
          <View style={styles.jobDetails}>
            <Text style={styles.jobTitle}>ส่ง ปตท. 15 กก. (1 ถัง)</Text>
            <Text style={styles.jobAddress}>หมู่บ้านสินธร, ซอย 4</Text>
          </View>
          <Text style={styles.jobPrice}>฿350</Text>
        </View>

        <View style={styles.jobCard}>
          <View style={styles.jobIcon}>
            <Ionicons name="flame" size={20} color="#ef4444" />
          </View>
          <View style={styles.jobDetails}>
            <Text style={styles.jobTitle}>ส่ง เวิลด์แก๊ส 4 กก. (2 ถัง)</Text>
            <Text style={styles.jobAddress}>ร้านอาหารตามสั่ง เจ๊จู</Text>
          </View>
          <Text style={styles.jobPrice}>฿280</Text>
        </View>

        <View style={styles.jobCard}>
          <View style={styles.jobIcon}>
            <Ionicons name="flame" size={20} color="#ef4444" />
          </View>
          <View style={styles.jobDetails}>
            <Text style={styles.jobTitle}>ส่ง ยูนิคแก๊ส 15 กก. (1 ถัง)</Text>
            <Text style={styles.jobAddress}>คอนโดลุมพินี, ตึก A</Text>
          </View>
          <Text style={styles.jobPrice}>฿360</Text>
        </View>
        
        <View style={styles.jobCard}>
          <View style={styles.jobIcon}>
            <Ionicons name="flame" size={20} color="#ef4444" />
          </View>
          <View style={styles.jobDetails}>
            <Text style={styles.jobTitle}>ส่ง ปตท. 4 กก. (จิ๋วแจ๋ว)</Text>
            <Text style={styles.jobAddress}>หอพักป้าสมศรี</Text>
          </View>
          <Text style={styles.jobPrice}>฿150</Text>
        </View>

        <View style={styles.jobCard}>
          <View style={styles.jobIcon}>
            <Ionicons name="flame" size={20} color="#ef4444" />
          </View>
          <View style={styles.jobDetails}>
            <Text style={styles.jobTitle}>ส่ง ปตท. 48 กก. (1 ถัง)</Text>
            <Text style={styles.jobAddress}>ร้านหมูกระทะ นายต่อ</Text>
          </View>
          <Text style={styles.jobPrice}>฿1,200</Text>
        </View>
      </ScrollView>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  fixedHeaderSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    // ไม่ใส่ paddingBottom เยอะ เพื่อให้ ScrollView ต่อกันเนียนๆ
  },
  scrollArea: {
    flex: 1, // สำคัญมาก ทำให้ ScrollView กินพื้นที่ที่เหลือทั้งหมด
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
    marginTop: 20,
    marginBottom: 24,
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
  profileIcon: {
    backgroundColor: "#e0f2fe",
    borderRadius: 30,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statusTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  statusSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
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
    marginTop: 4,
  },
  jobPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
  },
});