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
 * A sized queue that adds a delay between the end of an item's execution.
 *
 * Use only with async code, multi-threading is not supported.
 */
export class TailHeadQueue implements Queue {
  private queue_list: ((v: any) => any)[];
  private queue_size: number;
  private queue_period: number;
  private allowance: number;
  private last_end: number[];

  /**
   * @param size The number of items that may run concurrently
   * @param period The time between the end of the execution of an item and the start of the execution of the next one (ms)
   */
  constructor(size, period) {
    this.queue_list = [];
    this.queue_size = Math.floor(size);
    this.queue_period = period;
    this.allowance = this.queue_size;
    this.last_end = [];
  }

  /**
   * Validate the execution of a queue item and schedule the execution of the next one
   */
  _on_settled() {
    const next = this.queue_list.shift();
    if (next !== undefined) {
      setTimeout(next, this.queue_period);
    } else {
      // If we ever reach this point and THEN a new item is queued, we need to
      // explicitly keep track of execution times to be able to add a delay.
      //
      // We can't simply wrap this in a setTimeout as it would add a flat
      // this.queue_period delay to lerna's execution end after the last item
      // in the queue is processed.
      this.last_end.push(Date.now());
      this.allowance += 1;
    }
  }

  async queue<T>(f: () => Promise<T>): Promise<T> {
    let p: Promise<T>;
    if (this.allowance > 0) {
      this.allowance -= 1;
      // Check if the queue should delay the promise's execution
      if (this.allowance + 1 <= this.last_end.length) {
        const time_offset = Date.now() - (this.last_end.shift() || 0);
        if (time_offset < this.queue_period) {
          p = new Promise((r) => setTimeout(r, this.queue_period - time_offset)).then(f);
        }
      }
      if (p === undefined) {
        p = f();
      }
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
