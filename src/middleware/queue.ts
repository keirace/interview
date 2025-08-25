import { Request, Response, NextFunction } from "express";

/**
 * queue middleware for batch processing requests
 */
type RequestQueueItem = { req: Request; res: Response; next: NextFunction };
const requestQueue: Array<RequestQueueItem> = [];
let isProcessing = false;

/**
 * process the request queue asynchronously
 * @return {Promise<void>} - A promise that resolves when the queue is processed
 */
const processQueue = async (): Promise<void> => {
    // If the queue is empty, stop processing
	if (requestQueue.length === 0) {
		isProcessing = false;
		return;
	}

	isProcessing = true;
	const { next } = requestQueue.shift()!;

    try {
        await new Promise<void>((resolve, reject) => {
            try {
                // Process the request
                next();
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    } finally {
        // schedule the next request processing
        setImmediate(processQueue);
    }
};

export const queueMiddleware = (req: Request, res: Response, next: NextFunction) => {
	requestQueue.push({ req, res, next });
    // If not already processing, start processing the queue
	if (!isProcessing) {
		void processQueue();
	}
};
