module.exports = (perfisPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
            return res.status(403).json({ erro: 'Acesso negado: seu perfil não possui permissão para esta operação.' });
        }
        next();
    };
};