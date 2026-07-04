import React, { useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation } from 'expo-router';

export default function SplashScreen() {
  const navigation = useNavigation();
  const titleOpacity = React.useRef(new Animated.Value(0)).current;
  const taglineOpacity = React.useRef(new Animated.Value(0)).current;
  const dotsScale = React.useRef(new Animated.Value(0.6)).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotsScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dotsScale, {
            toValue: 0.6,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/(tabs)/');
    }, 2500);

    return () => clearTimeout(timer);
  }, [titleOpacity, taglineOpacity, dotsScale]);

  return (
    <LinearGradient
      colors={['#071A33', '#0E2A4D', '#123A6F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Main Title */}
        <Animated.View style={[{ opacity: titleOpacity }]}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
            <Text style={styles.title}>دلني</Text>
            <Text style={[styles.title, { color: '#FCD34D' }]}>.</Text>
          </View>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[{ opacity: taglineOpacity }]}>
          <Text style={styles.tagline}>ابحث عن الخدمات بسهولة</Text>
        </Animated.View>

        {/* Loading Dots - Elegant Fade Animation */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => {
            const dotAnim = React.useRef(new Animated.Value(0.4)).current;

            React.useEffect(() => {
              Animated.loop(
                Animated.sequence([
                  Animated.delay(index * 200),
                  Animated.timing(dotAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                  }),
                  Animated.timing(dotAnim, {
                    toValue: 0.4,
                    duration: 800,
                    useNativeDriver: true,
                  }),
                ])
              ).start();
            }, [dotAnim]);

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: '#FFFFFF',
                    opacity: dotAnim,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    fontSize: 56,
    fontFamily: 'Cairo-Black',
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 32,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
