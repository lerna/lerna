// for mocking the behaviour of methods that accept a callback
export default function callsBack(err, val) {
  return (...args) => args.pop()(err, val);
}
