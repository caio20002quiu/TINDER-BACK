const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Obter token do cabeçalho
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token inválido. Faça login novamente.' });
    }

    // Adicionar usuário à requisição
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido. Faça login novamente.' });
  }
};

