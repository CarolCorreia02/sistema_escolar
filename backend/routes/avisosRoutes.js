const express = require('express');
const controller = require('../controllers/avisosController');
const autenticar = require('../middlewares/autenticacaoMiddleware');
const autorizar = require('../middlewares/autorizacaoMiddleware');
const router = express.Router();

router.use(autenticar);
router.get('/', autorizar('diretoria', 'aluno'), controller.listarAvisos);
router.post('/', autorizar('diretoria'), controller.criarAviso);
router.delete('/:id', autorizar('diretoria'), controller.excluirAviso);

module.exports = router;
