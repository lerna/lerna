jest.mock("@lerna/prompt");
const otplease = require("..")
const prompt = require("@lerna/prompt");

describe("@lerna/otplease", () => {
    let savedIsTTY;
    beforeAll(() => {
        savedIsTTY = [process.stdin.isTTY, process.stdout.isTTY];
        process.stdin.isTTY = true;
        process.stdout.isTTY = true;
    })
    afterAll(() => {
        process.stdin.isTTY = savedIsTTY[0];
        process.stdout.isTTY = savedIsTTY[1];
    });

    it("no error", () => {
        const obj = {};
        const fn = jest.fn(() => obj);
        prompt.input.mockResolvedValue("123456");
        return otplease(fn, {}).then(result => {
            expect(fn).toBeCalled();
            expect(prompt.input).not.toBeCalled();
            expect(result).toBe(obj);
        });
    });
    it("request otp", () => {
        const obj = {};
        const fn = jest.fn(makeTestCallback("123456", obj));
        prompt.input.mockResolvedValue("123456");
        return otplease(fn, {}).then(result => {
            expect(fn).toBeCalledTimes(2);
            expect(prompt.input).toBeCalled();
            expect(result).toBe(obj);
        });
    });
    it("request otp updates cache", () => {
        const otpCache = { otp: undefined };
        const obj = {};
        const fn = jest.fn(makeTestCallback("123456", obj));
        prompt.input.mockResolvedValue("123456");
        return otplease(fn, {}, otpCache).then(result => {
            expect(fn).toBeCalledTimes(2);
            expect(prompt.input).toBeCalled();
            expect(result).toBe(obj);
            expect(otpCache.otp).toBe("123456");
        });
    });
    it("uses cache if opts does not have own otp", () => {
        const otpCache = { otp: "654321" };
        const obj = {};
        const fn = jest.fn(makeTestCallback("654321", obj));
        prompt.input.mockResolvedValue("123456");
        return otplease(fn, {}, otpCache).then(result => {
            expect(fn).toBeCalledTimes(1);
            expect(prompt.input).not.toBeCalled();
            expect(result).toBe(obj);
            expect(otpCache.otp).toBe("654321");
        });
    });
    it("uses explicit otp regardless of cache value", () => {
        const otpCache = { otp: "654321" };
        const obj = {};
        const fn = jest.fn(makeTestCallback("987654", obj));
        prompt.input.mockResolvedValue("123456");
        return otplease(fn, { otp: "987654" }, otpCache).then(result => {
            expect(fn).toBeCalledTimes(1);
            expect(prompt.input).not.toBeCalled();
            expect(result).toBe(obj);
            expect(otpCache.otp).toBe("654321"); // do not replace cache
        });
    });
    it("using cache updated in a different task", () => {
        const otpCache = { otp: undefined };
        const obj = {};
        const fn = jest.fn(makeTestCallback("654321", obj));
        prompt.input.mockResolvedValue("123456");

        // enqueue a promise resolution to update the otp at the start of the next turn.
        Promise.resolve().then(() => { otpCache.otp = "654321"; });

        // start intial otplease call, 'catch' will happen in next turn *after* the cache is set.
        return otplease(fn, {}, otpCache).then(result => {
            expect(fn).toBeCalledTimes(2);
            expect(prompt.input).not.toBeCalled();
            expect(result).toBe(obj);
        });
    });
    it("semaphore prevents overlapping requests for OTP", () => {
        const otpCache = { otp: undefined };
        prompt.input.mockResolvedValue("123456");

        // overlapped calls to otplease that share an otpCache should
        // result in the user only being prompted *once* for an OTP.
        const obj1 = {};
        const fn1 = jest.fn(makeTestCallback("123456", obj1));
        const p1 = otplease(fn1, {}, otpCache);

        const obj2 = {};
        const fn2 = jest.fn(makeTestCallback("123456", obj2));
        const p2 = otplease(fn2, {}, otpCache);

        return Promise.all([p1, p2]).then(res => {
            expect(fn1).toBeCalledTimes(2);
            expect(fn2).toBeCalledTimes(2);
            expect(prompt.input).toBeCalledTimes(1); // only called once for the two concurrent requests
            expect(res[0]).toBe(obj1);
            expect(res[1]).toBe(obj2);
        });
    });
})

function makeTestCallback(otp, result) {
    return opts => {
        if (opts.otp !== otp) throw { code: "EOTP" };
        return result;
    };
}