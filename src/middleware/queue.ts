import { Request, Response, NextFunction } from "express";

/**
 * queue middleware for batch processing requests
 */

const requestQueue: Array<{ req: Request; res: Response; next: NextFunction }> = [];
let isProcessing = false;

const processQueue = () => {
	if (requestQueue.length === 0) {
		isProcessing = false;
		return;
	}

	isProcessing = true;
	const { req, res, next } = requestQueue.shift()!;

	// Process the request
	next();

	// Continue with the next request in the queue
	processQueue();
};

export const queueMiddleware = (req: Request, res: Response, next: NextFunction) => {
	requestQueue.push({ req, res, next });
	if (!isProcessing) {
		processQueue();
	}
};
