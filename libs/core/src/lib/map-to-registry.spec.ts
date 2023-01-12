import { mapToRegistry } from "./map-to-registry";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const npmConf = require("./npm-conf");

// override value provided by @lerna/test-helpers/src/lib/npm/set-npm-userconfig, ensuring blank slate
process.env.npm_config_userconfig = __dirname;

describe("@lerna/map-to-registry", () => {
  describe("uri", () => {
    test("package name", () => {
      const config = npmConf();
      const result = mapToRegistry("foo", config);

      expect(result).toMatchObject({
        uri: "https://registry.npmjs.org/foo",
        auth: {
          scope: "//registry.npmjs.org/",
          alwaysAuth: false,
        },
      });
    });

    test("scoped package name", () => {
      const config = npmConf();
      const result = mapToRegistry("@scope/bar", config);

      expect(result).toMatchObject({
        uri: "https://registry.npmjs.org/@scope%2fbar",
      });
    });

    test("scoped package name with scoped registry", () => {
      const config = npmConf({
        "@scope:registry": "https://private.npm-enterprise.com:1234/",
      });
      const result = mapToRegistry("@scope/bar", config);

      expect(result).toMatchObject({
        uri: "https://private.npm-enterprise.com:1234/@scope%2fbar",
        auth: {
          scope: "//private.npm-enterprise.com:1234/",
        },
      });
    });

    test("scoped config", () => {
      const config = npmConf({
        scope: "@scope",
        "@scope:registry": "https://private.npm-enterprise.com:1234/",
      });
      const result = mapToRegistry("foo", config);

      expect(result).toMatchObject({
        uri: "https://private.npm-enterprise.com:1234/foo",
      });
    });

    test("remote package", () => {
      const config = npmConf();
      const result = mapToRegistry("http://foo.com/bar.tgz", config);

      expect(result).toMatchObject({
        uri: "http://foo.com/bar.tgz",
        auth: {
          scope: "//registry.npmjs.org/",
        },
      });
    });
  });

  describe("auth", () => {
    test("always-auth = true", () => {
      const config = npmConf({
        "always-auth": "true",
      });
      const result = mapToRegistry("foo", config);
      const nerfed = mapToRegistry("foo", config.set("//registry.npmjs.org/:always-auth", true));

      expect(result.auth).toMatchObject({
        alwaysAuth: true,
      });
      expect(nerfed.auth).toEqual(result.auth);
    });

    test("bearer token", () => {
      const config = npmConf({
        "//registry.npmjs.org/:_authToken": "deadbeef",
      });
      const result = mapToRegistry("foo", config);

      expect(result.auth).toMatchObject({
        token: "deadbeef",
      });
    });

    test("otp", () => {
      const config = npmConf({
        "//registry.npmjs.org/:_authToken": "deadbeef",
        otp: "123456",
      });
      const result = mapToRegistry("foo", config);

      expect(result.auth).toMatchObject({
        otp: "123456",
      });
    });

    test("username + password", () => {
      const config = npmConf({
        username: "dead",
        _password: "beef",
      });
      const result = mapToRegistry("foo", config);
      const nerfed = mapToRegistry(
        "foo",
        config
          .set("//registry.npmjs.org/:username", "dead")
          .set("//registry.npmjs.org/:_password", "YmVlZg==")
      );

      expect(result.auth).toMatchObject({
        auth: "ZGVhZDpiZWVm",
        username: "dead",
        password: "beef",
      });
      expect(nerfed.auth).toEqual(result.auth);
    });

    test("email", () => {
      const config = npmConf({
        email: "beef@cow.org",
      });
      const result = mapToRegistry("foo", config);
      const nerfed = mapToRegistry("foo", config.set("//registry.npmjs.org/:email", "beef@cow.org"));

      expect(result.auth).toMatchObject({
        email: "beef@cow.org",
      });
      expect(nerfed.auth).toEqual(result.auth);
    });

    test("legacy _auth=<base64>", () => {
      const config = npmConf({
        _auth: "ZGVhZDpiZWVm",
      });
      const result = mapToRegistry("foo", config);
      const ignore = mapToRegistry("foo", config.set("username", "cafe"));

      expect(result.auth).toMatchObject({
        auth: "ZGVhZDpiZWVm",
        username: "dead",
        password: "beef",
      });
      expect(ignore.auth).toEqual(result.auth);
    });

    test("differing request and registry host", () => {
      const config = npmConf({
        "//registry.npmjs.org/:_authToken": "deadbeef",
      });
      const result = mapToRegistry("http://foo.com/bar.tgz", config);
      const always = mapToRegistry("http://foo.com/bar.tgz", config.set("always-auth", true));

      expect(result.auth).toMatchObject({
        scope: "//registry.npmjs.org/",
        token: undefined,
      });
      expect(always.auth).toMatchObject({
        token: "deadbeef",
      });
    });

    test("username _without_ password", () => {
      const config = npmConf({
        username: "no-auth-for-you",
      });
      const result = mapToRegistry("foo", config);

      expect(result.auth).toEqual({
        scope: "//registry.npmjs.org/",
        email: undefined,
        alwaysAuth: false,
        token: undefined,
        username: undefined,
        password: undefined,
        auth: undefined,
      });
    });
  });

  describe("normalizes", () => {
    test("registry trailing slash", () => {
      const config = npmConf({
        registry: "http://no-trailing-slash.com",
      });
      const result = mapToRegistry("foo", config);

      expect(result).toMatchObject({
        uri: "http://no-trailing-slash.com/foo",
      });
    });

    test("--scope argument", () => {
      const config = npmConf({
        scope: "scope",
        // scoped registry is missing, however
      });
      const result = mapToRegistry("foo", config);

      expect(result).toMatchObject({
        uri: "https://registry.npmjs.org/foo",
      });
    });
  });
});
