class Logger {
  info(...args) {
    console.info(...args); // eslint-disable-line no-console
  }

  warn(...args) {
    console.warn(...args); // eslint-disable-line no-console
  }

  error(...args) {
    console.error(...args); // eslint-disable-line no-console
  }
}

export const log = new Logger();
