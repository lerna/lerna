import npa from "npm-package-arg";
import log from "npmlog";
import url from "url";

// https://github.com/npm/npm/blob/f644018/lib/utils/map-to-registry.js
export function mapToRegistry(
  name: string,
  config: { get: (arg0: string) => any; getCredentialsByURI: (arg0: any) => any }
) {
  log.silly("mapToRegistry", "name", name);
  let registry;

  // the name itself takes precedence
  const data = npa(name);

  if (data.scope) {
    // the name is definitely scoped, so escape now
    name = name.replace("/", "%2f"); // eslint-disable-line no-param-reassign

    log.silly("mapToRegistry", "scope (from package name)", data.scope);

    registry = config.get(`${data.scope}:registry`);

    if (!registry) {
      log.verbose("mapToRegistry", "no registry URL found in name for scope", data.scope);
    }
  }

  // ...then --scope=@scope or --scope=scope
  let scope = config.get("scope");

  if (!registry && scope) {
    // I'm an enabler, sorry
    if (scope.charAt(0) !== "@") {
      scope = `@${scope}`;
    }

    log.silly("mapToRegistry", "scope (from config)", scope);

    registry = config.get(`${scope}:registry`);

    if (!registry) {
      log.verbose("mapToRegistry", "no registry URL found in config for scope", scope);
    }
  }

  // ...and finally use the default registry
  if (!registry) {
    log.silly("mapToRegistry", "using default registry");
    registry = config.get("registry");
  }

  log.silly("mapToRegistry", "registry", registry);

  const credentials = config.getCredentialsByURI(registry);

  // normalize registry URL so resolution doesn't drop a piece of registry URL
  const normalized = registry.slice(-1) !== "/" ? `${registry}/` : registry;
  let uri;

  log.silly("mapToRegistry", "data", data);

  if (data.type === "remote") {
    uri = data.fetchSpec;
  } else {
    uri = url.resolve(normalized, name);
  }

  log.silly("mapToRegistry", "uri", uri);

  const auth = scopeAuth(uri, registry, credentials, config);

  return { uri, auth };
}

function scopeAuth(
  uri: string | null,
  registry: string,
  auth: {
    scope: any;
    email: any;
    alwaysAuth: any;
    token: undefined;
    auth: undefined;
    username: undefined;
    password: undefined;
  },
  config: { get: any; getCredentialsByURI?: (arg0: any) => any }
) {
  const cleaned: {
    scope: any;
    email: any;
    alwaysAuth: any;
    token: undefined;
    username: undefined;
    password: undefined;
    auth: undefined;
    otp?: any;
  } = {
    scope: auth.scope,
    email: auth.email,
    alwaysAuth: auth.alwaysAuth,
    token: undefined,
    username: undefined,
    password: undefined,
    auth: undefined,
  };

  if (auth.token || auth.auth || (auth.username && auth.password)) {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const requestHost = url.parse(uri).hostname;
    const registryHost = url.parse(registry).hostname;

    if (requestHost === registryHost) {
      cleaned.token = auth.token;
      cleaned.auth = auth.auth;
      cleaned.username = auth.username;
      cleaned.password = auth.password;
    } else if (auth.alwaysAuth) {
      log.verbose("scopeAuth", "alwaysAuth set for", registry);
      cleaned.token = auth.token;
      cleaned.auth = auth.auth;
      cleaned.username = auth.username;
      cleaned.password = auth.password;
    } else {
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      log.silly("scopeAuth", uri, "doesn't share host with registry", registry);
    }

    if (config.get("otp")) {
      cleaned.otp = config.get("otp");
    }
  }

  return cleaned;
}
