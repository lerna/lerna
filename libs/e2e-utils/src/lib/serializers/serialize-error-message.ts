import type { SnapshotSerializer } from "vitest";

/**
 * Vitest passes thrown Error objects to snapshot serializers, whereas jest
 * passed the message string. Unwrap the message and re-dispatch it through the
 * serializer chain so that each suite's own string-based serializer (path and
 * environment normalization) still applies to snapshotted errors.
 *
 * Registered for every e2e project via defineLernaE2eVitestConfig.
 */
const errorMessageSerializer: SnapshotSerializer = {
  test: (thing: unknown) => thing instanceof Error,
  serialize: (thing, config, indentation, depth, refs, printer) =>
    printer((thing as Error).message, config, indentation, depth, refs),
};

export default errorMessageSerializer;
