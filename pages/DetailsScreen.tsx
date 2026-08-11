import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { Snackbar } from '../components/Snackbar';

export const DetailsScreen: React.FC = () => {
  const router = useRouter();
  const [showSnack, setShowSnack] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 หน้า Details</Text>
      <Text style={styles.subtitle}>หน้านี้ดึง UI มาจาก pages/DetailsScreen.tsx</Text>

      <Button
        title="Trigger Snackbar ในหน้านี้"
        onPress={() => setShowSnack(true)}
        color="#8b5cf6"
      />
      <View style={{ height: 12 }} />
      <Button title="ย้อนกลับ" onPress={() => router.back()} color="#ef4444" />

      <Snackbar
        visible={showSnack}
        message="เก็บบันทึกข้อมูล Details เรียบร้อย!"
        onDismiss={() => setShowSnack(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
});