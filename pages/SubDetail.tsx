import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const ORDER_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "รอดำเนินการ", bg: "#fef9c3", text: "#854d0e" },
  delivering: { label: "กำลังจัดส่ง", bg: "#e0f2fe", text: "#0369a1" },
  delivered: { label: "จัดส่งสำเร็จ", bg: "#dcfce7", text: "#166534" },
  success: { label: "จัดส่งสำเร็จ", bg: "#dcfce7", text: "#166534" },
  cancelled: { label: "ยกเลิกแล้ว", bg: "#fee2e2", text: "#991b1b" },
};

export const SubDetail: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const order_id = params.order_id || "29";

  // ข้อมูลจำลอง (Mock Data) - เปลี่ยนเป็นรายการแก๊ส
  const mockOrderData: Record<string, any> = {
    [String(order_id)]: {
      order_id: order_id,
      order_date: "2026-08-13T11:53:23.000Z",
      delivery_status: "delivering",
      customer_name: "ร้านอาหารครัวคุณลุง",
      phone: "089-111-2222",
      address: "88/9 ถ.พหลโยธิน จ.กรุงเทพ",
      delivery_note: "ส่งหลังร้าน ประตูทางเข้าห้องครัว",
      latitude: 13.756331,
      longitude: 100.501765,
      items: [
        { id: 1, name: "ถังแก๊ส ปตท. ขนาด 15 กก. (สลับถัง)", quantity: 2, price: 420 },
        { id: 2, name: "ถังแก๊ส ปตท. ขนาด 4 กก. (ปิคนิค)", quantity: 1, price: 210 },
        { id: 3, name: "สายยางแก๊สอย่างหนา (เมตร)", quantity: 2, price: 50 },
      ]
    }
  };

  const currentOrder = mockOrderData[String(order_id)] || mockOrderData["29"];

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

  const total_amount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  // --- State สำหรับรูปถ่ายยืนยันการส่ง ---
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const openGoogleMap = () => {
    const lat = latitude ? Number(latitude) : null;
    const lng = longitude ? Number(longitude) : null;
    const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(String(address || ''));
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.canOpenURL(webUrl).then((supported) => {
      if (supported) {
        Linking.openURL(webUrl);
      }
    });
  };

  // เปิดกล้องถ่ายรูปจริง
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ต้องการสิทธิ์การใช้กล้อง', 'กรุณาอนุญาตให้แอปเข้าถึงกล้องเพื่อถ่ายรูปยืนยันการจัดส่ง');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProofPhoto(result.assets[0].uri);
    }
  };

  const handleRetakePhoto = () => {
    setProofPhoto(null);
  };


  const handleConfirmDelivery = async () => {
    if (!proofPhoto) {
      Alert.alert('กรุณาถ่ายรูป', 'ต้องถ่ายรูปยืนยันการจัดส่งก่อน');
      return;
    }

    setIsConfirming(true);
    try {

      await new Promise((resolve) => setTimeout(resolve, 1000)); // จำลองการเรียก API

      Alert.alert('สำเร็จ', 'ยืนยันการจัดส่งเรียบร้อยแล้ว', [
        { text: 'ตกลง', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถยืนยันการจัดส่งได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsConfirming(false);
    }
  };

  const statusInfo = ORDER_STATUS_CONFIG[delivery_status] || {
    label: delivery_status || "ไม่ทราบสถานะ",
    bg: "#f1f5f9",
    text: "#475569",
  };

  return (

    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายละเอียดออเดอร์ #{order_id}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>สถานะการจัดส่ง</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusText, { color: statusInfo.text }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          {order_date && (
            <>
              <View style={styles.divider} />
              <Text style={styles.dateText}>
                วันที่สั่งซื้อ: {new Date(String(order_date)).toLocaleString('th-TH')}
              </Text>
            </>
          )}
        </View>

        {/* Order Items Card (รายการแก๊ส) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>รายการสินค้า (แก๊ส)</Text>
          {items.map((item: any, index: number) => (
            <View key={item.id || index} style={styles.itemRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                ฿{(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>ยอดรวมทั้งสิ้น</Text>
            <Text style={styles.priceText}>฿{total_amount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Customer Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ข้อมูลลูกค้า & การจัดส่ง</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#64748b" style={styles.infoIcon} />
            <Text style={styles.infoText}>{customer_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#64748b" style={styles.infoIcon} />
            <Text style={styles.infoText}>{phone}</Text>
            {phone && (
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Ionicons name="call" size={16} color="#ffffff" />
                <Text style={styles.callButtonText}>โทร</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#64748b" style={styles.infoIcon} />
            <Text style={[styles.infoText, { flex: 1 }]}>{address}</Text>
          </View>

          {delivery_note ? (
            <View style={styles.noteContainer}>
              <Text style={styles.noteTitle}>หมายเหตุการจัดส่ง:</Text>
              <Text style={styles.noteText}>{delivery_note}</Text>
            </View>
          ) : null}

          {/* Map Button */}
          <TouchableOpacity style={styles.mapButton} onPress={openGoogleMap}>
            <Ionicons name="map-outline" size={20} color="#ffffff" />
            <Text style={styles.mapButtonText}>นำทางด้วย Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Confirmation Photo Card */}
        {delivery_status !== 'delivered' && delivery_status !== 'success' && delivery_status !== 'cancelled' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>ยืนยันการจัดส่ง</Text>
            <Text style={styles.helperText}>ถ่ายรูปหน้างานเพื่อยืนยันว่าจัดส่งสำเร็จ</Text>

            {proofPhoto ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: proofPhoto }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.retakeButton} onPress={handleRetakePhoto}>
                  <Ionicons name="camera-reverse-outline" size={16} color="#0284c7" />
                  <Text style={styles.retakeButtonText}>ถ่ายใหม่</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.takePhotoButton} onPress={handleTakePhoto}>
                <Ionicons name="camera-outline" size={22} color="#ffffff" />
                <Text style={styles.takePhotoButtonText}>ถ่ายรูปยืนยัน</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!proofPhoto || isConfirming) && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmDelivery}
              disabled={!proofPhoto || isConfirming}
            >
              {isConfirming ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
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
  // -- Container & Layout --
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  scrollContent: { 
    padding: 20,
    paddingBottom: 40 // เพิ่มช่องว่างด้านล่างสุดไม่ให้ชนขอบจอ Android
  },
  rowBetween: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  
  // -- Header --
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#0f172a' 
  },
  backButton: { 
    padding: 4 
  },

  // -- Cards --
  card: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#f1f5f9', 
    marginVertical: 12 
  },

  // -- Typography --
  cardLabel: { 
    fontSize: 14, 
    color: '#64748b', 
    fontWeight: '600' 
  },
  priceText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#10b981' 
  },
  totalLabel: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#0f172a' 
  },
  dateText: { 
    fontSize: 12, 
    color: '#94a3b8', 
    textAlign: 'right' 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0f172a', 
    marginBottom: 12 
  },
  helperText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
    marginTop: -6,
  },

  // -- Order Items --
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  itemName: { 
    fontSize: 14, 
    color: '#334155', 
    fontWeight: '500' 
  },
  itemQty: { 
    fontSize: 12, 
    color: '#64748b', 
    marginTop: 2 
  },
  itemPrice: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#0f172a' 
  },

  // -- Customer Info & Actions --
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  infoIcon: { 
    marginRight: 10 
  },
  infoText: { 
    fontSize: 14, 
    color: '#334155' 
  },
  
  noteContainer: { 
    backgroundColor: '#fef9c3', 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 4, 
    marginBottom: 12 
  },
  noteTitle: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#854d0e', 
    marginBottom: 2 
  },
  noteText: { 
    fontSize: 13, 
    color: '#713f12' 
  },

  // -- Buttons --
  callButton: { 
    flexDirection: 'row', 
    backgroundColor: '#10b981', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    marginLeft: 'auto', 
    alignItems: 'center', 
    gap: 4 
  },
  callButtonText: { 
    color: '#ffffff', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  mapButton: { 
    flexDirection: 'row', 
    backgroundColor: '#0284c7', 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 8, 
    gap: 8 
  },
  mapButtonText: { 
    color: '#ffffff', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },

  // -- Status Badge --
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: '600' 
  },

  // -- Photo Confirmation --
  takePhotoButton: {
    flexDirection: 'row',
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  takePhotoButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  photoPreviewContainer: {
    marginBottom: 12,
  },
  photoPreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
  },
  retakeButtonText: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});