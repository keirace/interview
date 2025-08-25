import request from "supertest";
import app from "../src/app";

describe("Rate Limiter Middleware", () => {
	it("should allow requests under the limit", async () => {
		for (let i = 0; i < 5; i++) {
			const res = await request(app).get("/");
			expect(res.statusCode).toBe(200);
		}
	});

    // currently set to 50 requests per 15 minutes
	it("should block requests over the limit", async () => {
		for (let i = 0; i < 51; i++) {
			await request(app).get("/");
		}
		const res = await request(app).get("/");
		expect(res.statusCode).toBe(429);
	});
});
