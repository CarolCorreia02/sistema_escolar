const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const autenticar = require('../middlewares/autenticacaoMiddleware');
const autorizar = require('../middlewares/autorizacaoMiddleware');

router.post('/cadastro', authController.cadastrar);
router.post('/login', authController.login);
router.get('/alunos', autenticar, autorizar(['diretoria']), authController.listarAlunos);

module.exports = router;