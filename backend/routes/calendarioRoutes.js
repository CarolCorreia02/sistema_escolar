const express = require('express');
const router = express.Router();
const calendarioController = require('../controllers/calendarioController');
const autenticar = require('../middlewares/autenticacaoMiddleware');
const autorizar = require('../middlewares/autorizacaoMiddleware');

router.use(autenticar);
router.get('/', calendarioController.listar);
router.post('/', autorizar(['diretoria']), calendarioController.criar);
router.delete('/:id', autorizar(['diretoria']), calendarioController.excluir);

module.exports = router;