import express from "express";
import { validateTask, validateStatusTransition } from "../middleware/validation";
import * as taskController from "../controllers/tasks";
import { cacheTasks } from "../middleware/cache";
import { queueMiddleware as queue } from "../middleware/queue";

const router = express.Router();

// Create task
/**
 * @openapi
 * /tasks:
 *   post:
 *     summary: Create task
 *     description: Create a new task.
 *     tags:
 *       - Tasks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           required: true
 *           schema: { $ref: '#/components/schemas/CreateTask' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/", validateTask, taskController.createTask);

// Search tasks
/**
 * @openapi
 * /tasks/search:
 *   get:
 *     summary: Search tasks by title or description
 *     description: Search tasks using a query string that matches the title or description.
 *     tags:
 *       - Tasks
 * 
 *     parameters:
 *       - in: query
 *         name: query
 *         description: search by title or description.
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in-progress, completed, archived] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/search", taskController.searchTasks);

// Get all tasks with filtering, sorting, and pagination
/**
 * @openapi
 * /tasks:
 *  get:
 *    summary: List tasks
 *    description: Retrieve a list of tasks with optional filtering, sorting, and pagination.
 *    tags:
 *      - Tasks
 *    parameters:
 *      - in: query
 *        name: status
 *        schema: { type: string, enum: [pending, in-progress, completed, archived] }
 *      - in: query
 *        name: priority
 *        schema: { type: string, enum: [low, medium, high] }
 *      - in: query
 *        name: page
 *        schema: { type: integer, default: 1 }
 *      - in: query
 *        name: limit
 *        schema: { type: integer, default: 10 }
 *    responses:
 *      200:
 *        description: OK
 */
router.get("/", taskController.getTasks);

// Batch operations
/**
 * @openapi
 * /tasks/batch:
 *   post:
 *     summary: Batch create tasks
 *     description: Create multiple tasks in a single request.
 *     tags:
 *       - Batch Tasks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items: { $ref: '#/components/schemas/CreateTask' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Task' }
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *
 *   put:
 *     summary: Batch update tasks
 *     description: Update multiple tasks in a single request.
 *     tags:
 *       - Batch Tasks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items: { $ref: '#/components/schemas/BatchUpdateTasks' }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Task' }
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *
 *   delete:
 *     summary: Batch delete tasks
 *     description: Delete multiple tasks by their IDs.
 *     tags:
 *       - Batch Tasks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       204:
 *         description: No Content
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Not Found
 */
router.post("/batch", queue, taskController.batchCreateTasks);
router.put("/batch", queue, taskController.batchUpdateTasks);
router.delete("/batch", queue, taskController.batchDeleteTasks);

// Get task by ID
// Cached route
router.get("/:id", cacheTasks, taskController.getTaskById);

// Update task
/**
 * @openapi
 * /tasks/{id}:
 *   put:
 *     summary: Update task
 *     description: Update an existing task by ID.
 *     tags:
 *       - Tasks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateTask' }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put("/:id", validateTask, taskController.getTask, validateStatusTransition, taskController.updateTask);

// Partially update task's status with validation
/**
 * @openapi
 * /tasks/{id}:
 *  patch:
 *    summary: Partially update task's status
 *    description: Partially update an existing task's status by ID.
 *    tags:
 *      - Tasks
 *    parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: string }
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              status:
 *                type: string
 *                enum: [pending, in_progress, completed]
 *    responses:
 *        200:
 *          description: OK
 *          content:
 *            application/json:
 *              schema: { $ref: '#/components/schemas/Task' }
 *        400:
 *          description: Bad Request
 *          content:
 *            application/json:
 *              schema: { $ref: '#/components/schemas/Error' }
 *        404:
 *          description: Not Found
 */
router.patch("/:id", taskController.getTask, validateStatusTransition, taskController.updateTask);

// Delete task
/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     description: Delete an existing task by ID.
 *     tags:
 *       - Tasks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: No Content
 *       404:
 *         description: Not Found
 */
router.delete("/:id", taskController.deleteTask);

// Analytics endpoints
/**
 * @openapi
 * /tasks/analytics/completion-rate:
 *   get:
 *     summary: Get task completion rate
 *     description: Retrieve the percentage of tasks that have been completed.
 *     tags:
 *       - Tasks
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { total: { type: number }, completed: { type: number }, completionRate: { type: string } } }
 */
router.get("/analytics/completion-rate", taskController.getCompletionRate);

/**
 * @openapi
 * /tasks/analytics/average-completion-time:
 *   get:
 *     summary: Get average task completion time
 *     description: Retrieve the average time taken to complete tasks.
 *     tags:
 *       - Tasks
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { averageCompletionTime: { type: string }, totalTasksCompleted: { type: number } } }
 */
router.get("/analytics/average-completion-time", taskController.getAverageCompletionTime);

/**
 * @openapi
 * /tasks/analytics/popular-tags:
 *   get:
 *     summary: Get popular task tags
 *     description: Retrieve the most frequently used tags for tasks.
 *     tags:
 *       - Tasks
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: array, items: { type: object, properties: { tag: { type: string }, count: { type: number } } } }
 */
router.get("/analytics/popular-tags", taskController.getPopularTags);

export default router;