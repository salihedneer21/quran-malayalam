import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

export function GlassTabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.background} />
      <BlurView
        tint="light"
        intensity={80}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topBorder} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});
