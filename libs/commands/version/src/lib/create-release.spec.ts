import { truncateReleaseBody } from "./create-release";

describe("truncateReleaseBody", () => {
  const generateRandomString = (length: number): string => {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
  };

  it("should not truncate when body length is within limit for GitHub", () => {
    const body = generateRandomString(124999);
    const truncatedBody = truncateReleaseBody(body, "github");
    expect(truncatedBody).toBe(body);
  });

  it("should not truncate when body length is within limit for GitLab", () => {
    const body = generateRandomString(999999);
    const truncatedBody = truncateReleaseBody(body, "gitlab");
    expect(truncatedBody).toBe(body);
  });

  it("should truncate when body length exceeds limit for GitHub", () => {
    const body = generateRandomString(125001);
    const truncatedBody = truncateReleaseBody(body, "github");
    expect(truncatedBody.length).toBe(125000);
    expect(truncatedBody.endsWith("...")).toBe(true);
  });

  it("should truncate when body length exceeds limit for GitLab", () => {
    const body = generateRandomString(1000001);
    const truncatedBody = truncateReleaseBody(body, "gitlab");
    expect(truncatedBody.length).toBe(1000000);
    expect(truncatedBody.endsWith("...")).toBe(true);
  });

  it("should return the body as is when type is undefined", () => {
    const body = generateRandomString(150000);
    const truncatedBody = truncateReleaseBody(body);
    expect(truncatedBody).toBe(body);
  });
});
