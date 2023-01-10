import log from "npmlog";

let pulsers = 0;
let pulse: NodeJS.Timer;

function pulseStart(prefix: any) {
  pulsers += 1;

  if (pulsers > 1) {
    return;
  }

  pulse = setInterval(() => log["gauge"].pulse(prefix), 150);
}

function pulseStop() {
  pulsers -= 1;

  if (pulsers > 0) {
    return;
  }

  clearInterval(pulse);
}

export function pulseTillDone(prefix: string, promise: any) {
  if (!promise) {
    /* eslint-disable no-param-reassign */
    promise = prefix;
    prefix = "";
    /* eslint-enable no-param-reassign */
  }

  pulseStart(prefix);

  return Promise.resolve(promise).then(
    (val) => {
      pulseStop();
      return val;
    },
    (err) => {
      pulseStop();
      throw err;
    }
  );
}
