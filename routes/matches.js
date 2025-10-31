const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Match = require('../models/Match');
const Like = require('../models/Like');

// @rota    POST /api/matches/swipe
// @desc    Realizar swipe (curtir ou passar)
// @acesso  Privado
router.post('/swipe', auth, async (req, res) => {
  try {
    const { targetUserId, action } = req.body; // action: 'like', 'pass' ou 'superlike'
    
    // Validar campos obrigatórios
    if (!targetUserId) {
      return res.status(400).json({ 
        message: 'targetUserId é obrigatório',
        error: 'missing_targetUserId'
      });
    }

    if (!action) {
      return res.status(400).json({ 
        message: 'action é obrigatória',
        error: 'missing_action'
      });
    }

    if (!['like', 'pass', 'superlike'].includes(action)) {
      return res.status(400).json({ 
        message: `Ação inválida: "${action}". Ações válidas: like, pass, superlike`,
        error: 'invalid_action'
      });
    }
    
    // Recarregar usuário atual para ter dados mais recentes
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ 
        message: 'Usuário atual não encontrado',
        error: 'current_user_not_found'
      });
    }

    // Validar formato do targetUserId (deve ser um ObjectId válido)
    if (typeof targetUserId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(targetUserId)) {
      return res.status(400).json({ 
        message: 'ID do usuário alvo inválido. Deve ser um ObjectId válido do MongoDB.',
        error: 'invalid_target_user_id_format'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ 
        message: 'Usuário alvo não encontrado',
        error: 'target_user_not_found'
      });
    }
    
    // Verificar se já interagiu com este usuário
    const alreadyLiked = await Like.findOne({
      curtidor: currentUser._id,
      curtido: targetUserId
    });
    
    const alreadyPassed = currentUser.passedUsers.some(id => id.toString() === targetUserId.toString());
    
    const alreadyMatched = await Match.findOne({
      users: { $all: [currentUser._id, targetUserId] }
    });
    
    if (alreadyLiked || alreadyPassed || alreadyMatched) {
      return res.status(400).json({ 
        message: 'Você já interagiu com este usuário',
        alreadyInteracted: true
      });
    }

    // Adicionar à lista apropriada
    if (action === 'like' || action === 'superlike') {
      // Criar o Like
      const like = await Like.create({
        curtidor: currentUser._id,
        curtido: targetUserId,
        tipo: action
      });
      
      // Debug: Log dos interesses
      console.log('\n=== DEBUG MATCH ===');
      console.log('📝 Current user:', currentUser.firstName, currentUser.lastName, `(ID: ${currentUser._id})`);
      console.log('   Interests:', currentUser.interests);
      console.log('');
      console.log('🎯 Target user:', targetUser.firstName, targetUser.lastName, `(ID: ${targetUserId})`);
      console.log('   Interests:', targetUser.interests);
      console.log('');
      
      // Verificar se o outro usuário também curtiu (match reverso)
      const likeReverso = await Like.findOne({
        curtidor: targetUserId,
        curtido: currentUser._id
      });
      
      console.log('🔍 Like reverso:', likeReverso ? '✅ ENCONTRADO!' : '❌ NÃO ENCONTRADO');
      
      // Verificar interesses em comum
      const currentInterests = currentUser.interests || [];
      const targetInterests = targetUser.interests || [];
      
      const commonInterests = currentInterests.filter(interest => 
        targetInterests.includes(interest)
      );
      
      console.log('   Current interests:', currentInterests);
      console.log('   Target interests:', targetInterests);
      console.log('   Common interests:', commonInterests);
      console.log('   Has common interests?', commonInterests.length > 0 ? '✅ YES!' : '❌ NO');
      
      // Match acontece quando ambos se curtem (like reverso)
      // Interesses em comum são um bônus, mas não obrigatórios para o match
      const shouldMatch = !!likeReverso;
      
      console.log('   Should match?', shouldMatch ? '✅ YES!' : '❌ NO');
      console.log('=================\n');
      
      if (shouldMatch) {
        // Criar registro de match
        const match = new Match({
          users: [currentUser._id, targetUserId].sort() // Sort para manter consistência
        });
        await match.save();
        
        // Mensagem varia se há interesses em comum
        const matchMessage = commonInterests.length > 0 
          ? '🎉 É um match! Vocês curtiram um ao outro e têm interesses em comum!'
          : '🎉 É um match! Vocês curtiram um ao outro!';
        
        return res.json({
          match: true,
          message: matchMessage,
          matchedUser: targetUser.getPublicProfile(),
          commonInterests: commonInterests,
          totalCommonInterests: commonInterests.length
        });
      }
      
      // Se não deu match, apenas confirma o like enviado
      return res.json({
        match: false,
        message: action === 'superlike' ? 'Super Like enviado!' : 'Like enviado!',
        hasCommonInterests: commonInterests.length > 0,
        debugInfo: {
          currentUserInterests: currentInterests,
          targetUserInterests: targetInterests,
          commonInterests: commonInterests,
          hasMutualLike: !!likeReverso
        }
      });
    } else {
      // Action é 'pass'
      currentUser.passedUsers.push(targetUserId);
      await currentUser.save();
    }
    
    res.json({ 
      match: false,
      message: 'Usuário passado'
    });
  } catch (error) {
    console.error('Erro no swipe:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// @rota    GET /api/matches
// @desc    Obter todos os matches do usuário
// @acesso  Privado
router.get('/', auth, async (req, res) => {
  try {
    const { filter } = req.query; // todos, curtiu, curtiram, visualizacoes
    const currentUser = await User.findById(req.user._id);
    
    let users = [];
    
    switch (filter) {
      case 'curtiu':
        // Usuários que o usuário atual curtiu (mas não são matches)
        const likesEnviados = await Like.find({ curtidor: currentUser._id })
          .populate('curtido', '-password -email');
        
        // Filtrar apenas aqueles que não têm match
        const curtidosSemMatch = await Promise.all(
          likesEnviados.map(async (like) => {
            const hasMatch = await Match.findOne({
              users: { $all: [currentUser._id, like.curtido._id] }
            });
            return hasMatch ? null : like.curtido;
          })
        );
        
        users = curtidosSemMatch.filter(u => u !== null);
        break;
      
      case 'curtiram':
        // Usuários que curtiram o usuário atual (mas não são matches)
        const likesRecebidos = await Like.find({ curtido: currentUser._id })
          .populate('curtidor', '-password -email');
        
        // Filtrar apenas aqueles que não têm match
        const curtidoresSemMatch = await Promise.all(
          likesRecebidos.map(async (like) => {
            const hasMatch = await Match.findOne({
              users: { $all: [currentUser._id, like.curtidor._id] }
            });
            return hasMatch ? null : like.curtidor;
          })
        );
        
        users = curtidoresSemMatch.filter(u => u !== null);
        break;
      
      case 'visualizacoes':
        // Por enquanto, retorna usuários que passaram pelo perfil
        // Em uma implementação real, precisaria de um campo separado para visualizações
        users = [];
        break;
      
      case 'todos':
      default:
        // Buscar todos os matches do usuário
        const matches = await Match.find({
          users: currentUser._id
        });
        
        // Extrair os IDs dos usuários matched (que não são o usuário atual)
        const matchedUserIds = matches.map(match => 
          match.users.find(id => id.toString() !== currentUser._id.toString())
        );
        
        // Buscar os perfis dos usuários
        users = await User.find({
          _id: { $in: matchedUserIds }
        }).select('-password -email');
        break;
    }
    
    // Buscar informações de match com última mensagem (apenas para matches reais)
    const usersWithDetails = await Promise.all(
      users.map(async (matchedUser) => {
        const match = await Match.findOne({
          users: { $all: [currentUser._id, matchedUser._id] }
        }).sort({ 'messages.createdAt': -1 });
        
        let lastMessage = null;
        if (match && match.messages.length > 0) {
          const lastMsg = match.messages[match.messages.length - 1];
          lastMessage = {
            content: lastMsg.content,
            timestamp: lastMsg.createdAt,
            read: lastMsg.read
          };
        }
        
        return {
          ...matchedUser.toObject(),
          matchedAt: match?.matchedAt || matchedUser.createdAt,
          lastMessage
        };
      })
    );
    
    // Ordenar por última mensagem ou data de match
    usersWithDetails.sort((a, b) => {
      const dateA = a.lastMessage?.timestamp || a.matchedAt;
      const dateB = b.lastMessage?.timestamp || b.matchedAt;
      return new Date(dateB) - new Date(dateA);
    });
    
    res.json(usersWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// @rota    GET /api/matches/:matchId/messages
// @desc    Obter mensagens de um match
// @acesso  Privado
router.get('/:matchId/messages', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate('messages.sender', 'firstName lastName photos');
    
    if (!match) {
      return res.status(404).json({ message: 'Match não encontrado' });
    }
    
    // Verificar se o usuário faz parte do match
    if (!match.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    res.json(match.messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// @rota    POST /api/matches/:matchId/messages
// @desc    Enviar mensagem em um match
// @acesso  Privado
router.post('/:matchId/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Mensagem vazia' });
    }
    
    const match = await Match.findById(req.params.matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Match não encontrado' });
    }
    
    // Verificar se o usuário faz parte do match
    if (!match.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    match.messages.push({
      sender: req.user._id,
      content: content.trim()
    });
    
    await match.save();
    
    res.status(201).json({
      message: 'Mensagem enviada',
      data: match.messages[match.messages.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;

