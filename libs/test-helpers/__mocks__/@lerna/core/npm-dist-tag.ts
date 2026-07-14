import { vi } from "vitest";

export const add = vi.fn(() => Promise.resolve());
export const list = vi.fn(() => Promise.resolve({}));
export const remove = vi.fn(() => Promise.resolve());
