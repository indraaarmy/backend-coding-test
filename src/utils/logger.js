const { createLogger, format, transports } = require('winston');

module.exports = createLogger({
  transports: new transports.File({
    filename: `logs/server-${new Date().toISOString().slice(0,10)}.log`,
    format: format.combine(
      format.timestamp(),
      format.align(),
      format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    )
  }),
});