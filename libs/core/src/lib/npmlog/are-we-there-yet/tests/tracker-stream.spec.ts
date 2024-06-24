import { Writable } from "stream";
import { TrackerStream } from "../tracker-stream";
import testEvent from "./test-event";

class Sink extends Writable {
  _write(data: any, encoding: string, cb: () => void) {
    cb();
  }
}

describe("TrackerStream", () => {
  it("should track stream completion correctly", async () => {
    expect.assertions(9);

    const name = "test";
    let track = new TrackerStream(name);

    expect(track.completed()).toBe(0);

    const todo = 10;
    track = new TrackerStream(name, todo);
    expect(track.completed()).toBe(0);

    track.pipe(new Sink());

    await new Promise<void>((resolve) => {
      testEvent(track, "change", afterCompleteWork);
      track.write("0123456789");

      function afterCompleteWork(err: any, onChangeName: string) {
        expect(err).toBeNull();
        expect(onChangeName).toBe(name);
        expect(track.completed()).toBe(1);

        testEvent(track, "change", afterAddWork);
        track.addWork(10);
      }

      function afterAddWork(err: any) {
        expect(err).toBeNull();
        expect(track.completed()).toBe(0.5);

        testEvent(track, "change", afterAllWork);
        track.write("ABCDEFGHIJKLMNOPQRST");
      }

      function afterAllWork(err: any) {
        expect(err).toBeNull();
        expect(track.completed()).toBe(1);
        resolve();
      }
    });
  });
});
