import { StyleSheet, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { palette } from '@/src/theme/palette';

export type CardProps = ViewProps & {
  variant?: 'default' | 'gradient';
};

export function Card({ style, variant = 'default', children, ...props }: CardProps) {
  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={palette.gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, style]}
        {...props}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
});
