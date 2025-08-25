import request from "supertest";
import app from "../src/app";
import { TaskStatus, TaskPriority } from "../src/models/task";

describe("Tasks API", () => {
	let createdTaskId: string;

	const sampleTask = {
		title: "Test Task",
		description: "Test Description",
		dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
		priority: TaskPriority.MEDIUM,
		tags: ["test", "sample"],
	};

	describe("POST /tasks", () => {
		it("should create a new task", async () => {
			const res = await request(app).post("/tasks").send(sampleTask);

			expect(res.statusCode).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.title).toBe(sampleTask.title);
			expect(res.body.status).toBe(TaskStatus.PENDING);

			createdTaskId = res.body.id;
		});

		it("should validate required fields", async () => {
			const res = await request(app).post("/tasks").send({});

			expect(res.statusCode).toBe(400);
			expect(res.body).toHaveProperty("error");
		});

		it("should reject past due dates", async () => {
			const res = await request(app)
				.post("/tasks")
				.send({
					...sampleTask,
					dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
				});

			expect(res.statusCode).toBe(400);
		});
	});

	describe("GET /tasks", () => {
		it("should return all tasks with pagination", async () => {
			const res = await request(app).get("/tasks").query({ page: 1, limit: 10 });

			expect(res.statusCode).toBe(200);
			expect(res.body).toHaveProperty("tasks");
			expect(res.body).toHaveProperty("pagination");
			expect(Array.isArray(res.body.tasks)).toBeTruthy();
		});

		it("should filter tasks by status", async () => {
			const res = await request(app).get("/tasks").query({ status: TaskStatus.PENDING });

			expect(res.statusCode).toBe(200);
			expect(res.body.tasks.every((task: any) => task.status === TaskStatus.PENDING)).toBeTruthy();
		});
	});

	describe("PUT /tasks/:id", () => {
		it("should update task status following valid transitions", async () => {
			const res = await request(app)
				.put(`/tasks/${createdTaskId}`)
				.send({
					title: "Updated Task",
					description: "Updated Description",
					dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
					status: TaskStatus.IN_PROGRESS,
					tags: ["updated"],
				});

			expect(res.statusCode).toBe(200);
			expect(res.body.status).toBe(TaskStatus.IN_PROGRESS);
		});

		it("should reject invalid status transitions", async () => {
			const res = await request(app).put(`/tasks/${createdTaskId}`).send({
				status: TaskStatus.ARCHIVED,
			});

			expect(res.statusCode).toBe(400);
		});
	});

	describe("PATCH /tasks/:id", () => {
		it("should partially update task status following valid transitions", async () => {
			const res = await request(app).patch(`/tasks/${createdTaskId}`).send({
				status: TaskStatus.COMPLETED,
			});

			expect(res.statusCode).toBe(200);
			expect(res.body.status).toBe(TaskStatus.COMPLETED);
		});
		it("should reject invalid status transitions", async () => {
			const res = await request(app).patch(`/tasks/${createdTaskId}`).send({
				status: TaskStatus.PENDING,
			});

			expect(res.statusCode).toBe(400);
		});
	});

	describe("GET /tasks/search", () => {
		it("should search tasks by title or description", async () => {
			const res = await request(app).get("/tasks/search").query({ query: "Updated Task" });

			expect(res.statusCode).toBe(200);
			expect(Array.isArray(res.body)).toBeTruthy();
			expect(res.body.length).toBeGreaterThan(0);
			expect(res.body.every((task: any) => task.title.includes("Updated Task") || task.description.includes("Updated Task"))).toBeTruthy();
		});

		it("should return 400 if no query provided", async () => {
			const res = await request(app).get("/tasks/search");

			expect(res.statusCode).toBe(400);
			expect(res.body).toHaveProperty("error");
		});
	});

	describe("DELETE /tasks/:id", () => {
		it("should delete a task", async () => {
			const res = await request(app).delete(`/tasks/${createdTaskId}`);

			expect(res.statusCode).toBe(204);

			// Verify deletion
			const getRes = await request(app).get(`/tasks/${createdTaskId}`);

			expect(getRes.statusCode).toBe(404);
		});
	});

	describe("GET /tasks/analytics", () => {
		it("should return completion rate", async () => {
			const res = await request(app).get("/tasks/analytics/completion-rate");

			expect(res.statusCode).toBe(200);
			expect(res.body).toHaveProperty("completionRate");
		});

		it("should return popular tags", async () => {
			const res = await request(app).get("/tasks/analytics/popular-tags");

			expect(res.statusCode).toBe(200);
			expect(Array.isArray(res.body)).toBeTruthy();
		});
	});

	describe("POST /tasks/batch", () => {
		it("should create multiple tasks", async () => {
			const res = await request(app)
				.post("/tasks/batch")
				.send([
					{
						title: "Batch Task 1",
						description: "Description 1",
						dueDate: new Date(Date.now() + 86400000).toISOString(),
						priority: TaskPriority.LOW,
						tags: ["batch"],
					},
					{
						title: "Batch Task 2",
						description: "Description 2",
						dueDate: new Date(Date.now() + 86400000).toISOString(),
						priority: TaskPriority.HIGH,
						tags: ["batch"],
					},
				]);
			expect(res.statusCode).toBe(201);
			expect(Array.isArray(res.body)).toBeTruthy();
			expect(res.body.length).toBe(2);
			expect(res.body[0]).toHaveProperty("id");
			expect(res.body[1]).toHaveProperty("id");
		});

		it("should fail batch creation if one task is invalid", async () => {
			const res = await request(app)
				.post("/tasks/batch")
				.send([
					{
						title: "Batch Task 1",
						description: "Description 1",
						dueDate: new Date(Date.now() + 86400000).toISOString(),
						priority: TaskPriority.LOW,
						tags: ["batch"],
					},
					{
						title: "Batch Task 2",
						description: "Description 2",
						dueDate: new Date(Date.now() - 86400000).toISOString(),
						priority: TaskPriority.HIGH,
						tags: ["batch"],
					},
				]);

			expect(res.statusCode).toBe(400);
			expect(res.body).toHaveProperty("error");
		});

		describe("PUT /tasks/batch", () => {
			it("should update multiple tasks", async () => {
				const res = await request(app).get("/tasks");

				const tasksToUpdate = res.body.tasks;
				tasksToUpdate.forEach((task: any) => {
					task.status = TaskStatus.IN_PROGRESS;
				});

				// Update both tasks
				const updateRes = await request(app).put("/tasks/batch").send(tasksToUpdate);

				expect(updateRes.statusCode).toBe(200);
				expect(Array.isArray(updateRes.body)).toBeTruthy();
				expect(updateRes.body.length).toBe(2);
				expect(updateRes.body[0].status).toBe(TaskStatus.IN_PROGRESS);
				expect(updateRes.body[1].status).toBe(TaskStatus.IN_PROGRESS);
			});
		});
	});

  describe("DELETE /tasks/batch", () => {
    it("should delete multiple tasks", async () => {
      const res = await request(app).get("/tasks");

      const tasksToDelete = res.body.tasks.map((task: any) => task.id);

      // Delete both tasks
      const deleteRes = await request(app).delete("/tasks/batch").send({ ids: tasksToDelete });

      expect(deleteRes.statusCode).toBe(204);

      // Verify deletion
      const getRes = await request(app).get("/tasks");
      expect(getRes.statusCode).toBe(200);
      expect(Array.isArray(getRes.body.tasks)).toBeTruthy();
      expect(getRes.body.tasks.length).toBe(0);
    });
  });
});
