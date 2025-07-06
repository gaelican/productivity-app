import { Animated, Easing } from 'react-native';
import { StackCardInterpolationProps } from '@react-navigation/stack';
import { NavigationPerformanceTier, TransitionConfig } from '../types';

// Get transition configuration based on performance tier
export const getTransitionConfig = (tier: NavigationPerformanceTier): TransitionConfig => {
  switch (tier) {
    case 'basic':
      return {
        type: 'instant',
        duration: 0,
      };
    case 'standard':
      return {
        type: 'slide',
        duration: 300,
        easing: 'linear',
      };
    case 'premium':
      return {
        type: 'spring',
        duration: 400,
        easing: 'ease-out',
        parallax: true,
      };
  }
};

// Instant transition (for basic tier)
export const instantTransition = {
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 0,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 0,
      },
    },
  },
  cardStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
    cardStyle: {
      opacity: current.progress,
    },
  }),
};

// Simple slide transition (for standard tier)
export const slideTransition = {
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.out(Easing.poly(4)),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.in(Easing.poly(4)),
      },
    },
  },
  cardStyleInterpolator: ({ current, next, layouts }: StackCardInterpolationProps) => {
    const translateX = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [layouts.screen.width, 0],
    });

    const opacity = current.progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
    });

    return {
      cardStyle: {
        transform: [{ translateX }],
        opacity,
      },
    };
  },
};

// Spring transition with parallax (for premium tier)
export const springTransition = {
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 500,
        damping: 45,
        mass: 0.8,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 500,
        damping: 45,
        mass: 0.8,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
  cardStyleInterpolator: ({ current, next, layouts }: StackCardInterpolationProps) => {
    const translateX = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [layouts.screen.width, 0],
    });

    const scale = current.progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.9, 0.95, 1],
    });

    const opacity = current.progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.7, 1],
    });

    // Parallax effect for the screen being pushed back
    const nextTranslateX = next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -layouts.screen.width * 0.3],
        })
      : 0;

    const nextOpacity = next
      ? next.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 0.7, 0.5],
        })
      : 1;

    return {
      cardStyle: {
        transform: [{ translateX }, { scale }],
        opacity,
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
    };
  },
};

// Modal presentation transitions
export const modalTransition = {
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 300,
        damping: 30,
        mass: 0.8,
        overshootClamping: true,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
        easing: Easing.out(Easing.poly(4)),
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }: StackCardInterpolationProps) => {
    const translateY = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [layouts.screen.height, 0],
    });

    const opacity = current.progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
    });

    return {
      cardStyle: {
        transform: [{ translateY }],
      },
      overlayStyle: {
        opacity,
      },
    };
  },
};

// Fade transition (for subtle screen changes)
export const fadeTransition = {
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      },
    },
  },
  cardStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
    cardStyle: {
      opacity: current.progress,
    },
  }),
};

// Get appropriate transition based on tier and transition type
export const getTransition = (tier: NavigationPerformanceTier, type: 'screen' | 'modal' | 'fade' = 'screen') => {
  if (tier === 'basic') {
    return instantTransition;
  }

  if (type === 'modal') {
    return modalTransition;
  }

  if (type === 'fade') {
    return fadeTransition;
  }

  if (tier === 'standard') {
    return slideTransition;
  }

  return springTransition;
};