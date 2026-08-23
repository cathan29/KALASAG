import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Text,
  Image,
} from 'react-native';

const AnimatedText = Animated.createAnimatedComponent(Text);

const SplashScreen = ({ onFinish }) => {
  // Animated values
  const iconY = useRef(new Animated.Value(30)).current; // Start lower for more "flight"
  const iconScale = useRef(new Animated.Value(0.8)).current; // Start smaller
  const iconOpacity = useRef(new Animated.Value(0)).current; // Start invisible
  const textOpacity = useRef(new Animated.Value(0)).current; // Starts invisible
  const textY = useRef(new Animated.Value(15)).current; // Starts below

  useEffect(() => {
    // Sequence: Icon Spring -> Motto Glide
    Animated.sequence([
      // Phase 1: Eagle "Flight" entrance with physics pop
      Animated.parallel([
        Animated.spring(iconY, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Cinematic Motto float-up (staggered)
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(textY, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Transition: Wait for the user to read the motto (~4s after anim)
      setTimeout(() => {
        if (onFinish) {
          onFinish();
        }
      }, 3000);
    });
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            opacity: iconOpacity,
            transform: [
              { translateY: iconY },
              { scale: iconScale },
            ],
          },
        ]}
      >
        <Image
          source={require('../../assets/mascot/kalasag.png')}
          style={styles.logo}
        />
      </Animated.View>

      <AnimatedText
        style={[
          styles.motto,
          {
            opacity: textOpacity,
            transform: [{ translateY: textY }],
          },
        ]}
      >
        Looking out for you, rain or shine.
      </AnimatedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden', // Bulletproof mask for white corners
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  motto: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8', // Professional slate gray
    textAlign: 'center',
    paddingHorizontal: 40,
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
