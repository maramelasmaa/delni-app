import React, { useEffect, useLayoutEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation } from 'expo-router';

const DOT_COUNT = 3;

export default function SplashScreen() {
  const navigation = useNavigation();
  const dotAnims = React.useRef(Array.from({ length: DOT_COUNT }, () => new Animated.Value(0))).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.stagger(
        180,
        dotAnims.map((value) =>
          Animated.sequence([
            Animated.timing(value, {
              toValue: 1,
              duration: 420,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: 0,
              duration: 420,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    );
    pulse.start();

    const timer = setTimeout(() => {
      router.replace('/(tabs)/');
    }, 2300);

    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, [dotAnims]);

  return (
    <LinearGradient
      colors={['#0A1A33', '#070E1F', '#050A17']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandName}>دلني</Text>
        </View>
        <Text style={styles.tagline}>ابحث عن الخدمات بسهولة</Text>

        <View style={styles.dotsRow}>
          {dotAnims.map((value, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                  transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#F4C400',
  },
  brandName: {
    fontSize: 56,
    lineHeight: 76,
    fontFamily: 'Cairo-Black',
    color: '#FFFFFF',
  },
  tagline: {
    marginTop: 6,
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  dotsRow: {
    marginTop: 40,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
