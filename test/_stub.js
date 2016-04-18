const stubs = [];

afterEach(() => {
  stubs.forEach(release => release());
});

export default function stub(obj, method, fn) {
  const prev = obj[method];
  obj[method] = fn;
  stubs.push(() => obj[method] = prev);
}
