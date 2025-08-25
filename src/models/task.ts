import { isAfter } from "date-fns";

// Task statuses and priorities as enums
enum TaskStatus {
	PENDING = "pending",
	IN_PROGRESS = "in-progress",
	COMPLETED = "completed",
	ARCHIVED = "archived",
}

enum TaskPriority {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
}

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
	[TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS],
	[TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED],
	[TaskStatus.COMPLETED]: [TaskStatus.ARCHIVED],
	[TaskStatus.ARCHIVED]: [],
};

class Task {
	id: number;
	title: string;
	description: string;
	dueDate: Date;
	status: TaskStatus;
	priority: TaskPriority;
	tags: string[];
	dependencies: number[];
	createdAt: Date;
	updatedAt: Date;

	constructor({
		id,
		title,
		description,
		dueDate,
		status = TaskStatus.PENDING,
		priority = TaskPriority.MEDIUM,
		tags = [],
		dependencies = [],
	}: {
		id: number;
		title: string;
		description: string;
		dueDate: Date;
		status?: TaskStatus;
		priority?: TaskPriority;
		tags?: string[];
		dependencies?: number[];
	}) {
		this.id = id;
		this.title = title;
		this.description = description;
		this.dueDate = new Date(dueDate);
		this.status = status;
		this.priority = priority;
		this.tags = tags;
		this.dependencies = dependencies;
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	update(updates: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>): void {
		Object.assign(this, updates);
		this.updatedAt = new Date();
	}

	canTransitionTo(newStatus: TaskStatus): boolean {
		const validTransitions = VALID_STATUS_TRANSITIONS[this.status];
		return validTransitions.includes(newStatus);
	}

	canBeArchived(): boolean {
		if (this.priority === TaskPriority.HIGH) {
			return this.status === TaskStatus.COMPLETED;
		}
		return true;
	}

	validate() {
		// Check due date is not in the past
		if (!isAfter(this.dueDate, new Date())) {
			throw new Error("Due date cannot be in the past");
		}

		// Check tags
		if (!Array.isArray(this.tags) || this.tags.length === 0) {
			throw new Error("Task must have at least one tag");
		}

		// Validate status transition
		if (this.status === TaskStatus.ARCHIVED && !this.canBeArchived()) {
			throw new Error("High priority tasks must be completed before archiving");
		}
	}
}

export { Task, TaskStatus, TaskPriority, VALID_STATUS_TRANSITIONS };
