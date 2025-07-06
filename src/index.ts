import User from './User';
import Task from './Task';
import Routine from './Routine';
import Goal from './Goal';
import SyncQueueItem from './SyncQueueItem';

export { User, Task, Routine, Goal, SyncQueueItem };

// Export all models as an array for database setup
export const models = [User, Task, Routine, Goal, SyncQueueItem];