const express = require('express');
const router = express.Router();
const { loadSampleData, clearSampleData } = require('../controllers/sampleDataController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', loadSampleData);
router.delete('/', clearSampleData);

module.exports = router;
