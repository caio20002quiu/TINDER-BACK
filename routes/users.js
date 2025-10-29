const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Like = require('../models/Like');
const Match = require('../models/Match');

// @rota    GET /api/users/discover
// @desc    Obter usuários para descobrir (swipe)
// @acesso  Privado
router.get('/discover', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    const { filter } = req.query; // todos, online, novos, curtiram
    
    // Buscar IDs de usuários já curtidos (Likes enviados)
    const likedUsers = await Like.find({ curtidor: currentUser._id }).select('curtido');
    const likedIds = likedUsers.map(like => like.curtido);
    
    // Buscar IDs de usuários com match
    const matches = await Match.find({ users: currentUser._id });
    const matchedIds = matches.flatMap(match => 
      match.users.filter(id => id.toString() !== currentUser._id.toString())
    );
    
    // IDs de usuários já vistos (liked + passed + matches)
    let excludedIds = [
      ...likedIds,
      ...currentUser.passedUsers,
      ...matchedIds,
      currentUser._id
    ];

    // Buscar usuários baseado nas preferências
    const query = {};

    // Aplicar filtros específicos
    switch (filter) {
      case 'online':
        query.isOnline = true;
        query._id = { $nin: excludedIds };
        break;
      
      case 'novos':
        // Usuários criados nos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query.createdAt = { $gte: sevenDaysAgo };
        query._id = { $nin: excludedIds };
        break;
      
      case 'curtiram':
        // Usuários que curtiram o usuário atual mas ainda não têm match
        const likesRecebidos = await Like.find({ curtido: currentUser._id }).select('curtidor');
        const whoLikedIds = likesRecebidos.map(like => like.curtidor);
        
        // Filtrar quem já tem match
        const whoLikedWithoutMatch = whoLikedIds.filter(
          id => !matchedIds.some(matchId => matchId.toString() === id.toString())
        );
        
        if (whoLikedWithoutMatch.length === 0) {
          return res.json([]);
        }
        
        query._id = { $in: whoLikedWithoutMatch };
        break;
      
      case 'todos':
      default:
        query._id = { $nin: excludedIds };
        break;
    }

    // Filtrar por preferência de gênero (exceto no filtro "curtiram")
    if (filter !== 'curtiram' && currentUser.preference !== 'both') {
      query.gender = currentUser.preference;
    }

    const users = await User.find(query)
      .select('-password -email -passedUsers')
      .sort({ createdAt: -1 })
      .limit(20);

    // Calcular distância (simulada por enquanto)
    const usersWithDistance = users.map(user => {
      return {
        ...user.toObject(),
        distance: (Math.random() * 5 + 0.5).toFixed(1) // Distância aleatória entre 0.5 e 5.5 km
      };
    });

    res.json(usersWithDistance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// @rota    PUT /api/users/profile
// @desc    Atualizar perfil do usuário
// @acesso  Privado
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, bio, interests, photos, preference } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio) user.bio = bio;
    if (interests) user.interests = interests;
    if (photos) user.photos = photos;
    if (preference) user.preference = preference;
    
    await user.save();
    
    res.json({ user: user.getPublicProfile() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// @rota    GET /api/users/:id
// @desc    Obter perfil de um usuário específico
// @acesso  Privado
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email -passedUsers');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json(user.getPublicProfile());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;

