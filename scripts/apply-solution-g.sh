#!/bin/bash

# Solution G: Remove WatermelonDB
# This script comments out WatermelonDB imports and uses mock storage
# to eliminate the AsyncStorage dependency chain

echo "=== Applying Solution G: Remove WatermelonDB ==="

# Function to comment out imports in JavaScript/TypeScript files
comment_out_watermelondb() {
    local file="$1"
    if [ -f "$file" ]; then
        # Backup the file
        cp "$file" "${file}.backup"
        
        # Comment out WatermelonDB imports
        sed -i "s/^import.*from.*watermelondb/\/\/ &/g" "$file"
        sed -i "s/^import.*from.*@nozbe\/watermelondb/\/\/ &/g" "$file"
        sed -i "s/^const.*require.*watermelondb/\/\/ &/g" "$file"
        sed -i "s/^const.*require.*@nozbe\/watermelondb/\/\/ &/g" "$file"
        
        echo "✓ Commented out WatermelonDB imports in $file"
    fi
}

# Find and process all JavaScript/TypeScript files
echo "Finding files with WatermelonDB imports..."
FILES_WITH_WATERMELON=$(grep -r "watermelondb" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | grep -v ".backup" | cut -d: -f1 | sort -u)

if [ -z "$FILES_WITH_WATERMELON" ]; then
    echo "No WatermelonDB imports found in source files."
else
    echo "Found WatermelonDB imports in:"
    echo "$FILES_WITH_WATERMELON"
    echo ""
    
    # Process each file
    while IFS= read -r file; do
        comment_out_watermelondb "$file"
    done <<< "$FILES_WITH_WATERMELON"
fi

# Create mock storage implementation
echo ""
echo "Creating mock storage implementation..."
mkdir -p src/storage

cat > src/storage/mockStorage.js << 'EOF'
// Mock storage implementation to replace WatermelonDB
class MockStorage {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    return this.data.get(key) || null;
  }

  async set(key, value) {
    this.data.set(key, value);
    return true;
  }

  async remove(key) {
    return this.data.delete(key);
  }

  async clear() {
    this.data.clear();
    return true;
  }

  async getAll() {
    return Array.from(this.data.entries());
  }

  // WatermelonDB-like interface
  async find(id) {
    return this.get(id);
  }

  async query() {
    return Array.from(this.data.values());
  }

  async create(data) {
    const id = Date.now().toString();
    const record = { id, ...data };
    await this.set(id, record);
    return record;
  }

  async update(id, data) {
    const existing = await this.get(id);
    if (existing) {
      const updated = { ...existing, ...data };
      await this.set(id, updated);
      return updated;
    }
    return null;
  }

  async delete(id) {
    return this.remove(id);
  }
}

// Create collections
class MockCollection {
  constructor(name) {
    this.name = name;
    this.storage = new MockStorage();
  }

  async find(id) {
    return this.storage.find(id);
  }

  async query() {
    return this.storage.query();
  }

  async create(data) {
    return this.storage.create(data);
  }

  async update(id, data) {
    return this.storage.update(id, data);
  }

  async delete(id) {
    return this.storage.delete(id);
  }
}

// Mock database
class MockDatabase {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection(name));
    }
    return this.collections.get(name);
  }

  async reset() {
    this.collections.clear();
  }
}

// Export mock implementations
export const Database = MockDatabase;
export const Collection = MockCollection;
export const Storage = MockStorage;

// Default export for easy replacement
export default {
  Database: MockDatabase,
  Collection: MockCollection,
  Storage: MockStorage,
  // Mock decorators
  action: (fn) => fn,
  field: (name) => name,
  children: (name) => name,
  relation: (name, relation) => ({ name, relation }),
  // Mock adapters
  SQLiteAdapter: class {
    constructor() {}
  },
  // Mock schemas
  appSchema: (config) => config,
  tableSchema: (config) => config,
};
EOF

# Create TypeScript definitions
cat > src/storage/mockStorage.d.ts << 'EOF'
// TypeScript definitions for mock storage

export interface MockRecord {
  id: string;
  [key: string]: any;
}

export class MockStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<boolean>;
  remove(key: string): Promise<boolean>;
  clear(): Promise<boolean>;
  getAll(): Promise<[string, any][]>;
  find(id: string): Promise<MockRecord | null>;
  query(): Promise<MockRecord[]>;
  create(data: Omit<MockRecord, 'id'>): Promise<MockRecord>;
  update(id: string, data: Partial<MockRecord>): Promise<MockRecord | null>;
  delete(id: string): Promise<boolean>;
}

export class MockCollection {
  name: string;
  find(id: string): Promise<MockRecord | null>;
  query(): Promise<MockRecord[]>;
  create(data: Omit<MockRecord, 'id'>): Promise<MockRecord>;
  update(id: string, data: Partial<MockRecord>): Promise<MockRecord | null>;
  delete(id: string): Promise<boolean>;
}

export class MockDatabase {
  collection(name: string): MockCollection;
  reset(): Promise<void>;
}

export const Database: typeof MockDatabase;
export const Collection: typeof MockCollection;
export const Storage: typeof MockStorage;

declare const _default: {
  Database: typeof MockDatabase;
  Collection: typeof MockCollection;
  Storage: typeof MockStorage;
  action: (fn: Function) => Function;
  field: (name: string) => string;
  children: (name: string) => string;
  relation: (name: string, relation: string) => object;
  SQLiteAdapter: new() => any;
  appSchema: (config: any) => any;
  tableSchema: (config: any) => any;
};

export default _default;
EOF

# Update package.json to remove WatermelonDB
echo ""
echo "Updating package.json..."
if [ -f "package.json" ]; then
    cp package.json package.json.backup
    
    # Remove WatermelonDB dependencies using Node.js
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Remove from dependencies
    delete pkg.dependencies['@nozbe/watermelondb'];
    delete pkg.dependencies['@nozbe/with-observables'];
    
    // Remove from devDependencies
    if (pkg.devDependencies) {
        delete pkg.devDependencies['@nozbe/watermelondb'];
        delete pkg.devDependencies['@nozbe/with-observables'];
    }
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log('✓ Removed WatermelonDB from package.json');
    "
fi

# Create migration guide
echo ""
echo "Creating migration guide..."
cat > WATERMELONDB_MIGRATION.md << 'EOF'
# WatermelonDB Migration Guide

This project has been migrated from WatermelonDB to a mock storage implementation.

## Changes Made

1. **Commented out all WatermelonDB imports**
   - All imports from `@nozbe/watermelondb` have been commented out
   - Original files are backed up with `.backup` extension

2. **Created mock storage implementation**
   - Location: `src/storage/mockStorage.js`
   - Provides similar API to WatermelonDB
   - Data is stored in memory (not persistent)

3. **Removed WatermelonDB from dependencies**
   - Removed `@nozbe/watermelondb` from package.json
   - Removed `@nozbe/with-observables` from package.json

## Migration Steps for Your Code

1. Replace WatermelonDB imports:
   ```javascript
   // Before:
   import { Database } from '@nozbe/watermelondb';
   
   // After:
   import { Database } from './src/storage/mockStorage';
   ```

2. The mock storage provides these compatible methods:
   - `collection.find(id)`
   - `collection.query()`
   - `collection.create(data)`
   - `collection.update(id, data)`
   - `collection.delete(id)`

3. Note: Data is not persistent and will be lost on app restart.
   To add persistence, you can modify `mockStorage.js` to use:
   - AsyncStorage (if you resolve the dependency issue)
   - MMKV
   - SQLite directly
   - File system storage

## Reverting Changes

To revert back to WatermelonDB:
1. Restore backup files: `mv file.backup file`
2. Restore package.json: `mv package.json.backup package.json`
3. Run `npm install`
EOF

echo "✓ Created migration guide: WATERMELONDB_MIGRATION.md"

echo ""
echo "✓ Solution G applied successfully!"
echo ""
echo "Changes made:"
echo "1. Commented out all WatermelonDB imports"
echo "2. Created mock storage implementation in src/storage/mockStorage.js"
echo "3. Removed WatermelonDB from package.json"
echo "4. Created migration guide"
echo ""
echo "Next steps:"
echo "1. Update your code to use the mock storage:"
echo "   import { Database } from './src/storage/mockStorage';"
echo "2. Run: npm install"
echo "3. Clean and rebuild: cd android && ./gradlew clean"
echo "4. Run the app: npm run android"
echo ""
echo "Note: The mock storage is in-memory only. For persistent storage,"
echo "you'll need to implement a proper storage solution."