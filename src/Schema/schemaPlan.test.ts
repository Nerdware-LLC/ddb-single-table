import { getSchemaPlan, snapshotSchema } from "./schemaPlan.js";

describe("schema audit regressions", () => {
  test("snapshots schema configs and caches plans without making mutable schemas stale", () => {
    const mutable = { a: { type: "string", default: "a" } } as const;
    const snapshot = snapshotSchema(mutable);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(getSchemaPlan(snapshot)).toBe(getSchemaPlan(snapshot));
    expect(getSchemaPlan(mutable)).not.toBe(getSchemaPlan(mutable));
    expect(snapshot).not.toBe(mutable);
  });
});
