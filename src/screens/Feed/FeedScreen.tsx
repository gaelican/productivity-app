import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabScreenProps } from '../../packages/types';

interface FeedScreenProps extends TabScreenProps<'Feed'> {}

interface CompletedTask {
  id: string;
  name: string;
  icon: string;
  completedAt: Date;
  completedBy: string;
  notes?: string;
  collaborators?: string[];
}

// Mock data for completed tasks
const mockCompletedTasks: CompletedTask[] = [
  {
    id: '1',
    name: 'Morning workout routine',
    icon: '🏃',
    completedAt: new Date(Date.now() - 3600000), // 1 hour ago
    completedBy: 'You',
    notes: 'Great session! Hit all my targets',
  },
  {
    id: '2',
    name: 'Team meeting preparation',
    icon: '👥',
    completedAt: new Date(Date.now() - 7200000), // 2 hours ago
    completedBy: 'You',
    collaborators: ['Sarah', 'Mike'],
  },
  {
    id: '3',
    name: 'Grocery shopping',
    icon: '🛒',
    completedAt: new Date(Date.now() - 86400000), // Yesterday
    completedBy: 'You',
  },
  {
    id: '4',
    name: 'Read 30 pages',
    icon: '📚',
    completedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    completedBy: 'You',
    notes: 'Finished chapter 5 of Atomic Habits',
  },
];

export const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupTasksByDate = (tasks: CompletedTask[]) => {
    const groups: Record<string, CompletedTask[]> = {};
    
    tasks.forEach(task => {
      const date = new Date(task.completedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });
    
    return groups;
  };

  const groupedTasks = groupTasksByDate(mockCompletedTasks);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#FEF3C7', '#FDE68A', '#FCD34D']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Activity Feed</Text>
        <Text style={styles.headerSubtitle}>Your completed tasks</Text>
      </View>

      {/* Feed ScrollView */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedTasks).map(([date, tasks]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{date}</Text>
            {tasks.map(task => (
              <TouchableOpacity
                key={task.id}
                style={styles.feedItem}
                activeOpacity={0.95}
                onPress={() => console.log('Task pressed:', task.name)}
              >
                <View style={styles.feedItemContent}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.taskIcon}>{task.icon}</Text>
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskName}>{task.name}</Text>
                    <Text style={styles.taskMeta}>
                      Completed by {task.completedBy} • {formatTimeAgo(task.completedAt)}
                    </Text>
                    {task.notes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notes}>{task.notes}</Text>
                      </View>
                    )}
                    {task.collaborators && task.collaborators.length > 0 && (
                      <View style={styles.collaboratorsContainer}>
                        <Text style={styles.collaboratorsText}>
                          With: {task.collaborators.join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkIcon}>✓</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Empty state */}
        {mockCompletedTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateTitle}>No completed tasks yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Complete some tasks to see them here!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#92400E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#78350F',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  feedItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  feedItemContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskIcon: {
    fontSize: 20,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  taskMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  notesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 6,
  },
  notes: {
    fontSize: 14,
    color: '#78350F',
    fontStyle: 'italic',
  },
  collaboratorsContainer: {
    marginTop: 8,
  },
  collaboratorsText: {
    fontSize: 14,
    color: '#92400E',
  },
  checkmark: {
    width: 24,
    height: 24,
    backgroundColor: '#10B981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#78350F',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#92400E',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});