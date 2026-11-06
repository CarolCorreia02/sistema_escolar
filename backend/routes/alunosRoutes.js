const express = require('express');
const controller = require('../controllers/alunosController');
const autenticar = require('../middlewares/autenticacaoMiddleware');
const autorizar = require('../middlewares/autorizacaoMiddleware');
const router = express.Router();

router.use(autenticar);
router.get('/', autorizar('diretoria'), controller.listarAlunos);
router.get('/:id/ficha', autorizar('diretoria', 'aluno'), controller.obterFichaCompleta);
router.put('/:id', autorizar('diretoria'), controller.atualizarDadosAluno);

module.exports = router;
