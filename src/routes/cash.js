const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');

router.post('/open', cashController.openCash);
router.post('/close', cashController.closeCash);
router.get('/current', cashController.getCurrentCash);
router.get('/history', cashController.getHistory);

module.exports = router;
