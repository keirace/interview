import request from "supertest";
import app from "../src/app";
import { cache } from "../src/middleware/cache";
import { TaskPriority } from "../src/models/task";

describe("Cache Middleware", () => {
	beforeEach(() => {
		cache.clear();
	});
	it("should cache GET /tasks/:id responses", async () => {
		// Create a new task
		const createRes = await request(app)
			.post("/tasks")
			.send({
				title: "Cache Test Task",
				description: "Testing cache middleware",
				dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
				priority: TaskPriority.MEDIUM,
				tags: ["cache", "test"],
			});
		expect(createRes.statusCode).toBe(201);
		const taskId = createRes.body.id;
        console.log("Created Task ID:", taskId);

		// First GET request - should hit in-memory storage
		const firstGetRes = await request(app).get(`/tasks/${taskId}`);
		expect(firstGetRes.statusCode).toBe(200);
		expect(firstGetRes.body).toHaveProperty("id", taskId);
        expect(cache.has(taskId.toString())).toBe(true); // Cache should have the task

		// Second GET request - should hit the cache
		const secondGetRes = await request(app).get(`/tasks/${taskId}`);
		expect(secondGetRes.statusCode).toBe(200);
        console.log("secondGetRes.body ", secondGetRes.body);
        expect(secondGetRes.body).toHaveProperty("id", taskId);

		// Clean up - delete the created task
		const deleteRes = await request(app).delete(`/tasks/${taskId}`);
		expect(deleteRes.statusCode).toBe(204);
		expect(cache.has(taskId)).toBe(false); // Cache should be invalidated on delete
	});
});
