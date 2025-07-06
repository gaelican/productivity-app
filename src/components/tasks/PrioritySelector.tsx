import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface PrioritySelectorProps {
  value: 'low' | 'medium' | 'high' | 'urgent';
  onChange: (priority: 'low' | 'medium' | 'high' | 'urgent') => void;
  label?: string;
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  value,
  onChange,
  label = 'Priority',
}) => {
  const priorities: Array<{
    value: 'low' | 'medium' | 'high' | 'urgent';
    label: string;
    color: string;
    emoji: string;
  }> = [
    { value: 'low', label: 'Low', color: '#10B981', emoji: '🟢' },
    { value: 'medium', label: 'Medium', color: '#F59E0B', emoji: '🟡' },
    { value: 'high', label: 'High', color: '#EF4444', emoji: '🟠' },
    { value: 'urgent', label: 'Urgent', color: '#DC2626', emoji: '🔴' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.priorityContainer}>
        {priorities.map((priority) => (
          <TouchableOpacity
            key={priority.value}
            style={[
              styles.priorityButton,
              value === priority.value && styles.priorityButtonSelected,
              value === priority.value && { borderColor: priority.color },
            ]}
            onPress={() => onChange(priority.value)}
          >
            <Text style={styles.priorityEmoji}>{priority.emoji}</Text>
            <Text
              style={[
                styles.priorityText,
                value === priority.value && styles.priorityTextSelected,
                value === priority.value && { color: priority.color },
              ]}
            >
              {priority.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 4,
  },
  priorityButtonSelected: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  priorityEmoji: {
    fontSize: 16,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  priorityTextSelected: {
    fontWeight: '600',
  },
});