// Controle de permissões por nível ('diretoria' ou 'aluno')
function autorizacaoMiddleware(...niveisPermitidos) {
    return function autorizar(req, res, next) {
        if (!req.usuario) {
            return res.status(401).json({ mensagem: 'Autenticação necessária.' });
        }
        if (!niveisPermitidos.includes(req.usuario.nivel)) {
            return res.status(403).json({
                mensagem: 'Acesso negado: seu perfil (' + req.usuario.nivel + ') não possui permissão para esta operação.'
            });
        }
        next();
    };
}

module.exports = autorizacaoMiddleware;
