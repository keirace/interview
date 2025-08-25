import { Request, Response, NextFunction } from "express";

/**
 * Rate limiting middleware for API requests based on IP address 
 * @param {number} options.capacity - Maximum number of requests allowed in the time window, default is 20
 * @param {number} options.windowMs - Time window in milliseconds, default is 15 minutes
 * @returns {(req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>}
 */

export function rateLimit({ capacity = 20, windowMs = 15 * 60 * 1000 }: { capacity?: number; windowMs?: number }): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>> {
	type bucket = { tokens: number; last: number };
	const buckets = new Map<string, bucket>();
	return (req: Request, res: Response, next: NextFunction) => {
		const ip = req.ip ?? "";
		const now = Date.now();
		// Initialize bucket if it doesn't exist
		if (!buckets.has(ip)) {
			buckets.set(ip, { tokens: capacity - 1, last: now });
			return next();
		}
		// Refill tokens based on elapsed time
		const bucket = buckets.get(ip)!;
		const elapsed = now - bucket.last;
		bucket.tokens += (elapsed / windowMs) * capacity;
		bucket.tokens = Math.min(bucket.tokens, capacity); // Cap tokens to capacity
		bucket.last = now;
		if (bucket.tokens < 1) {
			return res.status(429).json({ error: "Too Many Requests", message: `Rate limit exceeded. Try again later in ${Math.ceil((bucket.last + windowMs - now) / (60 * 1000))} minutes.` });
		}
		bucket.tokens -= 1;
		next();
	};
}
