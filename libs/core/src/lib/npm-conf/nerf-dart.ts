import url from "url";

// https://github.com/npm/npm/blob/0cc9d89/lib/config/nerf-dart.js
export function toNerfDart(uri: string) {
  const parsed = url.parse(uri) as any;

  delete parsed.protocol;
  delete parsed.auth;
  delete parsed.query;
  delete parsed.search;
  delete parsed.hash;

  return url.resolve(url.format(parsed), ".");
}
