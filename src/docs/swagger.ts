import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
	definition: {
		openapi: "3.1.0",
		info: {
			title: "Task Management API",
			description: "Task Management System Documentation – Swagger UI",
			version: "1.0.0",
		},
		servers: [
			{
				url: `http://localhost:${process.env.PORT || 3000}`,
			},
		],
        tags: [
            { name: "Tasks", description: "Tasks management operations" },
            { name: "Batch Tasks", description: "Batch tasks management operations" }
        ],
		components: {
			schemas: {
				Task: {
					type: "object",
					properties: {
						id: { type: "string" },
						title: { type: "string" },
						description: { type: "string" },
						dueDate: { type: "string", format: "date-time" },
						status: {
							type: "string",
							enum: ["pending", "in-progress", "completed", "archived"],
						},
						priority: { type: "string", enum: ["low", "medium", "high"] },
						tags: { type: "array", items: { type: "string" } },
						dependencies: { type: "array", items: { type: "string" } },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
						completedAt: { type: "string", format: "date-time", nullable: true },
					},
				},
				CreateTask: {
					type: "object",
					required: ["title", "description", "dueDate", "priority", "tags"],
					properties: {
						title: { type: "string" },
						description: { type: "string" },
						dueDate: { type: "string", format: "date-time" },
						status: {
							type: "string",
							enum: ["pending", "in-progress", "completed", "archived"],
							default: "pending",
						},
						priority: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
						tags: { type: "array", items: { type: "string" } },
						dependencies: { type: "array", items: { type: "string" } },
					},
				},
				UpdateTask: {
					type: "object",
					properties: {
						title: { type: "string" },
						description: { type: "string" },
						dueDate: { type: "string", format: "date-time" },
						status: { type: "string", enum: ["pending", "in-progress", "completed", "archived"] },
						priority: { type: "string", enum: ["low", "medium", "high"] },
						tags: { type: "array", items: { type: "string" } },
						dependencies: { type: "array", items: { type: "string" } },
					},
				},
                BatchUpdateTasks: {
					type: "object",
					properties: {
                        id: { type: "string" },
						title: { type: "string" },
						description: { type: "string" },
						dueDate: { type: "string", format: "date-time" },
						status: { type: "string", enum: ["pending", "in-progress", "completed", "archived"] },
						priority: { type: "string", enum: ["low", "medium", "high"] },
						tags: { type: "array", items: { type: "string" } },
						dependencies: { type: "array", items: { type: "string" } },
					},
				},
                Error: {
                    type: "object",
                    properties: {
                        error: { type: "string" },
                        details: {
                            type: "array",
                            items: { type: "string" },
                        },
                    },
                },
			},
		},
	},

    // Annotate routes with @openapi
	apis: ["src/routes/**/*.ts"],
});
