import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface SnackbarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
  type?: SnackbarType;
  icon?: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
}
// ข้อความแจ้งเตือนex.กรุณากรอกรหัวใหม่
export const Snackbar: React.FC<SnackbarProps> = ({ visible, message, onDismiss, duration = 2000, type = 'error', icon, backgroundColor,}) => {

  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-100)).current;

  // กำหนด Preset สีและ Icon ตาม Type
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: '#16a34a',
          iconName: 'checkmark-circle-outline' as const,
        };
      case 'warning':
        return {
          bgColor: '#d97706',
          iconName: 'warning-outline' as const,
        };
      case 'info':
        return {
          bgColor: '#0284c7',
          iconName: 'information-circle-outline' as const,
        };
      case 'error':
      default:
        return {
          bgColor: '#dc2626',
          iconName: 'alert-circle-outline' as const,
        };
    }
  };

  const config = getTypeConfig();
  const activeBgColor = backgroundColor || config.bgColor;
  const activeIcon = icon || config.iconName;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 20,
          duration: 350,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideSnackbar();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideSnackbar = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -100,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: activeBgColor,
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        {activeIcon && (
          <Ionicons
            name={activeIcon}
            size={22}
            color="#FFFFFF"
            style={styles.icon}
          />
        )}
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
});