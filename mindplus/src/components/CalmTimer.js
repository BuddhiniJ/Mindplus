import React, { useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

// Circular countdown built with two animated half-circles (no SVG dependency).
export default function CalmTimer({
  size = 220,
  thickness = 8,
  progressAnim, // Animated.Value between 0 (done) and 1 (full)
  pulseAnim,
  remainingLabel,
  note = "1-minute calm focus",
  ringColor = "#A5B4FC",
  textColor = "#0F172A",
}) {
  const AnimatedCircle = useMemo(
    () => Animated.createAnimatedComponent(Circle),
    []
  );

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const clampedProgress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const strokeDashoffset = clampedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
    extrapolate: "clamp",
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [1, 1.08],
    outputRange: [1, 1.08],
  });

  return (
    <View style={styles.wrapper}> 
      <View style={[styles.ringStack, { width: size, height: size }]}> 
        <Svg width={size} height={size} style={styles.svg}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={`${ringColor}55`}
            strokeWidth={thickness}
            fill="transparent"
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={ringColor}
            strokeWidth={thickness}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            originX={center}
            originY={center}
            rotation={-90}
          />
        </Svg>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulse,
            {
              width: size * 0.5,
              height: size * 0.5,
              borderRadius: (size * 0.5) / 2,
              backgroundColor: `${ringColor}33`,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.timerMain, { color: textColor }]}>{remainingLabel}</Text>
        <Text style={styles.timerNote}>{note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 12,
  },
  ringStack: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  pulse: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
  },
  textBlock: {
    alignItems: "center",
    gap: 6,
  },
  timerMain: {
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: 1,
  },
  timerNote: {
    fontSize: 13,
    color: "#4B5563",
  },
});
