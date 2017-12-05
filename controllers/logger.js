const winston = require('winston');

winston.remove( winston.transports.Console );
winston.add( winston.transports.Console, { timestamp: true , level: 'info', colorize: true });

module.exports = winston;