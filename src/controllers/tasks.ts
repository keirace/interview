import { Task, TaskStatus } from "../models/task";
import { differenceInDays } from "date-fns";
import { Request, Response, NextFunction } from "express";
import { invalidateCache } from "../middleware/cache";

// In-memory storage
export const tasks = new Map<number, Task>();
let nextId = 1;

// Helper function for filtering tasks
const filterTasks = (tasks: Map<number, Task>, filters: any): Task[] => {
	return Array.from(tasks.values()).filter((task: Task) => {
		if (filters.status && task.status !== filters.status) return false;
		if (filters.priority && task.priority !== filters.priority) return false;
		if (filters.dueDateStart && task.dueDate < new Date(filters.dueDateStart)) return false;
		if (filters.dueDateEnd && task.dueDate > new Date(filters.dueDateEnd)) return false;
		if (filters.tags && !filters.tags.some((tag: string) => task.tags.includes(tag))) return false;
		return true;
	});
};

// Helper function for sorting tasks
const sortTasks = (tasks: Task[], sortBy: keyof Task = "createdAt", sortOrder: "asc" | "desc" = "desc"): Task[] => {
	return tasks.sort((a, b) => {
		const multiplier = sortOrder === "desc" ? -1 : 1;
		const aValue = a[sortBy];
		const bValue = b[sortBy];
		if (aValue < bValue) return -1 * multiplier;
		if (aValue > bValue) return 1 * multiplier;
		return 0;
	});
};

// CRUD Operations
export const createTask = async (req: Request, res: Response): Promise<void> => {
	try {
		req.body.id = nextId++;
		const task = new Task({ id: req.body.id, ...req.body });
		task.validate();
		tasks.set(task.id, task);
		res.status(201).json(task); // Created
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const getTasks = async (req: Request, res: Response): Promise<void> => {
	try {
		const { sortBy, sortOrder, page, limit } = req.query as { sortBy?: keyof Task; sortOrder?: "asc" | "desc"; page?: string; limit?: string };
		let filteredTasks: Task[] = filterTasks(tasks, req.query);
		filteredTasks = sortTasks(filteredTasks, sortBy, sortOrder);

		// Pagination
		const pageNo = parseInt(page!) || 1;
		const limitNum = parseInt(limit!) || 10;
		const startIndex = (pageNo - 1) * limitNum;
		const endIndex = pageNo * limitNum;

		const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

		res.json({
			tasks: paginatedTasks,
			pagination: {
				total: filteredTasks.length,
				page,
				pages: Math.ceil(filteredTasks.length / limitNum),
			},
		});
	} catch (error: any) {
		res.status(500).json({ error: error.message }); // Internal Server Error
	}
};

export const getTaskById = async (req: Request, res: Response): Promise<void> => {
	const task = tasks.get(parseInt(req.params.id));
	if (!task) {
		res.status(404).json({ error: "Task not found" });
		return;
	}
	res.json(task);
};

export const getTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	const task = tasks.get(parseInt(req.params.id));
	if (!task) {
		res.status(404).json({ error: "Task not found" });
		return;
	}
	req.task = task; // Attach task to request object for further middleware
	next();
}

export const updateTask = async (req: Request, res: Response): Promise<void> => {
	try {
		const task = tasks.get(parseInt(req.params.id));
		if (!task) {
			res.status(404).json({ error: "Task not found" });
			return;
		}

		// Check status transition
		if (req.body.status && !task.canTransitionTo(req.body.status)) {
			res.status(400).json({ error: "Invalid status transition" });
			return;
		}

		task.update(req.body);
		task.validate();
		res.json(task);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

export const deleteTask = async (req: Request, res: Response) => {
	const taskId = parseInt(req.params.id);
	if (!tasks.has(taskId)) {
		return res.status(404).json({ error: "Task not found" });
	}

	// Check if task is a dependency for other tasks
	const dependentTasks = Array.from(tasks.values()).filter((task) => task.dependencies.includes(taskId));

	if (dependentTasks.length > 0) {
		return res.status(400).json({
			error: "Task has dependencies",
			message: "Cannot delete task that is a dependency for other tasks",
		});
	}

	tasks.delete(taskId);
	res.status(204).send();
};

// const validateDependencies = (tasks: Task[]): boolean => {}

// Search by title or description
export const searchTasks = async (req: Request, res: Response): Promise<void> => {
	const { query } = req.query as { query?: string };
	if (!query) {
		res.status(400).json({ error: "Search query is required" });
		return;
	}

	const searchResults = Array.from(tasks.values()).filter((task) => task.title.toLowerCase().includes(query.toLowerCase()) || task.description.toLowerCase().includes(query.toLowerCase()));

	res.json(searchResults);
};

// Batch operations
export const batchCreateTasks = async (req: Request, res: Response) => {
	if (!Array.isArray(req.body)) {
		return res.status(400).json({ error: "Request body must be an array" });
	}

	try {
		const createdTasks: Task[] = [];
		for (const taskData of req.body) {
			taskData.id = nextId++;
			const task = new Task({ id: taskData.id, ...taskData });
			task.validate();
			createdTasks.push(task);
		}

		// If all validations pass, save the tasks
		createdTasks.forEach((task) => tasks.set(task.id, task));
		res.status(201).json(createdTasks);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

/**
 * Batch update tasks
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const batchUpdateTasks = async (req: Request, res: Response): Promise<void> => {
	if (!Array.isArray(req.body)) {
		res.status(400).json({ error: "Request body must be an array" });
		return;
	}
	try {
		const updatedTasks: Task[] = [];
		for (const taskData of req.body) {
			const task = tasks.get(taskData.id);
			if (!task) {
				res.status(404).json({ error: `Task with ID ${taskData.id} not found` });
				return;
			}
			const updatedTask = { ...task, ...taskData, updatedAt: new Date() };
			if (taskData.status && !task.canTransitionTo(taskData.status)) {
				res.status(400).json({ error: `Invalid status transition for task ID ${taskData.id}` });
				return;
			}

			task.validate();
			updatedTasks.push(updatedTask);
		}
		// If all validations pass, update the tasks
		updatedTasks.forEach((task) => tasks.set(task.id, task));

		res.json(updatedTasks);
	} catch (error: any) {
		res.status(400).json({ error: error.message });
	}
};

/**
 * Batch delete tasks
 * @param {*} req
 * @param {*} res
 * @returns
 */
export const batchDeleteTasks = async (req: Request, res: Response) => {
	if (!Array.isArray(req.body)) {
		return res.status(400).json({ error: "Request body must be an array of IDs" });
	}

	try {
		const deletedTasks: Task[] = [];
		for (const taskId of req.body) {
			const id = parseInt(taskId);
			if (!tasks.has(id)) {
				return res.status(404).json({ error: `Task with ID ${id} not found` });
			}

			// Check if task is a dependency for other tasks
			const dependentTasks = Array.from(tasks.values()).filter((task) => task.dependencies.includes(id));

			if (dependentTasks.length > 0) {
				return res.status(400).json({
					error: `Task with ID ${id} has dependencies`,
					message: "Cannot delete task that is a dependency for other tasks",
				});
			}

			deletedTasks.push(tasks.get(id)!);
		}
		deletedTasks.forEach((task) => tasks.delete(task.id));

		res.status(204).send(); // No Content
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
};

// Analytics endpoints
export const getCompletionRate = async (req: Request, res: Response) => {
	const allTasks = Array.from(tasks.values());
	const completedTasks = allTasks.filter((task) => task.status === TaskStatus.COMPLETED);

	const completionRate = (completedTasks.length / allTasks.length) * 100;

	res.json({
		total: allTasks.length,
		completed: completedTasks.length,
		completionRate: `${completionRate.toFixed(2)}%`,
	});
};

export const getAverageCompletionTime = async (req: Request, res: Response) => {
	const completedTasks = Array.from(tasks.values()).filter((task) => task.status === TaskStatus.COMPLETED);

	const completionTimes = completedTasks.map((task) => {
		const createdDate = new Date(task.createdAt);
		const completedDate = new Date(task.updatedAt);
		return differenceInDays(completedDate, createdDate);
	});

	const averageTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;

	res.json({
		averageCompletionTime: `${averageTime.toFixed(1)} days`,
		totalTasksCompleted: completedTasks.length,
	});
};

export const getPopularTags = async (req: Request, res: Response) => {
	const tagCount = new Map<string, number>();

	Array.from(tasks.values()).forEach((task) => {
		task.tags.forEach((tag) => {
			tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
		});
	});

	const sortedTags = Array.from(tagCount.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([tag, count]) => ({ tag, count }));

	res.json(sortedTags);
};
