const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @rota    POST /api/auth/signup
// @desc    Registrar novo usuário
// @acesso  Público
router.post('/signup', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('firstName').notEmpty().withMessage('Nome é obrigatório'),
  body('lastName').notEmpty().withMessage('Sobrenome é obrigatório'),
  body('dateOfBirth').isDate().withMessage('Data de nascimento inválida'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gênero inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, dateOfBirth, gender, preference, bio, photoUrl, interests } = req.body;

    // Verificar se usuário já existe
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Já existe uma conta com este email' });
    }

    // Criar novo usuário
    user = new User({
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      preference: preference || 'both',
      bio: bio || '',
      photos: photoUrl ? [photoUrl] : [],
      interests: interests || []
    });

    await user.save();

    // Criar token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// @rota    POST /api/auth/login
// @desc    Login de usuário
// @acesso  Público
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Verificar se usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou senha incorretos' });
    }

    // Verificar senha
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou senha incorretos' });
    }

    // Atualizar status online
    user.isOnline = true;
    user.lastActive = Date.now();
    await user.save();

    // Criar token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// @rota    GET /api/auth/me
// @desc    Obter usuário autenticado
// @acesso  Privado
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user.getPublicProfile() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;

