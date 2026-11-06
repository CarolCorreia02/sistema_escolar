const express = require('express');
const controller = require('../controllers/boletimController');
const autenticar = require('../middlewares/autenticacaoMiddleware');
const autorizar = require('../middlewares/autorizacaoMiddleware');
const router = express.Router();

router.use(autenticar);
router.get('/', autorizar('diretoria', 'aluno'), controller.listarNotas);
router.post('/', autorizar('diretoria'), controller.salvarNota);
router.put('/:id', autorizar('diretoria'), controller.salvarNota);
router.delete('/:id', autorizar('diretoria'), controller.excluirNota);

module.exports = router;
