import request from "supertest";
import app from "../src/app";

describe("Rate Limiter Middleware", () => {
	it("should allow requests under the limit", async () => {
		for (let i = 0; i < (process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : 50); i++) {
			const res = await request(app).get("/");
			expect(res.statusCode).toBe(200);
		}
	});

    // default to 50 requests per minute if env var not set
	it("should block requests over the limit", async () => {
		for (let i = 0; i < (process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT)+1 : 51); i++) {
			await request(app).get("/");
		}
		const res = await request(app).get("/");
		expect(res.statusCode).toBe(429);
	});
});
