'use strict';

const request = require('supertest');
const assert = require('assert');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

describe('API tests', () => {
  before((done) => {
    db.serialize((err) => {
      if (err) {
        return done(err);
      }

      buildSchemas(db);

      done();
    });
  });

  describe('GET /health', () => {
    it('should return health', (done) => {
      request(app)
        .get('/health')
        .expect('Content-Type', /text/)
        .expect(200, done);
    });
  });

  describe('GET /rides', () => {
    it('should return could not find any rides', (done) => {
      request(app)
        .get('/rides')
        .expect('Content-Type', /json/)
        .expect(200, {
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides',
        }, done);
    });
  });

  describe('POST /rides', () => {
    it('should create new ride', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: 10,
          start_long: 10,
          end_lat: 30,
          end_long: 30,
          rider_name: 'Test Rider',
          driver_name: 'Test Driver',
          driver_vehicle: 'Car',
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert.equal(res.body[0].rideID, 1);
          assert.ok(res.body[0].created);
          done();
        });
    });

    it('should return start lat lon validation error', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: 200,
          start_long: 10,
          end_lat: 30,
          end_long: 30,
          rider_name: 'Test Rider',
          driver_name: 'Test Driver',
          driver_vehicle: 'Car',
        })
        .expect('Content-Type', /json/)
        .expect(200, {
          error_code: 'VALIDATION_ERROR',
          message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
        }, done);
    });

    it('should return end lat lon validation error', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: 10,
          start_long: 10,
          end_lat: 300,
          end_long: 30,
          rider_name: 'Test Rider',
          driver_name: 'Test Driver',
          driver_vehicle: 'Car',
        })
        .expect('Content-Type', /json/)
        .expect(200, {
          error_code: 'VALIDATION_ERROR',
          message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively',
        }, done);
    });

    it('should return empty string rider name validation error', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: 10,
          start_long: 10,
          end_lat: 30,
          end_long: 30,
          rider_name: '',
          driver_name: 'Test Driver',
          driver_vehicle: 'Car',
        })
        .expect('Content-Type', /json/)
        .expect(200, {
          error_code: 'VALIDATION_ERROR',
          message: 'Rider name must be a non empty string',
        }, done);
    });

    it('should return empty string driver name validation error', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: 10,
          start_long: 10,
          end_lat: 30,
          end_long: 30,
          rider_name: 'Test Rider',
          driver_name: '',
          driver_vehicle: 'Car',
        })
        .expect('Content-Type', /json/)
        .expect(200, {
          error_code: 'VALIDATION_ERROR',
          message: 'Driver name must be a non empty string',
        }, done);
    });

    it('should return empty string driver vehicle validation error', (done) => {
      request(app)
        .post('/rides')
        .send({
          start_lat: 10,
          start_long: 10,
          end_lat: 30,
          end_long: 30,
          rider_name: 'Test Rider',
          driver_name: 'Test Driver',
          driver_vehicle: '',
        })
        .expect('Content-Type', /json/)
        .expect(200, {
          error_code: 'VALIDATION_ERROR',
          message: 'Driver vehicle must be a non empty string',
        }, done);
    });
  });

  describe('GET /rides', () => {
    it('should return rides', (done) => {
      request(app)
        .get('/rides')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert.equal(res.body.length, 1);
          done();
        });
    });
  });

  describe('GET /rides/{rideID}', () => {
    it('should return a ride', (done) => {
      request(app)
        .get('/rides/1')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });

    it('should error could not find any rides', (done) => {
      request(app)
        .get('/rides/99')
        .expect('Content-Type', /json/)
        .expect(200, {
          error_code: 'RIDES_NOT_FOUND_ERROR',
          message: 'Could not find any rides',
        }, done);
    });
  });

  describe('GET /rides with pagination', () => {
    before((done) => {
      for (let i = 0; i < 20; i++) {
        db.run(`INSERT INTO Rides (startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, [30, 30, 100, 100, `Test Rider ${i}`, `Test Driver ${i}`, "Car", ] );
      }
      done();
    });

    it('should return default 10 rows', (done) => {
      request(app)
        .get('/rides?page=1')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert.equal(res.body.length, 10);
          done();
        });
    });

    it('should return with limit 5 rows', (done) => {
      request(app)
        .get('/rides?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          assert.equal(res.body.length, 5);
          done();
        });
    });
  });
});