# Controllers Directory

Add your controller logic in this directory.

Example structure for a controller file:

```typescript
// Example controller structure
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    // Implement your logic here
    res.json({ message: 'Get all tasks' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    // Implement your logic here
    res.status(201).json({ message: 'Task created' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```
