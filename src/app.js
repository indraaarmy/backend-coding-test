'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const dbAsync = require('./utils/db-async');
const validate = require('./middlewares/validations');


module.exports = (db) => {
  const { all: dbAll, run: dbRun } = dbAsync(db);

  app.get('/health', (req, res) => res.send('Healthy'));

  app.post('/rides', [jsonParser, validate.addRides], async (req, res) => {
    var values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long, req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];

    try {
      var lastId = await dbRun(`INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)`, values);
      var rows = await dbAll(`SELECT * FROM Rides WHERE rideID = ?`, [lastId]);
      res.send(rows);
    } catch(e) {
      res.send(e);
    }
  });

  app.get('/rides', async (req, res) => {
    var limit = 10;
    var page = 1

    if ((req.query).hasOwnProperty('limit')) {
      limit = Number(req.query.limit);
    }

    if ((req.query).hasOwnProperty('page')) {
      page = Number(req.query.page);
    }

    var offset = (page - 1) * limit;

    try {
      var rows = await dbAll(`SELECT * FROM Rides LIMIT ? OFFSET ?`, [limit, offset]);

      if (rows.length === 0) {
        return res.send({
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides'
        });
      }

      res.send(rows);
    } catch(e) {
      res.send(e);
    }
  });

  app.get('/rides/:id', async (req, res) => {
    try {
      var rows = await dbAll(`SELECT * FROM Rides WHERE rideID = ?`, [req.params.id]);

      if (rows.length === 0) {
        return res.send({
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides'
        });
      }

      res.send(rows);
    } catch(e) {
      res.send(e);
    }
  });

  return app;
};
