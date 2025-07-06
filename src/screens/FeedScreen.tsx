import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../hooks/useTheme';
import { useOfflineFirst } from '../hooks/useOfflineFirst';
import { useDeviceTier } from '../hooks/useDeviceTier';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

// Types
interface CompletedTask {
  id: string;
  name: string;
  description?: string;
  completedAt: Date;
  completedBy: string;
  notes?: string;
  collaboratorNotes: Array<{
    id: string;
    authorId: string;
    authorName: string;
    text: string;
    createdAt: Date;
  }>;
  colorTheme: string;
  icon: string;
  sharedWith: string[];
}

interface DateGroup {
  date: Date;
  label: string;
  tasks: CompletedTask[];
}

export default function FeedScreen({ navigation }: MainTabScreenProps<'Feed'>) {
  const theme = useTheme();
  const deviceTier = useDeviceTier();
  const { data: completedTasks, loading, error, refresh } = useOfflineFirst<CompletedTask[]>('completed_tasks');
  
  const [refreshing, setRefreshing] = useState(false);
  const [addingNoteFor, setAddingNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    if (!completedTasks) return [];

    const groups: DateGroup[] = [];
    const tasksByDate = new Map<string, CompletedTask[]>();

    // Sort tasks by completion date (newest first)
    const sortedTasks = [...completedTasks].sort(
      (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
    );

    // Group by date
    sortedTasks.forEach(task => {
      const dateKey = format(task.completedAt, 'yyyy-MM-dd');
      if (!tasksByDate.has(dateKey)) {
        tasksByDate.set(dateKey, []);
      }
      tasksByDate.get(dateKey)!.push(task);
    });

    // Create date groups with labels
    tasksByDate.forEach((tasks, dateKey) => {
      const date = new Date(dateKey);
      let label: string;

      if (isToday(date)) {
        label = 'Today';
      } else if (isYesterday(date)) {
        label = 'Yesterday';
      } else {
        label = format(date, 'EEEE, MMMM d');
      }

      groups.push({ date, label, tasks });
    });

    return groups;
  }, [completedTasks]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Handle add note
  const handleAddNote = useCallback(async (taskId: string) => {
    if (!noteText.trim()) return;

    // Add note logic here - would update the task with new note
    console.log('Adding note to task:', taskId, noteText);

    // Reset state
    setNoteText('');
    setAddingNoteFor(null);
  }, [noteText]);

  // Format time
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Completed Tasks
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {groupedTasks.map((group) => (
            <View key={group.date.toISOString()} style={styles.dateGroup}>
              <Text style={[styles.dateHeader, { color: theme.colors.textMuted }]}>
                {group.label}
              </Text>

              {group.tasks.map((task) => (
                <View
                  key={task.id}
                  style={[
                    styles.taskCard,
                    {
                      backgroundColor: theme.colors.card,
                      shadowOpacity: deviceTier !== 'basic' ? 0.1 : 0,
                    },
                  ]}
                >
                  {/* Task Header */}
                  <View style={styles.taskHeader}>
                    <View style={styles.taskInfo}>
                      <View style={[styles.checkmark, { backgroundColor: task.colorTheme }]}>
                        <Text style={styles.checkmarkIcon}>✓</Text>
                      </View>
                      <View style={styles.taskDetails}>
                        <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
                          {task.name}
                        </Text>
                        <Text style={[styles.taskTime, { color: theme.colors.textMuted }]}>
                          {formatTime(task.completedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Task Description */}
                  {task.description && (
                    <Text style={[styles.taskDescription, { color: theme.colors.textSecondary }]}>
                      {task.description}
                    </Text>
                  )}

                  {/* Notes Section */}
                  <View style={styles.notesSection}>
                    {/* User's completion note */}
                    {task.notes && (
                      <View style={styles.note}>
                        <Text style={[styles.noteText, { color: theme.colors.text }]}>
                          💬 "{task.notes}"
                        </Text>
                      </View>
                    )}

                    {/* Collaborator notes */}
                    {task.collaboratorNotes.map((note) => (
                      <View key={note.id} style={styles.note}>
                        <Text style={[styles.noteAuthor, { color: theme.colors.primary }]}>
                          {note.authorName}:
                        </Text>
                        <Text style={[styles.noteText, { color: theme.colors.text }]}>
                          {note.text}
                        </Text>
                      </View>
                    ))}

                    {/* Add note input */}
                    {addingNoteFor === task.id ? (
                      <View style={styles.addNoteContainer}>
                        <TextInput
                          style={[
                            styles.noteInput,
                            {
                              color: theme.colors.text,
                              backgroundColor: theme.colors.inputBackground,
                              borderColor: theme.colors.border,
                            },
                          ]}
                          placeholder="Add a note..."
                          placeholderTextColor={theme.colors.textMuted}
                          value={noteText}
                          onChangeText={setNoteText}
                          multiline
                          autoFocus
                        />
                        <View style={styles.noteActions}>
                          <TouchableOpacity
                            onPress={() => {
                              setAddingNoteFor(null);
                              setNoteText('');
                            }}
                          >
                            <Text style={[styles.noteAction, { color: theme.colors.textMuted }]}>
                              Cancel
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleAddNote(task.id)}>
                            <Text style={[styles.noteAction, { color: theme.colors.primary }]}>
                              Add
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addNoteButton}
                        onPress={() => setAddingNoteFor(task.id)}
                      >
                        <Text style={[styles.addNoteButtonText, { color: theme.colors.primary }]}>
                          📝 Add note...
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}

          {/* Empty state */}
          {groupedTasks.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateEmoji, { fontSize: 48 }]}>📋</Text>
              <Text style={[styles.emptyStateText, { color: theme.colors.textMuted }]}>
                No completed tasks yet
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textMuted }]}>
                Complete some tasks to see them here!
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  taskCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmarkIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  taskTime: {
    fontSize: 14,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  notesSection: {
    marginTop: 8,
  },
  note: {
    marginBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  noteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  noteText: {
    fontSize: 14,
    flex: 1,
  },
  addNoteButton: {
    paddingVertical: 8,
  },
  addNoteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addNoteContainer: {
    marginTop: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    marginBottom: 8,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  noteAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyStateEmoji: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
});