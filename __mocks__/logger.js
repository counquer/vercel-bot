const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  _setLogger: jest.fn()
};
module.exports = logger;