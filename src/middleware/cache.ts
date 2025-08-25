import { Request, Response, NextFunction } from "express";

/**
 * in-memory caching middleware for GET /tasks/:id requests
 */
const cache = new Map<string, { value: any; timestamp: number }>();
export const cacheTasks = (req: Request, res: Response, next: NextFunction, ttl: number = 5 * 60 * 1000) => {
	if (req.method === "GET" && req.path.startsWith("/tasks/")) {
		const taskId = req.path.split("/")[2];
		// Check if response is already cached and still valid (5 minutes)
		if (cache.has(taskId) && Date.now() < cache.get(taskId)!.timestamp) {
			return res.json(cache.get(taskId));
		}
		const originalSend = res.send.bind(res);
		res.send = (body: any) => {
			cache.set(taskId, { value: body, timestamp: Date.now() + ttl }); // Cache for specified TTL
			return originalSend(body);
		};
	}
	next();
};

// Invalidate cache on task updates or deletions
export const invalidateCache = (req: Request, res: Response) => {
	if (["PUT", "PATCH", "DELETE"].includes(req.method) && req.path.startsWith("/tasks/")) {
		const taskId = req.path.split("/")[2];
		cache.delete(taskId);
	}
};
