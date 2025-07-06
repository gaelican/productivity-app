// Test script to diagnose routine expansion issues
const { getDatabase } = require('./src/services/database');
const { routineRepository } = require('./src/services/database/repositories/RoutineRepository');

async function testRoutineExpansion() {
  console.log('=== Testing Routine Expansion ===');
  
  try {
    // Initialize database
    const db = await getDatabase();
    console.log('✓ Database initialized');
    
    // Get all routines
    const routines = await routineRepository.getUserRoutines('user1');
    console.log(`\n✓ Found ${routines.length} routines`);
    
    for (const routine of routines) {
      console.log(`\nRoutine: ${routine.name} (${routine.id})`);
      console.log(`  Color: ${routine.color}`);
      console.log(`  Schedule: ${routine.scheduleType}`);
      console.log(`  Streak: ${routine.currentStreak}`);
      console.log(`  Completions: ${routine.totalCompletions}`);
      
      // Check task dependencies
      console.log(`  Task Dependencies: ${JSON.stringify(routine.taskDependencies || [])}`);
      
      // Try to fetch tasks
      try {
        const tasks = await routine.tasks.fetch();
        console.log(`  Tasks: ${tasks.length}`);
        
        for (const task of tasks) {
          console.log(`    - ${task.name} (${task.id})`);
          console.log(`      Tags: ${JSON.stringify(task.tags || [])}`);
          console.log(`      Completed: ${task.isCompleted}`);
        }
      } catch (taskError) {
        console.error(`  ❌ Error fetching tasks: ${taskError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testRoutineExpansion().then(() => {
  console.log('\n=== Test Complete ===');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});