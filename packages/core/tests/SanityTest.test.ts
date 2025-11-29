import * as core from "../src";

test("core exports sanity", () => {
  expect(core.scan).toBeDefined();
  expect(core.parse).toBeDefined();
});

describe('UMD Global', () => {
  it('exposes exports', () => {
    const scanner = global.lightningflowscanner;
    expect(scanner).toBeDefined();
    expect(typeof scanner.scan).toBe('function');
    expect(scanner.Flow).toBeDefined();
  });
});