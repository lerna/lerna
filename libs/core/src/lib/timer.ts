export function timer() {
  /* istanbul ignore if */
  if (process.env.LERNA_INTEGRATION) {
    return () => 0;
  }

  const startMillis = Date.now();
  return () => Date.now() - startMillis;
}
