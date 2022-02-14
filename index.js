'use strict';

const logger = require('./src/utils/logger');
const port = 8010;
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const buildSchemas = require('./src/schemas');

db.serialize(() => {
  buildSchemas(db);

  const app = require('./src/app')(db);

  app.use((err,req,res) => {
    res.status(500).send({
      "message": "Could not perform the calculation!"
    });

    logger.error(`${err.status || 500} - ${res.statusMessage} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  })

  app.use((req,res) => {
    res.status(404).json({
      "message": "Not Found"
    });

    logger.error(`400 || ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  })

  app.listen(port, () => logger.info(`App started and listening on port ${port}`));
});