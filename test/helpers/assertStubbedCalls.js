import chalk from "chalk";
import stub from "./stub";

function debugCallsLog(expected, num, call) {
  if (process.env.DEBUG_CALLS) {
    num = expected ? chalk.green(num) : chalk.yellow(num);
    call = chalk.gray(call);
    console.log("       ", num, call);
  }
}

function stringifyCall(object, method, args) {
  let str = `${object.name}.${method}(`;
  if (args) str += args.map((a) => JSON.stringify(a)).join(", ") + ", ";
  return str + "...)";
}

export default function assertStubbedCalls(definitions) {
  const expected = [];

  let callCount = 0;

  function stubMethod(object, method) {
    stub(object, method, function(...actualArgs) {
      const currentCount = callCount++;
      const current = expected[currentCount];

      debugCallsLog(false, currentCount, stringifyCall(object, method, actualArgs));
      if (!current) {
        throw new Error(`No call was expected for call ${currentCount} which was ${stringifyCall(object, method, actualArgs)}`);
      }
      debugCallsLog(true, currentCount, stringifyCall(object, method, current.call.args));

      let {args, returns, throws} = current.call;

      try {
        expect(object[method]).toBe(current.object[current.method]);

        for (let a = 0; a < args.length; a++) {
          expect(actualArgs[a]).toEqual(args[a]);
        }
      } catch (err) {
        // prepend JestAssertionError message with useful metadata before re-throwing
        err.message = `Call ${currentCount} of ${object.name}.${method}() has unexpected args!\n\n${err.message}`;
        throw err;
      }

      if (current.opts.nodeCallback) {
        actualArgs[actualArgs.length - 1](throws || null, returns || null);
      } else if (current.opts.valueCallback) {
        actualArgs[actualArgs.length - 1](returns || null);
      } else if (throws) {
        throw throws;
      } else if (returns) {
        return returns;
      }
    });
  }

  for (let d = 0; d < definitions.length; d++) {
    const [object, method, opts, calls] = definitions[d];
    const func = object[method];

    if (!func.__stubbed__) {
      stubMethod(object, method);
    }

    for (let c = 0; c < calls.length; c++) {
      expected.push({
        object: object,
        method: method,
        opts: opts,
        call: calls[c]
      });
    }
  }
}
