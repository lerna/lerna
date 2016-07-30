const stubs = [];

afterEach(() => {
  stubs.forEach((release) => release());
});

export default function stub(obj, method, fn) {
  const prev = obj[method];
  obj[method] = fn;
  fn.__stubbed__ = true;
  stubs.push(() => obj[method] = prev);
}
