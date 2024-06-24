import EventEmitter from "node:events";

let trackerId = 0;

export class TrackerBase extends EventEmitter {
  id: number;
  name: string;

  constructor(name = "") {
    super();
    this.id = ++trackerId;
    this.name = name;
  }
}
