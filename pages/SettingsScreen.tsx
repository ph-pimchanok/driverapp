import { useRouter } from 'expo-router';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export const SettingsScreen: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚙️ หน้า Settings</Text>
      <Button title="กลับไปหน้าหลัก" onPress={() => router.replace('/')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
});