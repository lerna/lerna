/**
 * A queue abstraction for tasks that may require a delayed execution
 */
export interface Queue {
  /**
   * Run a task once the queue is cleared
   * @param f A function that will be executed once the queue is useable
   * @return A promise that wraps the value returned by f
   */
  queue<T>(f: () => Promise<T>): Promise<T>;
}

/**
 * A queue that immediately executes any promise it receives
 */
export class ImmediateQueue implements Queue {
  queue<T>(f: () => Promise<T>): Promise<T> {
    return f();
  }
}

/**
 * Internal queue item representation used by {@link TailHeadQueue}
 */
type TailHeadQueueItem = { startTime?: number; endTime?: number };

/**
 * A sized queue that adds a delay between the end of an item's execution.
 *
 * Use only with async code, multi-threading is not supported.
 */
export class TailHeadQueue implements Queue {
  private queue_list: TailHeadQueueItem[];
  private queue_size: number;
  private queue_period: number;

  /**
   * @param size The number of items that may run concurrently
   * @param period The time between the end of the execution of an item and the start of the execution of the next one (ms)
   */
  constructor(size = 20, period = 30 * 1000) {
    this.queue_list = [];
    this.queue_size = Math.floor(size);
    this.queue_period = period;
  }

  /**
   * Return the item with the smallest endTime in the provided list, for use with {@link TailHeadQueue.queue_list}.reduce
   * @param p The last received item, this should be `[{}, -1]` at the start of the reduction
   * @param v A queue item
   * @param i The queue item's index
   * @returns An array that contains a queue item and its index
   */
  protected static list_reducer(
    p: [TailHeadQueueItem, number],
    v: TailHeadQueueItem,
    i: number
  ): [TailHeadQueueItem, number] {
    if (!p[0].endTime || (v.endTime && v.endTime < p[0].endTime)) {
      return [v, i];
    }
    return p;
  }

  async queue<T>(f: () => Promise<T>): Promise<T> {
    let curtime = Date.now();
    let smallest: [TailHeadQueueItem, number] = this.queue_list.reduce(TailHeadQueue.list_reducer, [{}, -1]);
    // Be careful when editing this loop, the position of each element around the async code is important
    while (this.queue_list.length >= this.queue_size) {
      if (smallest[0].endTime && smallest[0].endTime + this.queue_period <= curtime) {
        this.queue_list.splice(smallest[1]);
        break;
      }
      const delay = Math.max((smallest[0].endTime as number) + this.queue_period - curtime, 100);
      await new Promise((r) => setTimeout(r, delay));
      smallest = this.queue_list.reduce(TailHeadQueue.list_reducer, [{}, -1]);
      curtime = Date.now();
    }

    const task: TailHeadQueueItem = { startTime: curtime };
    this.queue_list.push(task);
    return f().then(
      (r) => {
        task.endTime = Date.now();
        return Promise.resolve(r);
      },
      (r) => {
        task.endTime = Date.now();
        return Promise.reject(r);
      }
    );
  }
}
