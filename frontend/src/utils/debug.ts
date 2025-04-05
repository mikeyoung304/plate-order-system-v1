type LogLevel = "debug" | "info" | "warn" | "error";

interface DebugOptions {
  component: string;
  level?: LogLevel;
  timestamp?: boolean;
}

class Debugger {
  private static instance: Debugger;
  private isEnabled: boolean = process.env.NODE_ENV === "development";
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private constructor() {}

  static getInstance(): Debugger {
    if (!Debugger.instance) {
      Debugger.instance = new Debugger();
    }
    return Debugger.instance;
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  setLogLevel(level: LogLevel) {
    const currentLevel = this.logLevels[level];
    Object.entries(this.logLevels).forEach(([key, value]) => {
      if (value >= currentLevel) {
        this.logLevels[key as LogLevel] = 0;
      } else {
        this.logLevels[key as LogLevel] = 1;
      }
    });
  }

  private formatMessage(message: string, options: DebugOptions): string {
    const parts = [];
    if (options.timestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    parts.push(`[${options.component}]`);
    parts.push(message);
    return parts.join(" ");
  }

  debug(message: string, options: DebugOptions) {
    if (this.isEnabled && this.logLevels.debug === 0) {
      console.debug(this.formatMessage(message, options));
    }
  }

  info(message: string, options: DebugOptions) {
    if (this.isEnabled && this.logLevels.info === 0) {
      console.info(this.formatMessage(message, options));
    }
  }

  warn(message: string, options: DebugOptions) {
    if (this.isEnabled && this.logLevels.warn === 0) {
      console.warn(this.formatMessage(message, options));
    }
  }

  error(message: string, options: DebugOptions, error?: Error) {
    if (this.isEnabled && this.logLevels.error === 0) {
      console.error(this.formatMessage(message, options));
      if (error) {
        console.error(error);
      }
    }
  }

  logState(state: any, options: DebugOptions) {
    if (this.isEnabled) {
      console.group(this.formatMessage("State:", options));
      console.log(JSON.stringify(state, null, 2));
      console.groupEnd();
    }
  }

  logApiCall(
    endpoint: string,
    method: string,
    data: any,
    options: DebugOptions,
  ) {
    if (this.isEnabled) {
      console.group(
        this.formatMessage(`API Call: ${method} ${endpoint}`, options),
      );
      console.log("Request Data:", data);
      console.groupEnd();
    }
  }
}

export const debug = Debugger.getInstance();
