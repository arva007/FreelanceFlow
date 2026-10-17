const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, getInvoice, updateInvoice, deleteInvoice, downloadInvoicePDF } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getInvoices).post(createInvoice);
router.get('/:id/pdf', downloadInvoicePDF);
router.route('/:id').get(getInvoice).put(updateInvoice).delete(deleteInvoice);

module.exports = router;
