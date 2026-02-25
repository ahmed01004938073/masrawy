const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController.cjs');

router.get('/:userId', favoritesController.getFavorites);
router.post('/', favoritesController.toggleFavorite);
router.post('/sync', favoritesController.syncFavorites);

module.exports = router;
