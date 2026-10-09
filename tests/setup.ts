// Must run before any module reads it: no simulated latency in tests.
process.env.NEXT_PUBLIC_MOCK_LATENCY_MS = "0";

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// next/navigation must be mocked before any component module loads, so it lives here.
const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));
(globalThis as { __routerPush?: typeof routerPush }).__routerPush = routerPush;

// jsdom gaps that Radix / our components touch.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
Element.prototype.hasPointerCapture = vi.fn(() => false);
Element.prototype.releasePointerCapture = vi.fn();

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
