import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import Icon from './Icon';
import { ThemedText } from './ThemedText';

type NotificationToast = {
  id: number;
  message: string;
};

type NotificationHostProps = {
  toast: NotificationToast | null;
  onHide: (toastId: number) => void;
};

const TOAST_AUTO_DISMISS_MS = 2200;

export default function NotificationHost({
  toast,
  onHide,
}: NotificationHostProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-18)).current;

  useEffect(() => {
    if (!toast) {
      return;
    }

    opacity.setValue(0);
    translateY.setValue(-18);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timeoutId = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onHide(toast.id);
        }
      });
    }, TOAST_AUTO_DISMISS_MS);

    return () => clearTimeout(timeoutId);
  }, [onHide, opacity, toast, translateY]);

  if (!toast) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View pointerEvents="box-none" style={styles.overlay}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              marginTop: insets.top + SPACING.md,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View
            style={[
              styles.accentBar,
              { backgroundColor: colors.primary },
            ]}
          />

          <View style={styles.content}>
            <Icon name="checkmark-circle" size={18} variant="primary" />
            <ThemedText numberOfLines={2} style={styles.message}>
              {toast.message}
            </ThemedText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
  },
  toast: {
    width: '88%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
