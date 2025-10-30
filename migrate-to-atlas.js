/**
 * Script para migrar dados do MongoDB local para MongoDB Atlas
 * 
 * USO:
 * 1. Substitua MONGODB_ATLAS_URI pela sua string de conexão do Atlas
 * 2. Execute: node migrate-to-atlas.js
 */

const mongoose = require('mongoose');

// ⚠️ CONFIGURE AQUI:
const MONGODB_LOCAL = 'mongodb://localhost:27017/destined';
const MONGODB_ATLAS = 'SUA_STRING_DO_ATLAS_AQUI'; // Cole aqui a string do Atlas

// Models
const User = require('./models/User');
const Like = require('./models/Like');
const Match = require('./models/Match');

async function migrateData() {
  try {
    console.log('🔄 Iniciando migração...\n');

    // Conectar ao MongoDB LOCAL
    console.log('📍 Conectando ao MongoDB LOCAL...');
    const localConn = await mongoose.createConnection(MONGODB_LOCAL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado ao MongoDB LOCAL\n');

    // Buscar dados locais
    const LocalUser = localConn.model('User', User.schema);
    const LocalLike = localConn.model('Like', Like.schema);
    const LocalMatch = localConn.model('Match', Match.schema);

    const users = await LocalUser.find({});
    const likes = await LocalLike.find({});
    const matches = await LocalMatch.find({});

    console.log(`📊 Dados encontrados no LOCAL:`);
    console.log(`   - ${users.length} usuários`);
    console.log(`   - ${likes.length} likes`);
    console.log(`   - ${matches.length} matches\n`);

    if (users.length === 0) {
      console.log('⚠️  Nenhum dado encontrado para migrar!');
      await localConn.close();
      process.exit(0);
    }

    // Fechar conexão local
    await localConn.close();
    console.log('👋 Desconectado do MongoDB LOCAL\n');

    // Conectar ao MongoDB ATLAS
    console.log('☁️  Conectando ao MongoDB ATLAS...');
    const atlasConn = await mongoose.createConnection(MONGODB_ATLAS, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado ao MongoDB ATLAS\n');

    // Inserir dados no Atlas
    const AtlasUser = atlasConn.model('User', User.schema);
    const AtlasLike = atlasConn.model('Like', Like.schema);
    const AtlasMatch = atlasConn.model('Match', Match.schema);

    console.log('📤 Migrando dados para o ATLAS...');

    // Migrar usuários
    if (users.length > 0) {
      await AtlasUser.insertMany(users);
      console.log(`✅ ${users.length} usuários migrados`);
    }

    // Migrar likes
    if (likes.length > 0) {
      await AtlasLike.insertMany(likes);
      console.log(`✅ ${likes.length} likes migrados`);
    }

    // Migrar matches
    if (matches.length > 0) {
      await AtlasMatch.insertMany(matches);
      console.log(`✅ ${matches.length} matches migrados`);
    }

    console.log('\n🎉 Migração concluída com sucesso!');
    
    // Fechar conexão Atlas
    await atlasConn.close();
    console.log('👋 Desconectado do MongoDB ATLAS');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error.message);
    console.error('\n💡 Dicas:');
    console.error('  - Verifique se o MongoDB local está rodando');
    console.error('  - Verifique se a string do Atlas está correta');
    console.error('  - Verifique se o usuário do Atlas tem permissões corretas');
    console.error('  - Verifique se liberou o IP 0.0.0.0/0 no Atlas\n');
    process.exit(1);
  }
}

// Executar migração
migrateData();

