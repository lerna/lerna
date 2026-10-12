import inquirer from "inquirer";
import { PassThrough } from "node:stream";
import { promptConfirmation, promptSelectOne, promptTextInput } from "./prompt";

const ENTER = "\r";
const DOWN = "\u001b[B";

/**
 * Route the prompts through the real inquirer, attached to in-memory streams
 * instead of the process TTY, and type the given keys once the prompt renders.
 * Each key goes out on its own tick: the prompt registers its keypress handlers
 * only after the first render, and re-renders between keys.
 */
function typeKeys(...keys: string[]) {
  const input = new PassThrough();
  const output = new PassThrough();

  const typeNext = () => {
    const key = keys.shift();
    if (key !== undefined) {
      input.write(key);
      setImmediate(typeNext);
    }
  };

  output.once("data", () => setImmediate(typeNext));
  output.resume();

  vi.spyOn(inquirer, "prompt").mockImplementation(inquirer.createPromptModule({ input, output }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("promptSelectOne", () => {
  it("resolves the selected choice", async () => {
    typeKeys(DOWN, ENTER);

    const choice = await promptSelectOne("Select one", {
      choices: [
        { value: "first", name: "First" },
        { value: "second", name: "Second" },
      ],
    });

    expect(choice).toBe("second");
  });
});

describe("promptConfirmation", () => {
  it("resolves the confirmed answer", async () => {
    typeKeys("y", ENTER);

    await expect(promptConfirmation("Are you sure?")).resolves.toBe(true);
  });
});

describe("promptTextInput", () => {
  it("resolves the filtered input", async () => {
    typeKeys("beta", ENTER);

    await expect(promptTextInput("Enter an identifier", { filter: (v) => `1.0.0-${v}` })).resolves.toBe(
      "1.0.0-beta"
    );
  });
});
