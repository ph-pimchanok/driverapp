import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContexts'; // ปรับ path ตามที่คุณวางไฟล์จริง

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { isLoggedIn, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // ถ้ายังโหลดข้อมูลเช็ค Token อยู่ ไม่ต้องทำอะไร
    if (loading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (!isLoggedIn && inTabsGroup) {
      // ถ้ายังไม่ล็อกอิน แต่อยู่ในหน้าแท็บ -> ดีดไปหน้า login
      router.replace('/login');
    } else if (isLoggedIn && segments[0] === 'login') {
      // ถ้าล็อกอินแล้ว แต่อยู่หน้า login -> ดีดไปหน้า tabs
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, loading, segments]);

  // หน้าจอโหลดระหว่างเช็คสถานะ
  if (loading) {
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