const assert = require('assert');
const { describe, it } = require('node:test');
const authRoutes = require('../routes/authRoutes');

describe('authRoutes', () => {
  it('exports an Express router', () => {
    assert.strictEqual(typeof authRoutes, 'function');
    assert.ok(authRoutes.name === 'router' || authRoutes.constructor.name === 'router', 'authRoutes should be an Express router');
  });
});
