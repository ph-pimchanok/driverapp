import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContexts';

export default function SuspendedScreen() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6570/6570183.png' }} 
        style={styles.image as any}
        resizeMode="contain"
      />
      <Text style={styles.title}>บัญชีของคุณถูกระงับการใช้งาน</Text>
      <Text style={styles.subtitle}>
        ขออภัยในความไม่สะดวก บัญชีนี้ถูกระงับชั่วคราวหรือถาวร กรุณาติดต่อผู้ดูแลระบบเพื่อสอบถามรายละเอียดเพิ่มเติม
      </Text>

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>กลับสู่หน้าเข้าสู่ระบบ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // 💡 แก้เป็นตัวเลข (ไม่มีเครื่องหมายคำพูด) แล้ว
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});