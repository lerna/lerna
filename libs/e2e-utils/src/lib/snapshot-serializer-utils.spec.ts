import { normalizeCommandOutput } from "./snapshot-serializer-utils";

afterEach(() => vi.unstubAllEnvs());

describe("normalizeEnvironment", () => {
  it("removes pnpm's package.json workspace warning", async () => {
    vi.resetModules();
    vi.stubEnv("E2E_ROOT", "/tmp/lerna-e2e");
    const { normalizeEnvironment } = await import("./snapshot-serializer-utils");

    expect(
      normalizeEnvironment(
        'WARN\u2009 The "workspaces" field in package.json is not supported by pnpm. Create a "pnpm-workspace.yaml" file instead.\nlerna success'
      )
    ).toBe("lerna success");
  });
});

describe("normalizeCommandOutput", () => {
  it("removes terminal styling before trimming lines", () => {
    const output =
      "\u001B[7m\u001B[1m\u001B[32m Lerna (powered by Nx) \u001B[39m\u001B[22m\u001B[27m  Successfully ran target";

    expect(normalizeCommandOutput(output)).toBe("Lerna (powered by Nx)   Successfully ran target");
  });

  it("removes the non-deterministic Nx performance report", () => {
    const output = `task output

Run duration:      250ms
Cache:             0/1 hit (0%)
Critical path:     247ms (1 task)
Recoverable time:  <1ms

Recommendations:
- Drastically reduce your run duration by sharing a cache across your team and CI
- package-X:log-env-var    247ms`;

    expect(normalizeCommandOutput(output)).toBe("task output");
  });
});
