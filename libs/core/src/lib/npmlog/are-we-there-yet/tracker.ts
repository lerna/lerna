import { TrackerBase } from "./tracker-base";

export class Tracker extends TrackerBase {
  workDone: number;
  workTodo: number;

  constructor(name?: string, todo?: number) {
    super(name);
    this.workDone = 0;
    this.workTodo = todo || 0;
  }

  completed() {
    return this.workTodo === 0 ? 0 : this.workDone / this.workTodo;
  }

  addWork(work: number) {
    this.workTodo += work;
    this.emit("change", this.name, this.completed(), this);
  }

  completeWork(work: number) {
    this.workDone += work;
    if (this.workDone > this.workTodo) {
      this.workDone = this.workTodo;
    }
    this.emit("change", this.name, this.completed(), this);
  }

  finish() {
    this.workTodo = this.workDone = 1;
    this.emit("change", this.name, 1, this);
  }
}
