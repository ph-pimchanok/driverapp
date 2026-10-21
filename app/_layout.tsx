import React, { useEffect } from 'react';
import { Stack, useSegments, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContexts';

import { socket } from '../services/socket';

export default function RootLayout() {
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("🟢 Global Socket Connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("🔴 Global Socket Connection Error:", err.message);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, []);

  // ซ่อนแถบสถานะด้านบน
  return (
    <AuthProvider>
      <StatusBar hidden={true} />
      <RootLayoutNav />
    </AuthProvider>
  );
}

 // isLoggedIn = สถานะว่าล็อกอินอยู่หรือไม่
  // loading = กำลังตรวจสอบการล็อกอินหรือไม่
  // checkEmployeeStatus = ฟังก์ชันตรวจสอบสถานะพนักงาน
  // isInactive = พนักงานถูกปิดใช้งานหรือไม่
  // statusChecked = ตรวจสอบสถานะพนักงานเสร็จแล้วหรือยัง

function RootLayoutNav() {
  const { isLoggedIn, loading, checkEmployeeStatus, isInactive, statusChecked } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // เช็คสถานะพนักงานเมื่อล็อกอินอยู่
  useEffect(() => {
    if (isLoggedIn) {
      checkEmployeeStatus();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (loading) return;
    //  ถ้า login อยู่แต่ยังเช็คสถานะพนักงานไม่เสร็จ ห้าม route ก่อน — นี่คือจุดกันกระพริบ
    if (isLoggedIn && !statusChecked) return;

    const inAuthGroup = segments[0] === 'login';
    const inSuspendedScreen = segments[0] === 'suspended'; //หน้าแจ้ง บช ถูกระงับ  

    if (isLoggedIn && isInactive && !inSuspendedScreen) {
      router.replace('/suspended');
    }
    else if ((!isLoggedIn || !isInactive) && inSuspendedScreen) {
      router.replace(isLoggedIn ? '/(tabs)' : '/login');
    }
    // ถ้ายังไม่ล็อกอิน แต่พยายามเข้าหน้าอื่น -> ดีดไปหน้า login
    else if (!isLoggedIn && !inAuthGroup) {
      router.replace('/login');
    }
    // ถ้าล็อกอินแล้ว แต่ยังค้างอยู่หน้า login -> ดีดไปหน้า tabs
    else if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isInactive, statusChecked, segments, loading]);

  // แสดงหน้าจอโหลดระหว่างรอเช็ค token และรอเช็คสถานะพนักงาน
  if (loading || (isLoggedIn && !statusChecked)) {
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
      <Stack.Screen name="suspended" options={{ headerShown: false }} />
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