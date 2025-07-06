import { Platform } from 'react-native';
import { schema } from './schema';

// This file is deprecated - adapter creation has been moved to index.ts
// to properly handle platform-specific imports

// Export a placeholder that will be replaced by the actual adapter
export const adapter = null as any;

console.warn('adapter.ts is deprecated. Use getDatabase() from index.ts instead.');