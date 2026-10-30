const express = require('express');
const router = express.Router();
const solicitacoesController = require('../controllers/solicitacoesController');
const autenticar = require('../middlewares/autenticacaoMiddleware');
const autorizar = require('../middlewares/autorizacaoMiddleware');

router.use(autenticar);
router.get('/', solicitacoesController.listar);
router.post('/', autorizar(['aluno']), solicitacoesController.criar);
router.put('/:id', autorizar(['diretoria']), solicitacoesController.responderDiretoria);
router.delete('/:id', solicitacoesController.excluir);

module.exports = router;