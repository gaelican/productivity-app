import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainTabScreenProps } from '../navigation/types';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useOfflineFirst } from '../hooks/useOfflineFirst';
import { useDeviceTier } from '../hooks/useDeviceTier';

// Types
interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currentStreak: number;
  recentActivity?: string;
  lastActiveAt: Date;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currentStreak: number;
  longestStreak: number;
  totalGoals: number;
  completedGoals: number;
}

// Menu item component
const MenuItem = ({
  icon,
  label,
  onPress,
  showChevron = true,
  danger = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
}) => {
  const theme = useTheme();
  
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemIcon}>{icon}</Text>
        <Text
          style={[
            styles.menuItemLabel,
            { color: danger ? theme.colors.error : theme.colors.text },
          ]}
        >
          {label}
        </Text>
      </View>
      {showChevron && (
        <Text style={[styles.chevron, { color: theme.colors.textMuted }]}>›</Text>
      )}
    </TouchableOpacity>
  );
};

export default function ProfileScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const theme = useTheme();
  const deviceTier = useDeviceTier();
  const { user, logout } = useAuth();
  const { data: friends, loading: friendsLoading } = useOfflineFirst<Friend[]>('friends');

  // Handle logout
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  }, [logout]);

  // Handle navigation to settings
  const navigateToSettings = useCallback((screen: keyof RootStackParamList) => {
    navigation.navigate(screen as any);
  }, [navigation]);

  // Get profile initials for avatar placeholder
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.colors.card }]}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>{getInitials(user?.name || 'U')}</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {user?.name || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textMuted }]}>
            {user?.email || 'user@example.com'}
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {user?.currentStreak || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                day streak
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {user?.totalGoals || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                goals
              </Text>
            </View>
          </View>
        </View>

        {/* Friends Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              👥 Friends ({friends?.length || 0})
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddFriend' as any)}>
              <Text style={[styles.addButton, { color: theme.colors.primary }]}>
                Add +
              </Text>
            </TouchableOpacity>
          </View>

          {friends && friends.length > 0 ? (
            <>
              {friends.slice(0, 3).map((friend) => (
                <TouchableOpacity
                  key={friend.id}
                  style={styles.friendItem}
                  onPress={() => navigation.navigate('FriendProfile' as any, { friendId: friend.id })}
                >
                  <View style={styles.friendInfo}>
                    {friend.avatar ? (
                      <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
                    ) : (
                      <View style={[styles.friendAvatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
                        <Text style={styles.friendAvatarText}>
                          {getInitials(friend.name)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.friendDetails}>
                      <Text style={[styles.friendName, { color: theme.colors.text }]}>
                        {friend.name}
                      </Text>
                      <Text style={[styles.friendActivity, { color: theme.colors.textMuted }]}>
                        {friend.currentStreak > 0
                          ? `🔥 ${friend.currentStreak} days`
                          : friend.recentActivity || 'No recent activity'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              
              {friends.length > 3 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                    View All Friends
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyFriends}>
              <Text style={[styles.emptyFriendsText, { color: theme.colors.textMuted }]}>
                No friends added yet
              </Text>
              <TouchableOpacity
                style={[styles.addFriendButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('AddFriend' as any)}
              >
                <Text style={styles.addFriendButtonText}>Add Friends</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Settings Menu */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <MenuItem
            icon="⚙️"
            label="Settings"
            onPress={() => navigateToSettings('Settings')}
          />
          <MenuItem
            icon="🔔"
            label="Notifications"
            onPress={() => navigateToSettings('NotificationSettings')}
          />
          <MenuItem
            icon="🎨"
            label="Theme & Display"
            onPress={() => navigateToSettings('ThemeSettings')}
          />
          <MenuItem
            icon="🔐"
            label="Privacy"
            onPress={() => navigateToSettings('PrivacySettings')}
          />
          <MenuItem
            icon="📊"
            label="Data & Backup"
            onPress={() => navigateToSettings('DataBackup')}
          />
          <MenuItem
            icon="❓"
            label="Help & Support"
            onPress={() => navigateToSettings('HelpSupport')}
          />
          <MenuItem
            icon="🚪"
            label="Sign Out"
            onPress={handleLogout}
            showChevron={false}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  friendItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendActivity: {
    fontSize: 12,
  },
  viewAllButton: {
    padding: 16,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyFriends: {
    padding: 24,
    alignItems: 'center',
  },
  emptyFriendsText: {
    fontSize: 14,
    marginBottom: 16,
  },
  addFriendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addFriendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuItemLabel: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
  },
});