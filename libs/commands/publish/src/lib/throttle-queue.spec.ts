import * as throttling from "./throttle-queue";

describe("verifyImmediateQueueBehavior", () => {
  test("immediately runs all provided resolving promises", async () => {
    const count = 100;
    const queue = new throttling.ImmediateQueue();
    const queue_promises = Array(count)
      .fill(undefined)
      .map(() => queue.queue(async () => Date.now()));
    const acc = await Promise.all(queue_promises);
    expect(acc.length).toBe(count);
    acc.sort();
    expect(acc[count - 1] - acc[0]).toBeLessThan(100);
  });
  test("immediately runs all provided rejecting promises", async () => {
    const count = 100;
    const queue = new throttling.ImmediateQueue();
    const queue_promises = Array(count)
      .fill(undefined)
      .map(() => queue.queue(async () => new Promise((_, r) => r(Date.now()))));
    const acc = await Promise.allSettled(queue_promises);
    expect(acc.length).toBe(count);
    const resolved_sorted_acc = acc
      .map((r) => {
        expect(r.status).toBe("rejected");
        if (r.status === "rejected") {
          return r.reason;
        }
      })
      .sort();
    expect(resolved_sorted_acc[count - 1] - resolved_sorted_acc[0]).toBeLessThan(100);
  });
});

describe("verifyTailHeadQueueBehavior", () => {
  test("immediately runs all provided resolving promises within queue size", async () => {
    const count = 100;
    const queue = new throttling.TailHeadQueue(count);
    const queue_promises = Array(count)
      .fill(undefined)
      .map(() => queue.queue(async () => Date.now()));
    const acc = await Promise.all(queue_promises);
    expect(acc.length).toBe(count);
    acc.sort();
    expect(acc[count - 1] - acc[0]).toBeLessThan(100);
  });
  test("immediately runs all provided rejecting promises within queue size", async () => {
    const count = 100;
    const queue = new throttling.TailHeadQueue(count);
    const queue_promises = Array(count)
      .fill(undefined)
      .map(() => queue.queue(async () => new Promise((_, r) => r(Date.now()))));
    const acc = await Promise.allSettled(queue_promises);
    expect(acc.length).toBe(count);
    const resolved_sorted_acc = acc
      .map((r) => {
        expect(r.status).toBe("rejected");
        if (r.status === "rejected") {
          return r.reason;
        }
      })
      .sort();
    expect(resolved_sorted_acc[count - 1] - resolved_sorted_acc[0]).toBeLessThan(100);
  });
  test("runs all provided resolving promises with a delay if they exceed queue size", async () => {
    const count = 100;
    const queue = new throttling.TailHeadQueue(count / 3 + 1, 2 * 1000);
    const queue_promises = Array(count)
      .fill(undefined)
      .map(() => queue.queue(async () => Date.now()));
    const acc = await Promise.all(queue_promises);
    expect(acc.length).toBe(count);
    acc.sort();
    const total_time = acc[count - 1] - acc[0];
    expect(total_time).toBeGreaterThan(3.8 * 1000);
    expect(total_time).toBeLessThan(4.2 * 1000);
  });
});
