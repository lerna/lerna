import assert from "assert";
import chalk from "chalk";
import stub from "./_stub";

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
        assert.equal(object[method], current.object[current.method]);

        for (let a = 0; a < args.length; a++) {
          assert.deepEqual(actualArgs[a], args[a]);
        }
      } catch (err) {
        throw new Error(
          `Call ${currentCount} was expected to be: ${stringifyCall(current.object, current.method, args)}, ` +
          `but was actually: ${stringifyCall(object, method, actualArgs)}.`
        );
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
