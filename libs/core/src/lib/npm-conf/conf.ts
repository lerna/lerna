/* eslint-disable no-useless-catch */
import assert from "assert";
import fs from "fs";
import path from "path";
import { envReplace } from "./env-replace";
import { findPrefix } from "./find-prefix";
import { parseField } from "./parse-field";
import { toNerfDart } from "./nerf-dart";

// config-chain does not have types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ConfigChain } = require("config-chain");

export class Conf extends ConfigChain {
  root: any;

  // https://github.com/npm/npm/blob/latest/lib/config/core.js#L208-L222
  constructor(base: any) {
    super(base);
    this.root = base;
  }

  // https://github.com/npm/npm/blob/latest/lib/config/core.js#L332-L342
  add(data: any, marker: string) {
    try {
      /* eslint-disable no-param-reassign */
      for (const x of Object.keys(data)) {
        // https://github.com/npm/npm/commit/f0e998d
        const newKey = envReplace(x) as any;
        const newField = parseField(data[x], newKey);

        delete data[x];
        data[newKey] = newField;
      }
      /* eslint-enable no-param-reassign */
    } catch (err) {
      throw err;
    }

    return super.add(data, marker);
  }

  // https://github.com/npm/npm/blob/latest/lib/config/core.js#L312-L325
  addFile(file: any, name = file) {
    const marker = { __source__: name } as any;

    this["sources"][name] = { path: file, type: "ini" };
    this["push"](marker);
    this["_await"]();

    try {
      const contents = fs.readFileSync(file, "utf8");
      this["addString"](contents, file, "ini", marker);
    } catch (err) {
      this["add"]({}, marker);
    }

    return this;
  }

  // https://github.com/npm/npm/blob/latest/lib/config/core.js#L344-L360
  addEnv(env = process.env) {
    const conf: any = {};

    Object.keys(env)
      .filter((x) => /^npm_config_/i.test(x))
      .forEach((x) => {
        if (!env[x]) {
          return;
        }

        // leave first char untouched, even if it is a '_'
        // convert all other '_' to '-'
        const p = x
          .toLowerCase()
          .replace(/^npm_config_/, "")
          .replace(/(?!^)_/g, "-");

        conf[p] = env[x];
      });

    return super.addEnv("", conf, "env");
  }

  // https://github.com/npm/npm/blob/latest/lib/config/load-prefix.js
  loadPrefix() {
    const cli = this["list"][0];

    Object.defineProperty(this, "prefix", {
      enumerable: true,
      set: (prefix) => {
        const g = this["get"]("global");
        this[g ? "globalPrefix" : "localPrefix"] = prefix;
      },
      get: () => {
        const g = this["get"]("global");
        return g ? this["globalPrefix"] : this["localPrefix"];
      },
    });

    Object.defineProperty(this, "globalPrefix", {
      enumerable: true,
      set: (prefix) => {
        this["set"]("prefix", prefix);
      },
      get: () => path.resolve(this["get"]("prefix")),
    });

    let p: any;

    Object.defineProperty(this, "localPrefix", {
      enumerable: true,
      set: (prefix) => {
        p = prefix;
      },
      get: () => p,
    });

    if (Object.prototype.hasOwnProperty.call(cli, "prefix")) {
      p = path.resolve(cli.prefix);
    } else {
      try {
        p = findPrefix(process.cwd());
      } catch (err) {
        throw err;
      }
    }

    return p;
  }

  // https://github.com/npm/npm/blob/latest/lib/config/load-cafile.js
  loadCAFile(file: any) {
    if (!file) {
      return;
    }

    try {
      const contents = fs.readFileSync(file, "utf8");
      const delim = "-----END CERTIFICATE-----";
      const output = contents
        .split(delim)
        .filter((x) => Boolean(x.trim()))
        .map((x) => x.trimLeft() + delim);

      this["set"]("ca", output);
    } catch (err) {
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (err.code === "ENOENT") {
        return;
      }

      throw err;
    }
  }

  // https://github.com/npm/npm/blob/latest/lib/config/set-user.js
  loadUser() {
    const defConf = this.root;

    if (this["get"]("global")) {
      return;
    }

    if (process.env["SUDO_UID"]) {
      defConf.user = Number(process.env["SUDO_UID"]);
      return;
    }

    const prefix = path.resolve(this["get"]("prefix"));

    try {
      const stats = fs.statSync(prefix);
      defConf.user = stats.uid;
    } catch (err) {
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (err.code === "ENOENT") {
        return;
      }

      throw err;
    }
  }

  // https://github.com/npm/npm/blob/24ec9f2/lib/config/get-credentials-by-uri.js
  getCredentialsByURI(uri: string) {
    assert(uri && typeof uri === "string", "registry URL is required");

    const nerfed = toNerfDart(uri);
    const defnerf = toNerfDart(this["get"]("registry"));

    // hidden class micro-optimization
    const c = {
      scope: nerfed,
      token: undefined,
      password: undefined,
      username: undefined,
      email: undefined,
      auth: undefined,
      alwaysAuth: undefined,
    };

    // used to override scope matching for tokens as well as legacy auth
    if (this["get"](`${nerfed}:always-auth`) !== undefined) {
      const val = this["get"](`${nerfed}:always-auth`);

      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      c.alwaysAuth = val === "false" ? false : !!val;
    } else if (this["get"]("always-auth") !== undefined) {
      c.alwaysAuth = this["get"]("always-auth");
    }

    if (this["get"](`${nerfed}:_authToken`)) {
      c.token = this["get"](`${nerfed}:_authToken`);

      // the bearer token is enough, don't confuse things
      return c;
    }

    // Handle the old-style _auth=<base64> style for the default registry, if set.
    let authDef = this["get"]("_auth");
    let userDef = this["get"]("username");
    let passDef = this["get"]("_password");

    if (authDef && !(userDef && passDef)) {
      authDef = Buffer.from(authDef, "base64").toString();
      authDef = authDef.split(":");
      userDef = authDef.shift();
      passDef = authDef.join(":");
    }

    if (this["get"](`${nerfed}:_password`)) {
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      c.password = Buffer.from(this["get"](`${nerfed}:_password`), "base64").toString("utf8");
    } else if (nerfed === defnerf && passDef) {
      c.password = passDef;
    }

    if (this["get"](`${nerfed}:username`)) {
      c.username = this["get"](`${nerfed}:username`);
    } else if (nerfed === defnerf && userDef) {
      c.username = userDef;
    }

    if (this["get"](`${nerfed}:email`)) {
      c.email = this["get"](`${nerfed}:email`);
    } else if (this["get"]("email")) {
      c.email = this["get"]("email");
    }

    if (c.username && c.password) {
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      c.auth = Buffer.from(`${c.username}:${c.password}`).toString("base64");
    }

    return c;
  }

  // https://github.com/npm/npm/blob/24ec9f2/lib/config/set-credentials-by-uri.js
  setCredentialsByURI(uri: any, c: any) {
    assert(uri && typeof uri === "string", "registry URL is required");
    assert(c && typeof c === "object", "credentials are required");

    const nerfed = toNerfDart(uri);

    if (c.token) {
      this["set"](`${nerfed}:_authToken`, c.token, "user");
      this["del"](`${nerfed}:_password`, "user");
      this["del"](`${nerfed}:username`, "user");
      this["del"](`${nerfed}:email`, "user");
      this["del"](`${nerfed}:always-auth`, "user");
    } else if (c.username || c.password || c.email) {
      assert(c.username, "must include username");
      assert(c.password, "must include password");
      assert(c.email, "must include email address");

      this["del"](`${nerfed}:_authToken`, "user");

      const encoded = Buffer.from(c.password, "utf8").toString("base64");

      this["set"](`${nerfed}:_password`, encoded, "user");
      this["set"](`${nerfed}:username`, c.username, "user");
      this["set"](`${nerfed}:email`, c.email, "user");

      if (c.alwaysAuth !== undefined) {
        this["set"](`${nerfed}:always-auth`, c.alwaysAuth, "user");
      } else {
        this["del"](`${nerfed}:always-auth`, "user");
      }
    } else {
      throw new Error("No credentials to set.");
    }
  }
}
