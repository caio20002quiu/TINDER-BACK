const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  curtidor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  curtido: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  tipo: {
    type: String,
    enum: ['like', 'superlike'],
    default: 'like'
  }
}, {
  timestamps: true
});

// Índice composto para garantir que o mesmo usuário não curta o mesmo alvo múltiplas vezes
likeSchema.index({ curtidor: 1, curtido: 1 }, { unique: true });

// Índice para buscar likes recebidos rapidamente
likeSchema.index({ curtido: 1 });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;

