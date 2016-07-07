// flow-typed signature: 8b6033b5819a3a673af1c5a1c7b81722
// flow-typed version: 94e9f7e0a4/pad_v1.x.x/flow_>=v0.27.x

type $npm$pad$options = {
  char?: string,
  colors?: boolean,
  strip?: boolean
};

declare module "pad" {
  declare function exports(
    textOrLeftPadding: string|number,
    textOrRightPadding: string|number,
    charOrOptions: ?string|$npm$pad$options
  ): string;
}
