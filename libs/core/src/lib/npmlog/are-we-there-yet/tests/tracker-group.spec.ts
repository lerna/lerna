import { TrackerGroup } from "../tracker-group";
import testEvent from "./test-event";

describe("TrackerGroup", () => {
  const name = "test";

  it("initialization", () => {
    const track = new TrackerGroup(name);
    expect(track.completed()).toBe(0);
  });

  it("completion", () => {
    const track = new TrackerGroup(name);
    const todo = 100;
    const a = track.newItem("a", 10, 1);
    const b = track.newItem("b", 10, 1);

    const promise = new Promise<void>((resolve) => {
      testEvent(track, "change", afterFinishEmpty);
      track.finish();

      function afterFinishEmpty(err: any, onChangeName: string, completion: number) {
        expect(err).toBeNull();
        expect(onChangeName).toBe(name);
        expect(completion).toBe(1);
        expect(track.completed()).toBe(1);

        resolve();
      }
    });

    return promise.then(() => {
      const track = new TrackerGroup(name);
      const a = track.newItem("a", 10, 1);
      const b = track.newItem("b", 10, 1);

      const promise = new Promise<void>((resolve) => {
        testEvent(track, "change", afterCompleteWork);
        a.completeWork(5);

        function afterCompleteWork(err: any, onChangeName: string, completion: number) {
          expect(err).toBeNull();
          expect(onChangeName).toBe("a");
          expect(completion).toBe(0.25);
          expect(track.completed()).toBe(0.25);

          resolve();
        }
      });

      return promise.then(() => {
        const promise = new Promise<void>((resolve) => {
          testEvent(track, "change", afterFinishAll);
          track.finish();

          function afterFinishAll(err: any, onChangeName: string, completion: number) {
            expect(err).toBeNull();
            expect(onChangeName).toBe(name);
            expect(completion).toBe(1);
            expect(track.completed()).toBe(1);

            resolve();
          }
        });

        return promise;
      });
    });
  });

  it("add more work", () => {
    const track = new TrackerGroup(name);
    const todo = 100;
    const a = track.newItem("a", 10, 2);
    const b = track.newItem("b", 10, 1);

    const promise = new Promise<void>((resolve) => {
      testEvent(track, "change", afterAddWork);
      a.completeWork(5);

      function afterAddWork(err: any, onChangeName: string, completion: number) {
        expect(err).toBeNull();
        expect(onChangeName).toBe("a");
        expect(Math.floor(completion * 100)).toBe(33);
        expect(Math.floor(track.completed() * 100)).toBe(33);

        resolve();
      }
    });

    return promise.then(() => {
      const promise = new Promise<void>((resolve) => {
        testEvent(track, "change", afterWeightedFinishAll);
        track.finish();

        function afterWeightedFinishAll(err: any, onChangeName: string, completion: number) {
          expect(err).toBeNull();
          expect(onChangeName).toBe(name);
          expect(completion).toBe(1);
          expect(track.completed()).toBe(1);

          resolve();
        }
      });

      return promise;
    });
  });

  it("finish is always 100%", () => {
    const track = new TrackerGroup(name);
    const a = track.newGroup("a", 10);
    const b = track.newGroup("b", 10);
    const a1 = a.newItem("a.1", 10);

    a1.completeWork(5);
    expect(track.completed()).toBe(0.25);

    const promise = new Promise<void>((resolve) => {
      testEvent(track, "change", afterNestedComplete);
      b.finish();

      function afterNestedComplete(err: any, onChangeName: string, completion: number) {
        expect(err).toBeNull();
        expect(onChangeName).toBe("b");
        expect(completion).toBe(0.75);
        expect(track.completed()).toBe(0.75);

        resolve();
      }
    });

    return promise;
  });

  it("cycles", () => {
    const track = new TrackerGroup("top");

    function testCycle(addTo: any, toAdd: any) {
      try {
        addTo.addUnit(toAdd);
        throw new Error("Expected cycle error");
      } catch (ex) {
        console.log(ex);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(ex).toBeInstanceOf(Error);
      }
    }

    testCycle(track, track);
    const layer1 = track.newGroup("layer1");
    testCycle(layer1, track);
    expect(track.debug()).toBe("top: 0\n layer1: 0\n");
  });

  it("should properly handle finish calls when the group contains a stream", () => {
    const track = new TrackerGroup("test");
    track.newStream("test-stream", 100);

    try {
      track.finish();
      expect(true).toBe(true);
    } catch (e) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(false).toBe(true);
    }
  });
});
