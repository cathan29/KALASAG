import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, Easing } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RainBackgroundProps {
  intensity?: number;
  speed?: number;
  color?: string;
  angle?: number;
  dropSize?: {
    min: number;
    max: number;
  };
}

interface RainDropProps {
  left: string;
  duration: number;
  color: string;
  size: number;
}

const RainDrop: React.FC<RainDropProps> = ({ left, duration, color, size }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const animate = () => {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT + 100,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        translateY.setValue(-100);
        animate();
      });
    };

    animate();
  }, [duration, translateY]);

  return (
    <Animated.View
      style={[
        styles.drop,
        {
          left: left,
          width: size,
          height: size * 20,
          backgroundColor: color,
        },
        {
          transform: [{ translateY: translateY }],
        },
      ]}
    />
  );
};

export const RainBackground: React.FC<RainBackgroundProps> = ({
  intensity = 40,
  speed = 1,
  color = 'rgba(174, 194, 224, 0.5)',
  angle = 0,
  dropSize = { min: 1, max: 3 },
}) => {
  const drops = useMemo(() => {
    return Array.from({ length: intensity }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: (Math.random() * 1000 + 500) / speed,
      size: Math.random() * (dropSize.max - dropSize.min) + dropSize.min,
    }));
  }, [intensity, speed, dropSize.min, dropSize.max]);

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { transform: [{ rotate: `${angle}deg` }] }]}
    >
      {drops.map((drop) => (
        <RainDrop
          key={drop.id}
          left={drop.left}
          duration={drop.duration}
          color={color}
          size={drop.size}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    top: '-25%',
    left: '-25%',
    overflow: 'hidden',
  },
  drop: {
    position: 'absolute',
    top: 0,
  },
});
