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
 *
 * All items MUST be queued upfront or late items may be executed immediately
 * if the queue is freed.
 */
export class TailHeadQueue implements Queue {
  private queue_list: ((v: any) => any)[];
  private queue_size: number;
  private queue_period: number;
  private allowance: number;

  /**
   * @param size The number of items that may run concurrently
   * @param period The time between the end of the execution of an item and the start of the execution of the next one (ms)
   */
  constructor(size = 20, period = 30 * 1000) {
    this.queue_list = [];
    this.queue_size = Math.floor(size);
    this.queue_period = period;
    this.allowance = this.queue_size;
  }

  /**
   * Return the item with the smallest endTime in the provided list, for use with {@link TailHeadQueue.queue_list}.reduce
   * @param p The last received item, this should be `[{}, -1]` at the start of the reduction
   * @param v A queue item
   * @param i The queue item's index
   * @returns An array that contains a queue item and its index
   */
  protected static list_reducer(p: TailHeadQueueItem, v: TailHeadQueueItem, i: number): TailHeadQueueItem {
    if (!p.endTime || (v.endTime && v.endTime < p.endTime)) {
      return v;
    }
    return p;
  }

  /**
   * Validate the execution of a queue item and schedule the execution of the next one
   */
  _on_settled() {
    const next = this.queue_list.shift();
    if (next !== undefined) {
      setTimeout(next, this.queue_period);
    } else {
      // If we ever reach this point and THEN a new item is queued, it will be
      // executed immediately. This is acceptable in our use-case as all queue
      // items are loaded at once, so this problem should never occur.
      //
      // We can't simply wrap this in a setTimeout as it would add a flat
      // this.queue_period delay to lerna's execution end after the last item
      // in the queue is processed.
      this.allowance += 1;
    }
  }

  async queue<T>(f: () => Promise<T>): Promise<T> {
    let p: Promise<T>;
    if (this.allowance > 0) {
      this.allowance -= 1;
      p = f();
    } else {
      p = new Promise((r) => {
        this.queue_list.push(r);
      }).then(f);
    }
    return p.finally(() => {
      // Don't wait on _on_settled as it is for the queue's continuation
      // and should not delay processing of the queued item's result.
      this._on_settled();
    });
  }
}
