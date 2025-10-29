const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Match = require('./models/Match');
const Like = require('./models/Like');

dotenv.config();

// Usuários realistas para popular o banco
const usuarios = [
  {
    email: 'ana.silva@email.com',
    password: 'senha123',
    firstName: 'Ana',
    lastName: 'Silva',
    dateOfBirth: new Date('1998-03-15'),
    gender: 'female',
    preference: 'male',
    interests: ['photography', 'travelling', 'music'],
    bio: 'Amo viajar e conhecer novos lugares ✈️',
    photos: ['https://i.pravatar.cc/300?img=1'],
    isOnline: true
  },
  {
    email: 'bruno.costa@email.com',
    password: 'senha123',
    firstName: 'Bruno',
    lastName: 'Costa',
    dateOfBirth: new Date('1995-07-22'),
    gender: 'male',
    preference: 'female',
    interests: ['fitness', 'videogames', 'cooking'],
    bio: 'Desenvolvedor e gamer nas horas vagas 🎮',
    photos: ['https://i.pravatar.cc/300?img=12'],
    isOnline: true
  },
  {
    email: 'carla.mendes@email.com',
    password: 'senha123',
    firstName: 'Carla',
    lastName: 'Mendes',
    dateOfBirth: new Date('1999-11-08'),
    gender: 'female',
    preference: 'both',
    interests: ['artscrafts', 'music', 'shopping'],
    bio: 'Artista e apaixonada por música 🎨🎵',
    photos: ['https://i.pravatar.cc/300?img=5'],
    isOnline: false
  },
  {
    email: 'daniel.souza@email.com',
    password: 'senha123',
    firstName: 'Daniel',
    lastName: 'Souza',
    dateOfBirth: new Date('1993-05-12'),
    gender: 'male',
    preference: 'female',
    interests: ['extremesports', 'travelling', 'photography'],
    bio: 'Aventureiro e fotógrafo de paisagens 📸',
    photos: ['https://i.pravatar.cc/300?img=13'],
    isOnline: true
  },
  {
    email: 'eduarda.lima@email.com',
    password: 'senha123',
    firstName: 'Eduarda',
    lastName: 'Lima',
    dateOfBirth: new Date('1997-09-20'),
    gender: 'female',
    preference: 'male',
    interests: ['fitness', 'swimming', 'music'],
    bio: 'Personal trainer e amante de esportes 💪',
    photos: ['https://i.pravatar.cc/300?img=9'],
    isOnline: true
  },
  {
    email: 'felipe.santos@email.com',
    password: 'senha123',
    firstName: 'Felipe',
    lastName: 'Santos',
    dateOfBirth: new Date('1994-12-03'),
    gender: 'male',
    preference: 'female',
    interests: ['cooking', 'drinking', 'travelling'],
    bio: 'Chef apaixonado por gastronomia 👨‍🍳',
    photos: ['https://i.pravatar.cc/300?img=14'],
    isOnline: true
  },
  {
    email: 'gabriela.rocha@email.com',
    password: 'senha123',
    firstName: 'Gabriela',
    lastName: 'Rocha',
    dateOfBirth: new Date('1998-06-18'),
    gender: 'female',
    preference: 'male',
    interests: ['music', 'artscrafts', 'photography'],
    bio: 'Cantora e compositora 🎤',
    photos: ['https://i.pravatar.cc/300?img=10'],
    isOnline: false
  },
  {
    email: 'henrique.dias@email.com',
    password: 'senha123',
    firstName: 'Henrique',
    lastName: 'Dias',
    dateOfBirth: new Date('1996-04-25'),
    gender: 'male',
    preference: 'female',
    interests: ['videogames', 'speeches', 'music'],
    bio: 'Podcaster e entusiasta de tecnologia 🎙️',
    photos: ['https://i.pravatar.cc/300?img=15'],
    isOnline: true
  },
  {
    email: 'isabela.ferreira@email.com',
    password: 'senha123',
    firstName: 'Isabela',
    lastName: 'Ferreira',
    dateOfBirth: new Date('1998-08-30'),
    gender: 'female',
    preference: 'male',
    interests: ['shopping', 'travelling', 'music'],
    bio: 'Fashion blogger e viajante 👗✨',
    photos: ['https://i.pravatar.cc/300?img=16'],
    isOnline: true
  },
  {
    email: 'joao.oliveira@email.com',
    password: 'senha123',
    firstName: 'João',
    lastName: 'Oliveira',
    dateOfBirth: new Date('1992-01-17'),
    gender: 'male',
    preference: 'female',
    interests: ['fitness', 'extremesports', 'swimming'],
    bio: 'Surfista e instrutor de mergulho 🏄‍♂️',
    photos: ['https://i.pravatar.cc/300?img=17'],
    isOnline: true
  },
  {
    email: 'juliana.martins@email.com',
    password: 'senha123',
    firstName: 'Juliana',
    lastName: 'Martins',
    dateOfBirth: new Date('2000-02-14'),
    gender: 'female',
    preference: 'male',
    interests: ['photography', 'artscrafts', 'music'],
    bio: 'Fotógrafa de casamentos 📷💕',
    photos: ['https://i.pravatar.cc/300?img=20'],
    isOnline: false
  },
  {
    email: 'lucas.pereira@email.com',
    password: 'senha123',
    firstName: 'Lucas',
    lastName: 'Pereira',
    dateOfBirth: new Date('1997-10-05'),
    gender: 'male',
    preference: 'female',
    interests: ['videogames', 'cooking', 'music'],
    bio: 'Streamer e gamer profissional 🎮',
    photos: ['https://i.pravatar.cc/300?img=18'],
    isOnline: true
  },
  {
    email: 'mariana.alves@email.com',
    password: 'senha123',
    firstName: 'Mariana',
    lastName: 'Alves',
    dateOfBirth: new Date('1999-07-11'),
    gender: 'female',
    preference: 'both',
    interests: ['travelling', 'photography', 'drinking'],
    bio: 'Mochileira e amante de café ☕',
    photos: ['https://i.pravatar.cc/300?img=23'],
    isOnline: true
  },
  {
    email: 'nicolas.barbosa@email.com',
    password: 'senha123',
    firstName: 'Nicolas',
    lastName: 'Barbosa',
    dateOfBirth: new Date('1995-03-28'),
    gender: 'male',
    preference: 'female',
    interests: ['music', 'speeches', 'videogames'],
    bio: 'DJ e produtor musical 🎧',
    photos: ['https://i.pravatar.cc/300?img=19'],
    isOnline: false
  },
  {
    email: 'olivia.gomes@email.com',
    password: 'senha123',
    firstName: 'Olivia',
    lastName: 'Gomes',
    dateOfBirth: new Date('2000-09-03'),
    gender: 'female',
    preference: 'male',
    interests: ['fitness', 'swimming', 'travelling'],
    bio: 'Instrutora de yoga e meditação 🧘‍♀️',
    photos: ['https://i.pravatar.cc/300?img=25'],
    isOnline: true
  },
  {
    email: 'pedro.ribeiro@email.com',
    password: 'senha123',
    firstName: 'Pedro',
    lastName: 'Ribeiro',
    dateOfBirth: new Date('1994-11-19'),
    gender: 'male',
    preference: 'female',
    interests: ['extremesports', 'photography', 'travelling'],
    bio: 'Skatista profissional 🛹',
    photos: ['https://i.pravatar.cc/300?img=33'],
    isOnline: true
  },
  {
    email: 'rafaela.castro@email.com',
    password: 'senha123',
    firstName: 'Rafaela',
    lastName: 'Castro',
    dateOfBirth: new Date('1998-05-07'),
    gender: 'female',
    preference: 'male',
    interests: ['cooking', 'shopping', 'music'],
    bio: 'Confeiteira e cake designer 🎂',
    photos: ['https://i.pravatar.cc/300?img=28'],
    isOnline: false
  },
  {
    email: 'sergio.cardoso@email.com',
    password: 'senha123',
    firstName: 'Sergio',
    lastName: 'Cardoso',
    dateOfBirth: new Date('1991-08-22'),
    gender: 'male',
    preference: 'female',
    interests: ['drinking', 'speeches', 'travelling'],
    bio: 'Sommelier e apreciador de vinhos 🍷',
    photos: ['https://i.pravatar.cc/300?img=31'],
    isOnline: true
  },
  {
    email: 'tatiana.moreira@email.com',
    password: 'senha123',
    firstName: 'Tatiana',
    lastName: 'Moreira',
    dateOfBirth: new Date('1996-12-16'),
    gender: 'female',
    preference: 'male',
    interests: ['artscrafts', 'photography', 'music'],
    bio: 'Designer gráfica e ilustradora 🎨',
    photos: ['https://i.pravatar.cc/300?img=32'],
    isOnline: true
  },
  {
    email: 'vinicius.araujo@email.com',
    password: 'senha123',
    firstName: 'Vinicius',
    lastName: 'Araújo',
    dateOfBirth: new Date('1993-04-09'),
    gender: 'male',
    preference: 'female',
    interests: ['fitness', 'cooking', 'swimming'],
    bio: 'Nutricionista esportivo 🥗',
    photos: ['https://i.pravatar.cc/300?img=51'],
    isOnline: false
  }
];

// Função para popular o banco de dados
async function popularBanco() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tinder');
    console.log('✅ Conectado ao MongoDB');

    // Limpar dados existentes
    await User.deleteMany({});
    await Match.deleteMany({});
    await Like.deleteMany({});
    console.log('🗑️  Banco de dados limpo');

    // Criar usuários
    const usuariosCriados = [];
    for (const userData of usuarios) {
      const user = new User(userData);
      await user.save();
      usuariosCriados.push(user);
      console.log(`✅ Usuário criado: ${user.firstName} ${user.lastName}`);
    }

    console.log(`\n🎉 ${usuariosCriados.length} usuários criados com sucesso!`);
    console.log('\n📋 Detalhes dos usuários:');
    
    usuariosCriados.forEach(user => {
      console.log(`\n👤 ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Interesses: ${user.interests.join(', ')}`);
      console.log(`   Online: ${user.isOnline ? 'Sim' : 'Não'}`);
    });

    console.log('\n✨ Banco de dados populado com sucesso!');
    console.log('🔑 Você pode fazer login com qualquer email acima usando a senha: senha123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular banco:', error);
    process.exit(1);
  }
}

// Executar
popularBanco();
