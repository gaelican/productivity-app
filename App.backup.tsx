import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { setupDatabase } from './src/services/database/init';
import { getDatabase } from './src/services/database';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import { useWidgetSync } from './src/services/widget/useWidgetSync';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [database, setDatabase] = useState<Database | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('App: Starting database setup...');
        await setupDatabase();
        const db = getDatabase();
        console.log('App: Database ready');
        setDatabase(db);
        setIsReady(true);
      } catch (e) {
        console.error('App: Failed to prepare app:', e);
      }
    }

    prepare();
  }, []);

  if (!isReady || !database) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <DatabaseProvider database={database}>
        <AppContent />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  // Initialize widget sync
  useWidgetSync();

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});