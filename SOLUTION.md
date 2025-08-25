# Task Management API
I've implemented a solution in Node.js + Express with TypeScript and in-memory storage. It covers the following features:
- CRUD for tasks
- Filtering, sorting, pagination, and search functionality (title/description)
- Business rules (status flow, due dates, tags, priority)
- Rate Limiting
- Caching
- Queueing
- Unit + Integration tests
- Swagger + OpenAPI docs

## How to run
### Application
```bash
# install all the required libraries
npm install

# for dev env
npm run dev

# for production
npm run build
npm start
```

### Test
```bash
npm test

# or with coverage
npm run test:coverage
```

## Configuration 
Copy `.env.example` to `.env` and update the values as needed.
```
PORT=3000 # port the server will run on
NODE_ENV=development # development, production, test
RATE_LIMIT=50 # Max requests allowed per IP within time window
RATE_LIMIT_WINDOW_MS=60000 # Time window in milliseconds (e.g. 60000 = 1 minute)
```

## API Endpoints
The current URL is default to `http://localhost:3000/`.
The port number can be changed via `.env` file.

### Tasks
- POST `tasks` - create task
- GET `tasks` - get a list of tasks with filter/sort/pagination/search
- GET `tasks/:id` - get by id (cached)
- PATCH `tasks/:id` - partial update (validates transitions/deps)
- DELETE `tasks/:id` - delete the task by specified id

#### Analytics
- GET `/analytics/completion-rate?interval=day|week|month`
- GET `/analytics/avg-completion-time` (by priority)
- GET `/analytics/top-tags?limit=10`

#### Batch
- POST `/tasks/batch` - atomic create
- PUT `/tasks/batch` - atomic update
- DELETE `/tasks/batch` - atomic delete

### Docs 
- Swagger UI can be accessed at `/docs` eg. [`http://localhost:3000/docs`](http://localhost:3000/docs).
- Endpoints are annotated with @openapi in `tasks.ts` route file.

## Assumptions made
- In-memory storage is sufficient for this scope (can be swapped to database for data persistence in production).
- IDs are currently generated with incremented integers. This can be updated to using random UUIDs for larger scale.
- Search functionality by title and description is a simple substring match.
- Simple caching is sufficient for a small number tasks and is only done for GET `tasks/:id` endpoint. It can be expanded to cover query results.

## Trade-offs
- In-memory atomicity duplicates data but is acceptable since we're working on a small set of data in this case.
- LRU cache is not shared which is fine for a local dev but would require a distributed cache in a real production.
- Rate limiting is per-process in memory while a real setup would use Redis or a gateway.

## How I would improve if I had more time
- A clearer, more modular project structure, including extracting tasks services from controllers.
- Implementing task dependencies checker using DFS for cycle detection.
- End-to-end tests in CI (with Github Actions).
- Better metrics for analytics, including Histograms.
- Adding background workers for analytics aggregation.

## How I would modify the solution for scale
- Swap in-memory storage for an actual database such as MySQL or Postgres.
- Distributed cache and rate limiting.
- Ensure that keys are idempotent for batch operations.
- Use LRU-cache for handling a larger number of requests.