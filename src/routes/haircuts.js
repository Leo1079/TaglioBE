const express = require('express');
const router = express.Router();
const haircutController = require('../controllers/haircutController');

router.post('/', haircutController.createHaircut);
router.get('/', haircutController.getHaircuts);

module.exports = router;
