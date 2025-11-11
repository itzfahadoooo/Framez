import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Layout
} from 'react-native-reanimated';

interface AnimatedScreenProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide';
}

export const AnimatedScreen: React.FC<AnimatedScreenProps> = ({ 
  children, 
  type = 'fade' 
}) => {
  const entering = type === 'slide' 
    ? SlideInRight.duration(300).springify().damping(20)
    : FadeIn.duration(300);
    
  const exiting = type === 'slide'
    ? SlideOutLeft.duration(300).springify().damping(20)
    : FadeOut.duration(200);

  return (
    <Animated.View
      entering={entering}
      exiting={exiting}
      layout={Layout.duration(200)}
      style={styles.container}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});