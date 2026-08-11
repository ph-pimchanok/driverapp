import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth'; // ปรับ Path ตามตำแหน่งไฟล์จริง เช่น '../../hooks/useAuth'

export const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // เนื่องจาก RootLayout ผูกกับ isLoggedIn อยู่แล้ว 
    // พอกด logout สถานะจะเปลี่ยนเป็น false และดีดไปหน้า login อัตโนมัติครับ
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚙️ หน้า Settings</Text>

      {/* ปุ่ม Logout สำหรับทดสอบ */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ffffff" style={styles.icon} />
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 30,
    color: '#0f172a',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});