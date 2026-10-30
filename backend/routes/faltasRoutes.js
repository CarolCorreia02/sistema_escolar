const express = require('express');
const router = express.Router();
const faltasController = require('../controllers/faltasController');
const autenticar = require('../middlewares/autenticacaoMiddleware');
const autorizar = require('../middlewares/autorizacaoMiddleware');

router.use(autenticar);
router.get('/', faltasController.listar);
router.post('/', autorizar(['diretoria']), faltasController.registrarFalta);
router.put('/:id/justificar', autorizar(['aluno']), faltasController.enviarJustificativaAluno);
router.put('/:id/avaliar', autorizar(['diretoria']), faltasController.avaliarJustificativaDiretoria);
router.delete('/:id', autorizar(['diretoria']), faltasController.excluir);

module.exports = router;