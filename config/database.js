const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
    
    // Event listeners para monitorar conexão
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB desconectado');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 MongoDB desconectado devido ao encerramento da aplicação');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error.message);
    console.log('\n💡 Dicas:');
    console.log('  - Verifique se o MongoDB está rodando');
    console.log('  - Verifique a MONGODB_URI no arquivo .env');
    console.log('  - Ou use MongoDB Atlas (cloud gratuito)\n');
    process.exit(1);
  }
};

module.exports = connectDB;


