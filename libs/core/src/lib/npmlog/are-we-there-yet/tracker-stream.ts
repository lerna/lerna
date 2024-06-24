import stream from "node:stream";
import { Tracker } from "./tracker";

export class TrackerStream extends stream.Transform {
  tracker: Tracker;
  name: string;
  id: number;

  constructor(name: string, size = 0, options?: stream.TransformOptions) {
    super(options);
    this.tracker = new Tracker(name, size);
    this.name = name;
    this.id = this.tracker.id;
    this.tracker.on("change", this.trackerChange.bind(this));
  }

  trackerChange(name: string, completion: any) {
    this.emit("change", name, completion, this);
  }

  override _transform(data: string | any[], encoding: any, cb: () => void) {
    this.tracker.completeWork(data.length ? data.length : 1);
    this.push(data);
    cb();
  }

  override _flush(cb: () => void) {
    this.tracker.finish();
    cb();
  }

  completed() {
    return this.tracker.completed();
  }

  addWork(work: number) {
    return this.tracker.addWork(work);
  }

  finish() {
    return this.tracker.finish();
  }
}
