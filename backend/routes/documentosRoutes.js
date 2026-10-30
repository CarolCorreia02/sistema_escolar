const express = require('express');
const router = express.Router();
const documentosController = require('../controllers/documentosController');
const autenticar = require('../middlewares/autenticacaoMiddleware');
const autorizar = require('../middlewares/autorizacaoMiddleware');

router.use(autenticar);
router.get('/', documentosController.listar);
router.post('/', autorizar(['diretoria']), documentosController.criar);
router.put('/:id', autorizar(['diretoria']), documentosController.atualizar);
router.delete('/:id', autorizar(['diretoria']), documentosController.excluir);

module.exports = router;