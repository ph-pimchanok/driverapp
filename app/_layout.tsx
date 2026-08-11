import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  // 1. เช็ค Token ทันทีที่เปิดแอป
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('user_token');
        setIsLoggedIn(!!token); // ถ้ามี token เป็น true, ถ้าไม่มีเป็น false
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  // 2. คอยสลับหน้าอัตโนมัติตามสถานะล็อกอิน
  useEffect(() => {
    
    if (isLoggedIn === null) return; // กำลังเช็คอยู่ รอแป๊บ

    const inTabsGroup = segments[0] === '(tabs)';

    if (!isLoggedIn && inTabsGroup) {
      router.replace('/login');
    } else if (isLoggedIn && segments[0] === 'login') {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, segments]);

  // หน้าจอโหลดระหว่างเช็ค Token (กันหน้าจอขาวพริบ)
  if (isLoggedIn === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});