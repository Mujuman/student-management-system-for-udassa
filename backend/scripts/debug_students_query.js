const { getStudents } = require('../controllers/studentsController');

const req = { query: {} };
const res = {
  status(code) { this.code = code; return this; },
  json(obj) { console.log('RESP', this.code || 200, JSON.stringify(obj, null, 2)); },
};
const next = (err) => { if (err) console.error('NEXT_ERR', err); };

// Monkey patch Logger.info to avoid requiring the entire logger module since it's used by getStudents.
const Logger = require('../utils/logger');
Logger.info = (msg, data) => console.log('LOG:', msg, data);

(async () => {
  try {
    await getStudents(req, res, next);
  } catch (e) {
    console.error('EX', e.stack || e.message);
  } finally {
    process.exit(0);
  }
})();
