const express = require('express');
const controller = require('../controllers/authController');
const autenticar = require('../middlewares/autenticacaoMiddleware');
const router = express.Router();

router.post('/cadastro', controller.cadastrar);
router.post('/login', controller.login);
router.get('/perfil', autenticar, controller.perfil);

module.exports = router;
