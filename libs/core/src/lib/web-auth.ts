/**
 * Web-based two-factor authentication ("web OTP") for registry requests.
 *
 * When an npm account uses a security key / passkey (WebAuthn) instead of an authenticator app,
 * the registry cannot be satisfied with a typed one-time password. Instead, the EOTP error it
 * returns carries an `authUrl` (to be opened in a browser, where the user completes the challenge)
 * and a `doneUrl` (to be polled until it yields a token that can be sent as the `otp` on a retry).
 *
 * Adapted from:
 * - https://github.com/npm/cli/blob/latest/lib/utils/auth.js (otplease)
 * - https://github.com/npm/npm-profile/blob/main/lib/index.js (webAuthOpener / webAuthCheckLogin)
 */

import childProcess from "node:child_process";
import fetch, { FetchOptions } from "npm-registry-fetch";
import log from "./npmlog";

export interface WebAuthChallenge {
  authUrl: string;
  doneUrl: string;
}

/**
 * Delay between polls of the `doneUrl` when the registry does not send a `retry-after` header.
 */
const DEFAULT_RETRY_DELAY_MS = 1000;

/**
 * If the given error is an EOTP error whose body carries a web-auth challenge
 * (as produced by npm-registry-fetch when the registry requires a security key),
 * return that challenge. Otherwise return `undefined`.
 */
export function getWebAuthChallenge(err: unknown): WebAuthChallenge | undefined {
  const { code, body } = (err ?? {}) as { code?: unknown; body?: unknown };

  if (code !== "EOTP" || body == null || typeof body !== "object") {
    return undefined;
  }

  const { authUrl, doneUrl } = body as { authUrl?: unknown; doneUrl?: unknown };

  if (!isHttpUrl(authUrl) || !isHttpUrl(doneUrl)) {
    return undefined;
  }

  return { authUrl, doneUrl };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * Complete a web-auth challenge: direct the user to `authUrl`, then poll `doneUrl`
 * until the registry hands back a token. The token is used as the `otp` on the retried request.
 *
 * @param challenge The `authUrl` / `doneUrl` pair from the EOTP error body
 * @param opts The registry fetch options of the request that failed (registry, auth, etc)
 */
export async function getWebAuthOneTimePassword(
  { authUrl, doneUrl }: WebAuthChallenge,
  opts: Record<string, unknown>
): Promise<string> {
  log.notice("", "This operation requires two-factor authentication. Authenticate your account at:");
  log.notice("", authUrl);

  // Opening the browser is best-effort: the URL has already been printed, so a missing or
  // failing opener (e.g. an SSH session) must not prevent the user from completing the challenge.
  openInBrowser(authUrl, opts["browser"]);

  return pollForToken(doneUrl, opts);
}

/**
 * Open a URL with the user's default browser, honouring the npm `browser` config:
 * `false` disables opening entirely, a string is used as the opener command,
 * anything else uses the platform default (`open`, `start`, or `xdg-open`).
 *
 * This is deliberately fire-and-forget:
 * - the child is unref'd so that an opener which stays in the foreground (as `xdg-open` may when it has to
 *   launch the browser itself) cannot keep lerna alive after publishing has finished
 * - failures are only logged, and never affect `process.exitCode`. `@lerna/child-process` is intentionally not
 *   used here because it propagates a child's non-zero exit status onto `process.exitCode`, which would turn an
 *   otherwise successful publish into a failed lerna run whenever no opener is available (SSH, containers, CI).
 */
function openInBrowser(url: string, browser: unknown): void {
  if (browser === false) {
    return;
  }

  const onError = (err: unknown) => {
    log.verbose("web-auth", `Unable to open browser automatically: ${(err as Error)?.message || err}`);
  };

  // URLs are only ever passed through as a single argument, so escape anything that could be
  // interpreted by a shell (`"` etc) - the registry URL is expected to already be well-formed.
  const target = encodeURI(url);

  try {
    const child =
      typeof browser === "string"
        ? childProcess.spawn(browser, [target], { stdio: "ignore", windowsHide: true })
        : process.platform === "win32"
          ? // `start` is a cmd.exe builtin, so a shell is required. The empty quoted first argument is the
            // window title, without which `start` would treat the URL as the title.
            childProcess.spawn("start", ['""', `"${target}"`], {
              shell: true,
              stdio: "ignore",
              windowsHide: true,
            })
          : childProcess.spawn(process.platform === "darwin" ? "open" : "xdg-open", [target], {
              stdio: "ignore",
            });

    child.on("error", onError);
    child.on("exit", (code) => {
      if (code) {
        onError(new Error(`opener exited with code ${code}`));
      }
    });
    child.unref();
  } catch (err) {
    onError(err);
  }
}

async function pollForToken(doneUrl: string, opts: Record<string, unknown>): Promise<string> {
  while (true) {
    // the done endpoint must never be served from the local http cache
    const res = await fetch(doneUrl, { ...opts, method: "GET", cache: false } as unknown as FetchOptions);

    if (res.status === 200) {
      const content = (await res.json()) as { token?: unknown };

      if (typeof content?.token !== "string" || !content.token) {
        throw new Error(`Invalid response from ${doneUrl}: expected a token`);
      }

      return content.token;
    }

    if (res.status === 202) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const delay =
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : DEFAULT_RETRY_DELAY_MS;

      log.silly("web-auth", `authentication pending, retrying in ${delay}ms`);
      await sleep(delay);
      continue;
    }

    throw new Error(`Invalid response from ${doneUrl}: unexpected status ${res.status}`);
  }
}
