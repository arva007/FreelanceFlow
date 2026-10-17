const express = require('express');
const router = express.Router();
const { getTimeLogs, createTimeLog, updateTimeLog, deleteTimeLog, getUnbilledLogs } = require('../controllers/timeLogController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/unbilled', getUnbilledLogs);
router.route('/').get(getTimeLogs).post(createTimeLog);
router.route('/:id').put(updateTimeLog).delete(deleteTimeLog);

module.exports = router;
