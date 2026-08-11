import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Snackbar, SnackbarType } from '../components/Snackbar';

export const LoginScreen = () => {
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // State สำหรับ Snackbar Custom
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('error');

  const { login, loading } = useAuth();

  const triggerSnackbar = (message: string, type: SnackbarType = 'error') => {
    
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      triggerSnackbar('กรุณากรอกเบอร์โทรศัพท์และรหัสผ่าน', 'warning');
      return;
    }

    const result = await login({ phone, password });

    if (result.success) {
      triggerSnackbar('เข้าสู่ระบบสำเร็จ', 'success');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500); // หน่วงเวลานิดนึงให้ Snackbar แสดงผลก่อนย้ายหน้า
    } else {
      triggerSnackbar(result.error || 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Animated Snackbar พร้อมรับค่า type (success, error, warning, info) */}
      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.innerContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="flame" size={48} color="#0284c7" />
            </View>
            <Text style={styles.title}>GASDRIVER</Text>
            <Text style={styles.subtitle}>ระบบสำหรับคนขับรถส่งแก๊ส</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Input: Phone */}
            <Text style={styles.label}>เบอร์โทรศัพท์</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="08X-XXX-XXXX"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />
            </View>

            {/* Input: Password */}
            <Text style={styles.label}>รหัสผ่าน</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="กรอกรหัสผ่าน"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: '#0284c7',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});