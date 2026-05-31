const assert = require('assert');
const { describe, it } = require('node:test');
const {
  sanitizeBody,
  validateStudentCreate,
  validateStudentUpdate,
  validateLogin,
  validateGradeCreate,
  validateGradeUpdate
} = require('../middleware/validationMiddleware');

describe('validationMiddleware', () => {
  it('exports the expected validator arrays', () => {
    assert.ok(Array.isArray(validateStudentCreate), 'validateStudentCreate should be an array');
    assert.ok(Array.isArray(validateStudentUpdate), 'validateStudentUpdate should be an array');
    assert.ok(Array.isArray(validateLogin), 'validateLogin should be an array');
    assert.ok(Array.isArray(validateGradeCreate), 'validateGradeCreate should be an array');
    assert.ok(Array.isArray(validateGradeUpdate), 'validateGradeUpdate should be an array');
  });

  it('sanitizes request body, query, and params values', () => {
    const req = {
      body: {
        first_name: ' <b>Jane</b> ',
        nested: { note: '<script>alert(1)</script> Hello ' }
      },
      query: {
        q: ' <img src=x onerror=alert(1)> '
      },
      params: {
        id: ' 123 '
      }
    };

    sanitizeBody(req, {}, () => {
      assert.strictEqual(req.body.first_name, 'Jane');
      assert.strictEqual(req.body.nested.note, 'alert(1) Hello');
      assert.strictEqual(req.query.q, '');
      assert.strictEqual(req.params.id, '123');
    });
  });
});
