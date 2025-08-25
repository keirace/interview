// modified to use module
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import taskRoutes from "./routes/tasks";
import { rateLimit } from "./middleware/rateLimit";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from "./docs/swagger";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimit({ capacity: process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : 50, windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 60000 }));

// Welcome route
app.get("/", (req: Request, res: Response) => {
	res.json({
		message: "Welcome to the Task Management API",
	});
});

// Tasks routes
app.use("/tasks", taskRoutes);

// Documentation route
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
	console.error(err.stack);
	res.status(500).json({
		error: "Something went wrong!",
		message: err.message,
	});
});

// 404 handler
app.use((req: Request, res: Response) => {
	res.status(404).json({
		error: "Not Found",
		message: "The requested resource was not found",
	});
});

// Start server
if (process.env.NODE_ENV !== "test") {
	app.listen(port, () => {
		console.log(`Server is running on port ${port}`);
	});
}

export default app;
