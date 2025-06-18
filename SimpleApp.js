import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Super Simple App Component
 * Minimal implementation with no dependencies to test basic rendering.
 * Displays "Hello World" in the center of the screen.
 */
export default function SimpleApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // A light background color
  },
  text: {
    fontSize: 24, // Reasonably large text
    fontWeight: 'bold',
    color: '#333333', // Dark gray text color
  },
});
