import { queueMiddleware } from "../src/middleware/queue";
import { Request, Response, NextFunction } from "express";

describe("queueMiddleware", () => {
	let logs: string[];

	beforeEach(() => {
		logs = [];
	});

	function makeReq(id: number): [Request, Response, NextFunction] {
		const req = {} as Request;
		const res = {} as Response;
		const next: NextFunction = jest.fn(() => {
			logs.push(`processed ${id}`);
		});
		return [req, res, next];
	}

	test("processes requests sequentially", async () => {
		const r1 = makeReq(1);
		const r2 = makeReq(2);
		const r3 = makeReq(3);

		// enqueue
		queueMiddleware(...r1);
		queueMiddleware(...r2);
		queueMiddleware(...r3);

		// wait for queue to process
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(logs).toEqual(["processed 1", "processed 2", "processed 3"]);
	});

	test("does not start processing until explicitly triggered", async () => {
		const [req, res, next] = makeReq(99);
		queueMiddleware(req, res, next);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(logs).toEqual(["processed 99"]);
	});
});
