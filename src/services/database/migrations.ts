import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

// Define database migrations
// Currently empty as we're on version 1
const migrations = schemaMigrations({
  migrations: [
    // Future migrations will go here
    // {
    //   toVersion: 2,
    //   steps: [
    //     // Migration steps
    //   ],
    // },
  ],
});

export default migrations;