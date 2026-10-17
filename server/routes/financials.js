const express = require('express');
const router = express.Router();
const { getFinancials } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getFinancials);

module.exports = router;
