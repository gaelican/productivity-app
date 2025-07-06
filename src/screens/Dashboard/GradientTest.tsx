import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientThemeManager } from '../../core/tasks/gradients';

export const GradientTest = () => {
  const allGradients = GradientThemeManager.getAllGradients();
  const categories = GradientThemeManager.getGradientsByCategory();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>All Gradients ({allGradients.length} total)</Text>
      
      {Object.entries(categories).map(([category, gradients]) => (
        <View key={category} style={styles.category}>
          <Text style={styles.categoryTitle}>{category} ({gradients.length})</Text>
          <View style={styles.gradientGrid}>
            {gradients.map((gradient) => (
              <View key={gradient.id} style={styles.gradientItem}>
                <LinearGradient
                  colors={gradient.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientPreview}
                >
                  <Text style={[styles.gradientText, { color: gradient.textColor }]}>
                    {gradient.name}
                  </Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#1E293B',
  },
  category: {
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#475569',
  },
  gradientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gradientItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradientPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  gradientText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});