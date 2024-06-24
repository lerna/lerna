/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Adapted from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b/lib/index.js
 */

import onExit from "signal-exit";

const hasUnicode = require("has-unicode");

const Plumbing = require("./plumbing");
const hasColor = require("./has-color");
const defaultThemes = require("./themes");
const setInterval = require("./set-interval");
const process = require("./process");
const setImmediate = require("./set-immediate");

function callWith(obj: any, method: () => any) {
  return function () {
    return method.call(obj);
  };
}

interface GaugeOptions {
  hideCursor?: boolean;
  fixedFramerate?: boolean;
  updateInterval?: number;
  themes?: any;
  theme?: any;
  template?: any;
  tty?: any;
  Plumbing?: any;
  cleanupOnExit?: boolean;
  enabled?: boolean;
}

interface Status {
  spun: number;
  section: string;
  subsection: string;
  completed?: number;
}

export class Gauge {
  private _status: Status;
  private _paused: boolean;
  private _disabled: boolean;
  private _showing: boolean;
  private _onScreen: boolean;
  private _needsRedraw: boolean;
  private _hideCursor: boolean;
  private _fixedFramerate: boolean;
  private _lastUpdateAt: number | null;
  private _updateInterval: number;
  private _themes: any;
  private _theme: any;
  private _gauge: any;
  private _tty: any;
  private _writeTo: any;
  private _$$doRedraw: () => void;
  private _$$handleSizeChange: () => void;
  private _cleanupOnExit: boolean;
  private _removeOnExit: (() => void) | null;
  private redrawTracker: any;

  constructor(arg1?: any, arg2?: any) {
    let options: GaugeOptions, writeTo: any;
    if (arg1 && arg1.write) {
      writeTo = arg1;
      options = arg2 || {};
    } else if (arg2 && arg2.write) {
      writeTo = arg2;
      options = arg1 || {};
    } else {
      writeTo = process.stderr;
      options = arg1 || arg2 || {};
    }

    this._status = {
      spun: 0,
      section: "",
      subsection: "",
    };
    this._paused = false;
    this._disabled = true;
    this._showing = false;
    this._onScreen = false;
    this._needsRedraw = false;
    this._hideCursor = options.hideCursor == null ? true : options.hideCursor;
    this._fixedFramerate =
      options.fixedFramerate == null ? !/^v0\.8\./.test(process.version) : options.fixedFramerate;
    this._lastUpdateAt = null;
    this._updateInterval = options.updateInterval == null ? 50 : options.updateInterval;

    this._themes = options.themes || defaultThemes;
    this._theme = options.theme;
    const theme = this._computeTheme(options.theme);
    const template = options.template || [
      { type: "progressbar", length: 20 },
      { type: "activityIndicator", kerning: 1, length: 1 },
      { type: "section", kerning: 1, default: "" },
      { type: "subsection", kerning: 1, default: "" },
    ];
    this.setWriteTo(writeTo, options.tty);
    const PlumbingClass = options.Plumbing || Plumbing;
    this._gauge = new PlumbingClass(theme, template, this.getWidth());

    this._$$doRedraw = callWith(this, this._doRedraw);
    this._$$handleSizeChange = callWith(this, this._handleSizeChange);

    this._cleanupOnExit = options.cleanupOnExit == null || options.cleanupOnExit;
    this._removeOnExit = null;

    if (options.enabled || (options.enabled == null && this._tty && this._tty.isTTY)) {
      this.enable();
    } else {
      this.disable();
    }
  }

  isEnabled(): boolean {
    return !this._disabled;
  }

  setTemplate(template: any) {
    this._gauge.setTemplate(template);
    if (this._showing) {
      this._requestRedraw();
    }
  }

  private _computeTheme(theme: any) {
    if (!theme) {
      theme = {};
    }
    if (typeof theme === "string") {
      theme = this._themes.getTheme(theme);
    } else if (Object.keys(theme).length === 0 || theme.hasUnicode != null || theme.hasColor != null) {
      const useUnicode = theme.hasUnicode == null ? hasUnicode() : theme.hasUnicode;
      const useColor = theme.hasColor == null ? hasColor : theme.hasColor;
      theme = this._themes.getDefault({
        hasUnicode: useUnicode,
        hasColor: useColor,
        platform: theme.platform,
      });
    }
    return theme;
  }

  setThemeset(themes: any) {
    this._themes = themes;
    this.setTheme(this._theme);
  }

  setTheme(theme: any) {
    this._gauge.setTheme(this._computeTheme(theme));
    if (this._showing) {
      this._requestRedraw();
    }
    this._theme = theme;
  }

  private _requestRedraw() {
    this._needsRedraw = true;
    if (!this._fixedFramerate) {
      this._doRedraw();
    }
  }

  getWidth(): number {
    return ((this._tty && this._tty.columns) || 80) - 1;
  }

  setWriteTo(writeTo: any, tty: any) {
    const enabled = !this._disabled;
    if (enabled) {
      this.disable();
    }
    this._writeTo = writeTo;
    this._tty =
      tty ||
      (writeTo === process.stderr && process.stdout.isTTY && process.stdout) ||
      (writeTo.isTTY && writeTo) ||
      this._tty;
    if (this._gauge) {
      this._gauge.setWidth(this.getWidth());
    }
    if (enabled) {
      this.enable();
    }
  }

  enable() {
    if (!this._disabled) {
      return;
    }
    this._disabled = false;
    if (this._tty) {
      this._enableEvents();
    }
    if (this._showing) {
      this.show();
    }
  }

  disable() {
    if (this._disabled) {
      return;
    }
    if (this._showing) {
      this._lastUpdateAt = null;
      this._showing = false;
      this._doRedraw();
      this._showing = true;
    }
    this._disabled = true;
    if (this._tty) {
      this._disableEvents();
    }
  }

  private _enableEvents() {
    if (this._cleanupOnExit) {
      this._removeOnExit = onExit(callWith(this, this.disable));
    }
    this._tty.on("resize", this._$$handleSizeChange);
    if (this._fixedFramerate) {
      this.redrawTracker = setInterval(this._$$doRedraw, this._updateInterval);
      if (this.redrawTracker.unref) {
        this.redrawTracker.unref();
      }
    }
  }

  private _disableEvents() {
    this._tty.removeListener("resize", this._$$handleSizeChange);
    if (this._fixedFramerate) {
      clearInterval(this.redrawTracker);
    }
    if (this._removeOnExit) {
      this._removeOnExit();
    }
  }

  hide(cb?: () => void) {
    if (this._disabled) {
      return cb && process.nextTick(cb);
    }
    if (!this._showing) {
      return cb && process.nextTick(cb);
    }
    this._showing = false;
    this._doRedraw();
    cb && setImmediate(cb);
  }

  show(section?: string | object, completed?: number) {
    this._showing = true;
    if (typeof section === "string") {
      this._status.section = section;
    } else if (typeof section === "object") {
      const sectionKeys = Object.keys(section);
      for (let ii = 0; ii < sectionKeys.length; ++ii) {
        const key = sectionKeys[ii];
        // @ts-expect-error ...
        this._status[key] = section[key];
      }
    }
    if (completed != null) {
      this._status.completed = completed;
    }
    if (this._disabled) {
      return;
    }
    this._requestRedraw();
  }

  pulse(subsection?: string) {
    this._status.subsection = subsection || "";
    this._status.spun++;
    if (this._disabled) {
      return;
    }
    if (!this._showing) {
      return;
    }
    this._requestRedraw();
  }

  private _handleSizeChange() {
    this._gauge.setWidth(this._tty.columns - 1);
    this._requestRedraw();
  }

  private _doRedraw() {
    if (this._disabled || this._paused) {
      return;
    }
    if (!this._fixedFramerate) {
      const now = Date.now();
      if (this._lastUpdateAt && now - this._lastUpdateAt < this._updateInterval) {
        return;
      }
      this._lastUpdateAt = now;
    }
    if (!this._showing && this._onScreen) {
      this._onScreen = false;
      let result = this._gauge.hide();
      if (this._hideCursor) {
        result += this._gauge.showCursor();
      }
      return this._writeTo.write(result);
    }
    if (!this._showing && !this._onScreen) {
      return;
    }
    if (this._showing && !this._onScreen) {
      this._onScreen = true;
      this._needsRedraw = true;
      if (this._hideCursor) {
        this._writeTo.write(this._gauge.hideCursor());
      }
    }
    if (!this._needsRedraw) {
      return;
    }
    if (!this._writeTo.write(this._gauge.show(this._status))) {
      this._paused = true;
      this._writeTo.on(
        "drain",
        callWith(this, function () {
          // @ts-expect-error ...
          this._paused = false;
          // @ts-expect-error ...
          this._doRedraw();
        })
      );
    }
  }
}
