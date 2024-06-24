import { Tracker } from "./tracker";
import { TrackerBase } from "./tracker-base";
import { TrackerStream } from "./tracker-stream";

export class TrackerGroup extends TrackerBase {
  parentGroup = null;
  trackers: Array<Tracker> = [];
  completion: any = {};
  weight: any = {};
  totalWeight = 0;
  finished = false;
  bubbleChange = bubbleChange(this);

  nameInTree() {
    const names = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let from: this | null = this;
    while (from) {
      names.unshift(from.name);
      from = from.parentGroup;
    }
    return names.join("/");
  }

  addUnit(unit: any, weight = 0) {
    if (unit.addUnit) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let toTest: this | null = this;
      while (toTest) {
        if (unit === toTest) {
          throw new Error(
            "Attempted to add tracker group " +
              unit.name +
              " to tree that already includes it " +
              this.nameInTree()
          );
        }
        toTest = toTest.parentGroup;
      }
      unit.parentGroup = this;
    }
    this.weight[unit.id] = weight || 1;
    this.totalWeight += this.weight[unit.id];
    this.trackers.push(unit);
    this.completion[unit.id] = unit.completed();
    unit.on("change", this.bubbleChange);
    if (!this.finished) {
      this.emit("change", unit.name, this.completion[unit.id], unit);
    }
    return unit;
  }

  completed() {
    if (this.trackers.length === 0) {
      return 0;
    }
    const valPerWeight = 1 / this.totalWeight;
    let completed = 0;
    for (let ii = 0; ii < this.trackers.length; ii++) {
      const trackerId = this.trackers[ii].id;
      completed += valPerWeight * this.weight[trackerId] * this.completion[trackerId];
    }
    return completed;
  }

  newGroup(name: string, weight = 0) {
    return this.addUnit(new TrackerGroup(name), weight);
  }

  newItem(name: string, todo: number, weight = 0) {
    return this.addUnit(new Tracker(name, todo), weight);
  }

  newStream(name: string, todo: number, weight = 0) {
    return this.addUnit(new TrackerStream(name, todo), weight);
  }

  finish() {
    this.finished = true;
    if (!this.trackers.length) {
      this.addUnit(new Tracker(), 1);
    }
    for (let ii = 0; ii < this.trackers.length; ii++) {
      const tracker = this.trackers[ii];
      tracker.finish();
      tracker.removeListener("change", this.bubbleChange);
    }
    this.emit("change", this.name, 1, this);
  }

  debug(depth = 0) {
    const indent = " ".repeat(depth);
    let output = `${indent}${this.name || "top"}: ${this.completed()}\n`;

    this.trackers.forEach(function (tracker) {
      output +=
        tracker instanceof TrackerGroup
          ? tracker.debug(depth + 1)
          : `${indent} ${tracker.name}: ${tracker.completed()}\n`;
    });
    return output;
  }
}

function bubbleChange(trackerGroup: any) {
  return function (name: any, completed: any, tracker: { id: string | number }) {
    trackerGroup.completion[tracker.id] = completed;
    if (trackerGroup.finished) {
      return;
    }
    trackerGroup.emit("change", name || trackerGroup.name, trackerGroup.completed(), trackerGroup);
  };
}
