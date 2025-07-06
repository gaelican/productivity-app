import { device, element, by, expect as e2eExpect } from 'detox';

/**
 * End-to-End Test Suite for Task Creation and Editing Workflows
 * 
 * Prerequisites:
 * - Detox configured and initialized
 * - Test user account created
 * - App built for testing
 * 
 * Run with: detox test e2e/TaskWorkflow.e2e.test.ts
 */

describe('Task Creation and Editing E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        notifications: 'YES',
      },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Task Creation Flow', () => {
    it('should create a task using natural language input', async () => {
      // Navigate to task creation
      await element(by.id('create-task-button')).tap();
      
      // Verify natural language mode is active by default
      await e2eExpect(element(by.text('✨ Natural Language'))).toHaveAttribute('selected', 'true');
      
      // Enter natural language input
      await element(by.id('natural-language-input')).typeText(
        'Call dentist tomorrow at 2pm high priority #health'
      );
      
      // Wait for parsing preview
      await waitFor(element(by.text('Call dentist')))
        .toBeVisible()
        .withTimeout(2000);
      
      // Verify parsed elements
      await e2eExpect(element(by.text('Priority: high'))).toBeVisible();
      await e2eExpect(element(by.text('Tags: health'))).toBeVisible();
      
      // Create the task
      await element(by.text('Create')).tap();
      
      // Verify navigation back to task list
      await waitFor(element(by.id('task-list')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Verify new task appears in list
      await e2eExpect(element(by.text('Call dentist'))).toBeVisible();
    });

    it('should create a task using form mode with all fields', async () => {
      // Navigate to task creation
      await element(by.id('create-task-button')).tap();
      
      // Switch to form mode
      await element(by.text('📝 Form')).tap();
      
      // Fill in task details
      await element(by.id('task-name-input')).typeText('Complete quarterly report');
      await element(by.id('task-description-input')).typeText(
        'Prepare and submit Q4 financial report with analysis'
      );
      
      // Select icon
      await element(by.id('icon-picker')).tap();
      await element(by.text('📊')).tap();
      
      // Select priority
      await element(by.text('High')).tap();
      
      // Set due date (platform specific)
      await element(by.id('due-date-picker')).tap();
      if (device.getPlatform() === 'ios') {
        await element(by.type('UIPickerView')).setColumnToValue(0, 'December');
        await element(by.type('UIPickerView')).setColumnToValue(1, '31');
        await element(by.text('Done')).tap();
      } else {
        await element(by.text('OK')).tap();
      }
      
      // Add tags
      await element(by.id('tag-input')).typeText('work');
      await element(by.text('Add')).tap();
      await element(by.id('tag-input')).typeText('finance');
      await element(by.text('Add')).tap();
      
      // Select goal
      await element(by.id('goal-selector')).tap();
      await element(by.text('Q4 Goals')).tap();
      
      // Select color theme
      await element(by.id('color-theme-selector')).tap();
      await element(by.text('Sunset')).tap();
      
      // Create task
      await element(by.text('Create')).tap();
      
      // Verify task created
      await waitFor(element(by.text('Complete quarterly report')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should validate required fields', async () => {
      // Navigate to task creation
      await element(by.id('create-task-button')).tap();
      
      // Switch to form mode
      await element(by.text('📝 Form')).tap();
      
      // Try to create without filling required fields
      await element(by.text('Create')).tap();
      
      // Verify error message
      await e2eExpect(element(by.text('Task name is required'))).toBeVisible();
      
      // Fill task name
      await element(by.id('task-name-input')).typeText('Valid task name');
      
      // Try to create again
      await element(by.text('Create')).tap();
      
      // Should succeed now
      await waitFor(element(by.id('task-list')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Task Editing Flow', () => {
    // Helper to create a task for editing tests
    const createTestTask = async () => {
      await element(by.id('create-task-button')).tap();
      await element(by.text('📝 Form')).tap();
      await element(by.id('task-name-input')).typeText('Task to edit');
      await element(by.id('task-description-input')).typeText('Original description');
      await element(by.text('Medium')).tap();
      await element(by.text('Create')).tap();
      await waitFor(element(by.id('task-list'))).toBeVisible().withTimeout(3000);
    };

    it('should edit an existing task', async () => {
      // Create a task first
      await createTestTask();
      
      // Open the task for editing
      await element(by.text('Task to edit')).tap();
      
      // Wait for edit screen to load
      await waitFor(element(by.text('Edit Task')))
        .toBeVisible()
        .withTimeout(2000);
      
      // Verify existing data is loaded
      await e2eExpect(element(by.id('task-name-input'))).toHaveText('Task to edit');
      await e2eExpect(element(by.id('task-description-input'))).toHaveText('Original description');
      
      // Make changes
      await element(by.id('task-name-input')).clearText();
      await element(by.id('task-name-input')).typeText('Updated task name');
      
      await element(by.id('task-description-input')).clearText();
      await element(by.id('task-description-input')).typeText('Updated description');
      
      // Change priority
      await element(by.text('High')).tap();
      
      // Update progress
      await element(by.text('50%')).tap();
      
      // Save changes
      await element(by.text('Save Changes')).tap();
      
      // Verify success message
      await waitFor(element(by.text('Task updated successfully')))
        .toBeVisible()
        .withTimeout(2000);
      
      // Dismiss alert
      await element(by.text('OK')).tap();
      
      // Verify changes reflected in list
      await e2eExpect(element(by.text('Updated task name'))).toBeVisible();
    });

    it('should mark task as complete', async () => {
      // Create a task first
      await createTestTask();
      
      // Open the task
      await element(by.text('Task to edit')).tap();
      
      // Mark as complete
      await element(by.text('○ Mark as Complete')).tap();
      
      // Verify status changed
      await waitFor(element(by.text('✓ Completed')))
        .toBeVisible()
        .withTimeout(2000);
      
      // Verify success message
      await e2eExpect(element(by.text('Task marked as complete'))).toBeVisible();
      await element(by.text('OK')).tap();
      
      // Go back to list
      await element(by.text('Back')).tap();
      
      // Verify task shows as completed in list (visual indicator)
      await e2eExpect(element(by.id('task-item-Task to edit'))).toHaveAttribute('completed', 'true');
    });

    it('should delete a task with confirmation', async () => {
      // Create a task first
      await createTestTask();
      
      // Open the task
      await element(by.text('Task to edit')).tap();
      
      // Tap delete
      await element(by.text('Delete')).tap();
      
      // Verify confirmation dialog
      await e2eExpect(element(by.text('Are you sure you want to delete this task?'))).toBeVisible();
      
      // Cancel first
      await element(by.text('Cancel')).tap();
      
      // Task should still be there
      await e2eExpect(element(by.text('Edit Task'))).toBeVisible();
      
      // Delete again and confirm
      await element(by.text('Delete')).tap();
      await element(by.label('Delete').and(by.type('_UIAlertControllerActionView'))).tap();
      
      // Verify success message
      await waitFor(element(by.text('Task deleted successfully')))
        .toBeVisible()
        .withTimeout(2000);
      
      await element(by.text('OK')).tap();
      
      // Verify task is gone from list
      await e2eExpect(element(by.text('Task to edit'))).toNotExist();
    });
  });

  describe('Advanced Workflows', () => {
    it('should handle mode switching without data loss', async () => {
      // Navigate to task creation
      await element(by.id('create-task-button')).tap();
      
      // Start in form mode
      await element(by.text('📝 Form')).tap();
      
      // Enter some data
      await element(by.id('task-name-input')).typeText('Persistent task data');
      await element(by.text('High')).tap();
      
      // Switch to natural language mode
      await element(by.text('✨ Natural Language')).tap();
      
      // Switch back to form mode
      await element(by.text('📝 Form')).tap();
      
      // Verify data is still there
      await e2eExpect(element(by.id('task-name-input'))).toHaveText('Persistent task data');
      await e2eExpect(element(by.text('High'))).toHaveAttribute('selected', 'true');
    });

    it('should handle offline task creation', async () => {
      // Enable airplane mode
      await device.setURLBlacklist(['.*']);
      
      // Create a task
      await element(by.id('create-task-button')).tap();
      await element(by.text('📝 Form')).tap();
      await element(by.id('task-name-input')).typeText('Offline task');
      await element(by.text('Create')).tap();
      
      // Should either queue or show appropriate message
      // This depends on implementation
      
      // Disable airplane mode
      await device.clearURLBlacklist();
      
      // Verify task eventually appears
      await waitFor(element(by.text('Offline task')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should handle rapid task creation', async () => {
      // Create multiple tasks quickly
      for (let i = 1; i <= 5; i++) {
        await element(by.id('create-task-button')).tap();
        await element(by.id('natural-language-input')).typeText(`Quick task ${i}`);
        await element(by.text('Create')).tap();
        
        // Wait for list to be visible
        await waitFor(element(by.id('task-list')))
          .toBeVisible()
          .withTimeout(1000);
      }
      
      // Verify all tasks were created
      for (let i = 1; i <= 5; i++) {
        await e2eExpect(element(by.text(`Quick task ${i}`))).toBeVisible();
      }
    });
  });

  describe('Performance Tests', () => {
    it('should load edit screen quickly', async () => {
      // Create a task with lots of data
      await element(by.id('create-task-button')).tap();
      await element(by.text('📝 Form')).tap();
      
      const longDescription = 'This is a very long description. '.repeat(20);
      await element(by.id('task-name-input')).typeText('Performance test task');
      await element(by.id('task-description-input')).typeText(longDescription);
      
      // Add multiple tags
      for (let i = 1; i <= 5; i++) {
        await element(by.id('tag-input')).typeText(`tag${i}`);
        await element(by.text('Add')).tap();
      }
      
      await element(by.text('Create')).tap();
      await waitFor(element(by.id('task-list'))).toBeVisible().withTimeout(3000);
      
      // Measure time to open edit screen
      const startTime = Date.now();
      await element(by.text('Performance test task')).tap();
      
      await waitFor(element(by.text('Edit Task')))
        .toBeVisible()
        .withTimeout(1000);
      
      const loadTime = Date.now() - startTime;
      
      // Should load in less than 1 second
      if (loadTime > 1000) {
        throw new Error(`Edit screen took ${loadTime}ms to load (expected < 1000ms)`);
      }
    });
  });

  describe('Error Recovery', () => {
    it('should recover from save failures', async () => {
      // Create a task to edit
      await element(by.id('create-task-button')).tap();
      await element(by.id('natural-language-input')).typeText('Task for error test');
      await element(by.text('Create')).tap();
      await waitFor(element(by.id('task-list'))).toBeVisible().withTimeout(3000);
      
      // Open for editing
      await element(by.text('Task for error test')).tap();
      
      // Make changes
      await element(by.id('task-name-input')).clearText();
      await element(by.id('task-name-input')).typeText('Updated with error');
      
      // Simulate network failure
      await device.setURLBlacklist(['.*']);
      
      // Try to save
      await element(by.text('Save Changes')).tap();
      
      // Should show error
      await waitFor(element(by.text('Failed to save changes')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.text('OK')).tap();
      
      // Re-enable network
      await device.clearURLBlacklist();
      
      // Retry save
      await element(by.text('Save Changes')).tap();
      
      // Should succeed now
      await waitFor(element(by.text('Task updated successfully')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });
});

// Helper function for platform-specific waits
async function waitFor(element: any) {
  return device.getPlatform() === 'ios' 
    ? element.atIndex(0) 
    : element;
}