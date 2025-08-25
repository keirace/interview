import express from "express";
import { validateTask, validateStatusTransition } from '../middleware/validation';
import * as taskController from '../controllers/tasks';
import { cacheTasks } from "../middleware/cache";

const router = express.Router();

// Create task
router.post('/', validateTask, taskController.createTask);

// Search tasks
router.get('/search', taskController.searchTasks);

// Get all tasks with filtering, sorting, and pagination
router.get('/', taskController.getTasks);

// Batch operations
router.post('/batch', taskController.batchCreateTasks);
router.put('/batch', taskController.batchUpdateTasks);
router.delete('/batch', taskController.batchDeleteTasks);

// Get task by ID
// Cached route
router.get('/:id', cacheTasks, taskController.getTaskById);

// Update task
router.put('/:id', validateTask, taskController.updateTask);

// Partially update task
router.patch('/:id', taskController.updateTask);

// Delete task
router.delete('/:id', taskController.deleteTask);

// Analytics endpoints
router.get('/analytics/completion-rate', taskController.getCompletionRate);
router.get('/analytics/average-completion-time', taskController.getAverageCompletionTime);
router.get('/analytics/popular-tags', taskController.getPopularTags);

export default router;