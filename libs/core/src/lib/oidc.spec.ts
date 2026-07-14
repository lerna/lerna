vi.mock("ci-info", async () => ({
  __esModule: true,
  default: { GITHUB_ACTIONS: false, GITLAB: false, CIRCLE: false },
}));
vi.mock("npm-registry-fetch", async () => ({
  __esModule: true,
  default: { json: vi.fn() },
}));

// mocked modules
import ciInfo from "ci-info";
import npmFetch from "npm-registry-fetch";

// file under test
import { oidc } from "./oidc";

const ci = ciInfo as unknown as { GITHUB_ACTIONS: boolean; GITLAB: boolean; CIRCLE: boolean };
const registryFetchJson = vi.mocked(npmFetch.json);

describe("oidc", () => {
  const registry = "https://registry.npmjs.org/";
  const authTokenKey = "//registry.npmjs.org/:_authToken";
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env["NPM_ID_TOKEN"];
    ci.GITHUB_ACTIONS = false;
    ci.GITLAB = false;
    ci.CIRCLE = false;
    registryFetchJson.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("exchanges the NPM_ID_TOKEN for a registry auth token on CircleCI", async () => {
    ci.CIRCLE = true;
    process.env["NPM_ID_TOKEN"] = "id-token";
    registryFetchJson.mockResolvedValue({ token: "exchanged-token" });

    const opts: any = {};
    const config: any = { set: vi.fn() };

    await oidc({ packageName: "@scope/pkg", registry, opts, config });

    expect(registryFetchJson).toHaveBeenCalledTimes(1);
    const [exchangeUrl, exchangeOpts] = registryFetchJson.mock.calls[0];
    expect(exchangeUrl.toString()).toBe(
      "https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/@scope%2fpkg"
    );
    expect(exchangeOpts).toMatchObject({ method: "POST", [authTokenKey]: "id-token" });
    expect(opts[authTokenKey]).toBe("exchanged-token");
    expect(config.set).toHaveBeenCalledWith(authTokenKey, "exchanged-token", "user");
  });

  it("does not attempt a token exchange outside of a supported CI environment", async () => {
    process.env["NPM_ID_TOKEN"] = "id-token";

    const opts: any = {};
    const config: any = { set: vi.fn() };

    await oidc({ packageName: "@scope/pkg", registry, opts, config });

    expect(registryFetchJson).not.toHaveBeenCalled();
    expect(opts[authTokenKey]).toBeUndefined();
    expect(config.set).not.toHaveBeenCalled();
  });
});
