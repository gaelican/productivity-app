import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { goalRepository } from '../../services/database/repositories/GoalRepository';
import Goal from '../../services/database/models/Goal';

// Default user ID - In a real app, this would come from auth context
const DEFAULT_USER_ID = 'user1';

interface GoalSelectorProps {
  value?: string;
  onChange: (goalId?: string) => void;
  label?: string;
}

export const GoalSelector: React.FC<GoalSelectorProps> = ({
  value,
  onChange,
  label = 'Link to Goal',
}) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const activeGoals = await goalRepository.getUserGoals(DEFAULT_USER_ID);
      setGoals(activeGoals.filter(g => g.status === 'active'));
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedGoal = goals.find(g => g.id === value);

  const handleSelect = (goalId?: string) => {
    onChange(goalId);
    setExpanded(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.selectorContent}>
          {selectedGoal ? (
            <>
              <Text style={styles.selectedIcon}>{selectedGoal.icon || '🎯'}</Text>
              <Text style={styles.selectedText}>{selectedGoal.name}</Text>
            </>
          ) : (
            <Text style={styles.placeholderText}>No goal selected</Text>
          )}
        </View>
        <Text style={styles.arrow}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.dropdown}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
            </View>
          ) : (
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {/* No Goal Option */}
              <TouchableOpacity
                style={[
                  styles.option,
                  !value && styles.optionSelected,
                ]}
                onPress={() => handleSelect(undefined)}
              >
                <Text style={styles.optionIcon}>❌</Text>
                <Text style={[styles.optionText, !value && styles.optionTextSelected]}>
                  No goal
                </Text>
              </TouchableOpacity>

              {/* Goal Options */}
              {goals.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.option,
                    value === goal.id && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(goal.id)}
                >
                  <Text style={styles.optionIcon}>{goal.icon || '🎯'}</Text>
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionText,
                      value === goal.id && styles.optionTextSelected,
                    ]}>
                      {goal.name}
                    </Text>
                    <Text style={styles.optionCategory}>{goal.category}</Text>
                  </View>
                  {goal.currentValue !== undefined && goal.targetValue !== undefined && (
                    <View style={styles.progressBadge}>
                      <Text style={styles.progressText}>
                        {Math.round((goal.currentValue / goal.targetValue) * 100)}%
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  selectedText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  arrow: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  optionsList: {
    maxHeight: 200,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionSelected: {
    backgroundColor: '#F0F9FF',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    color: '#1E293B',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  optionCategory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
});