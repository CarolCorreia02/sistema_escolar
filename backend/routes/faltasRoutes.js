const express = require('express');
const controller = require('../controllers/faltasController');
const autenticar = require('../middlewares/autenticacaoMiddleware');
const autorizar = require('../middlewares/autorizacaoMiddleware');
const router = express.Router();

router.use(autenticar);
router.get('/', autorizar('diretoria', 'aluno'), controller.listarFaltas);
router.post('/', autorizar('diretoria'), controller.registrarFalta);
router.put('/:id', autorizar('diretoria', 'aluno'), controller.atualizarJustificativa);
router.delete('/:id', autorizar('diretoria'), controller.excluirFalta);

module.exports = router;
