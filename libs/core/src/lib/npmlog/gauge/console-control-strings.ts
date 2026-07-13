/* eslint-disable */
// @ts-nocheck

/**
 * ANSI/VT100 terminal control strings.
 * Inlined from deprecated package https://github.com/iarna/console-control-strings
 */

"use strict";

const prefix = "\x1b[";

export function up(num?: number): string {
  return prefix + (num || "") + "A";
}

export function down(num?: number): string {
  return prefix + (num || "") + "B";
}

export function forward(num?: number): string {
  return prefix + (num || "") + "C";
}

export function back(num?: number): string {
  return prefix + (num || "") + "D";
}

export function nextLine(num?: number): string {
  return prefix + (num || "") + "E";
}

export function previousLine(num?: number): string {
  return prefix + (num || "") + "F";
}

export function horizontalAbsolute(num: number): string {
  if (num == null) throw new Error("horizontalAbsolute requires a column to position to");
  return prefix + num + "G";
}

export function eraseData(): string {
  return prefix + "J";
}

export function eraseLine(): string {
  return prefix + "K";
}

export function goto(x: number, y: number): string {
  return prefix + y + ";" + x + "H";
}

export function gotoSOL(): string {
  return "\r";
}

export function beep(): string {
  return "\x07";
}

export function hideCursor(): string {
  return prefix + "?25l";
}

export function showCursor(): string {
  return prefix + "?25h";
}

const colors: Record<string, number> = {
  reset: 0,
  bold: 1,
  italic: 3,
  underline: 4,
  inverse: 7,
  stopBold: 22,
  stopItalic: 23,
  stopUnderline: 24,
  stopInverse: 27,
  white: 37,
  black: 30,
  blue: 34,
  cyan: 36,
  green: 32,
  magenta: 35,
  red: 31,
  yellow: 33,
  bgWhite: 47,
  bgBlack: 40,
  bgBlue: 44,
  bgCyan: 46,
  bgGreen: 42,
  bgMagenta: 45,
  bgRed: 41,
  bgYellow: 43,
  grey: 90,
  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,
  bgGrey: 100,
  bgBrightBlack: 100,
  bgBrightRed: 101,
  bgBrightGreen: 102,
  bgBrightYellow: 103,
  bgBrightBlue: 104,
  bgBrightMagenta: 105,
  bgBrightCyan: 106,
  bgBrightWhite: 107,
};

function colorNameToCode(name: string): number {
  if (colors[name] != null) return colors[name];
  throw new Error("Unknown color or style name: " + name);
}

export function color(...args: (string | string[])[]): string {
  const colorWith = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  return prefix + colorWith.map(colorNameToCode).join(";") + "m";
}
