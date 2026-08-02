class Logger {
  info(...args) {
    console.info(...args); // oxlint-disable-line no-console
  }

  warn(...args) {
    console.warn(...args); // oxlint-disable-line no-console
  }

  error(...args) {
    console.error(...args); // oxlint-disable-line no-console
  }
}

export const log = new Logger();
