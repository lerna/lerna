// Take a dep like "foo@^1.0.0".
// Return a tuple like ["foo", "^1.0.0"].
// Handles scoped packages.
// Returns undefined for version if none specified.
export default function splitVersion(dep) {
  return dep.match(/^(@?[^@]+)(?:@(.+))?/).slice(1, 3);
}
