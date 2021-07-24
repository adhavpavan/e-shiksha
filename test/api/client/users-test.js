'use strict';
var chai = require('chai');
var ZSchema = require('z-schema');
var customFormats = module.exports = function(zSchema) {
  // Placeholder file for all custom-formats in known to swagger.json
  // as found on
  // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#dataTypeFormat

  var decimalPattern = /^\d{0,8}.?\d{0,4}[0]+$/;

  /** Validates floating point as decimal / money (i.e: 12345678.123400..) */
  zSchema.registerFormat('double', function(val) {
    return !decimalPattern.test(val.toString());
  });

  /** Validates value is a 32bit integer */
  zSchema.registerFormat('int32', function(val) {
    // the 32bit shift (>>) truncates any bits beyond max of 32
    return Number.isInteger(val) && ((val >> 0) === val);
  });

  zSchema.registerFormat('int64', function(val) {
    return Number.isInteger(val);
  });

  zSchema.registerFormat('float', function(val) {
    // better parsing for custom "float" format
    if (Number.parseFloat(val)) {
      return true;
    } else {
      return false;
    }
  });

  zSchema.registerFormat('date', function(val) {
    // should parse a a date
    return !isNaN(Date.parse(val));
  });

  zSchema.registerFormat('dateTime', function(val) {
    return !isNaN(Date.parse(val));
  });

  zSchema.registerFormat('password', function(val) {
    // should parse as a string
    return typeof val === 'string';
  });
};

customFormats(ZSchema);

var validator = new ZSchema({});
var supertest = require('supertest');
var api = supertest('http://localhost:10010'); // supertest init;
var expect = chai.expect;

describe('/users', function() {
  describe('get', function() {
    it('should respond with 200 success', function(done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "properties": {
          "result": {
            "type": "object",
            "properties": {
              "errors": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "success": {
                "type": "boolean"
              },
              "message": {
                "type": "string"
              },
              "payload": {
                "type": "object",
                "properties": {
                  "users": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "firstName": {
                          "type": "string"
                        },
                        "lastName": {
                          "type": "string"
                        },
                        "userType": {
                          "type": "string"
                        },
                        "email": {
                          "type": "string"
                        },
                        "mobile": {
                          "type": "number"
                        },
                        "DOB": {
                          "type": "string"
                        },
                        "organization": {
                          "type": "string"
                        },
                        "lastLoggedIn": {
                          "type": "string"
                        },
                        "createdBy": {
                          "type": "string"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      /*eslint-enable*/
      api.get('/api/v1/users')
      .set('Content-Type', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

  });

  describe('post', function() {
    it('should respond with 200 Success', function(done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "properties": {
          "result": {
            "type": "object",
            "properties": {
              "errors": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "success": {
                "type": "boolean"
              },
              "message": {
                "type": "string"
              },
              "payload": {
                "type": "object",
                "properties": {
                  "message": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      };

      /*eslint-enable*/
      api.post('/api/v1/users')
      .set('Content-Type', 'application/json')
      .send({
        title: 'DATA GOES HERE'
      })
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

    it('should respond with default Error', function(done) {
      /*eslint-disable*/
      var schema = {
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          }
        }
      };

      /*eslint-enable*/
      api.post('/api/v1/users')
      .set('Content-Type', 'application/json')
      .send({
        title: 'DATA GOES HERE'
      })
      .expect('DEFAULT RESPONSE CODE HERE')
      .end(function(err, res) {
        if (err) return done(err);

        expect(validator.validate(res.body, schema)).to.be.true;
        done();
      });
    });

  });

});
