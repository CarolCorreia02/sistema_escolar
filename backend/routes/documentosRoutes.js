const express = require('express');
const controller = require('../controllers/documentosController');
const autenticar = require('../middlewares/autenticacaoMiddleware');
const autorizar = require('../middlewares/autorizacaoMiddleware');
const router = express.Router();

// Rota pública para o Sistema de Verificação de Autenticidade de Documentos Escolares
router.get('/verificar/:codigo', controller.verificarAutenticidade);

// Rotas protegidas por JWT
router.use(autenticar);
router.get('/', autorizar('diretoria', 'aluno'), controller.listarDocumentos);
router.post('/', autorizar('diretoria', 'aluno'), controller.criarOuEmitirDocumento);
router.put('/:id', autorizar('diretoria'), controller.atualizarStatusDocumento);

module.exports = router;
