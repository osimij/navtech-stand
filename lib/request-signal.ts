// A request signal that aborts with `signal` or after `ms`, whichever comes first.
// AbortSignal.any arrived in Chrome 116, and a booth panel can run an older Chrome that never updates. Without it
// every save and request failed there as if offline, so older browsers get the same behaviour by hand.
export function requestSignal(ms: number, signal?: AbortSignal): AbortSignal {
  const native = typeof AbortSignal.any === "function" && typeof AbortSignal.timeout === "function";
  if (native) return signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms);
  const controller = new AbortController();
  const follow = () => { clearTimeout(timer); controller.abort(signal?.reason); };
  const timer = setTimeout(() => {
    signal?.removeEventListener("abort", follow);
    controller.abort(new DOMException("The operation timed out.", "TimeoutError"));
  }, ms);
  if (signal?.aborted) follow();
  else signal?.addEventListener("abort", follow, { once: true });
  return controller.signal;
}
