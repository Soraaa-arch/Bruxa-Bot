const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.json());
app.use(express.static('public'));

const MONGO_URI =
  'mongodb+srv://rakib_adil:dbpass22@rakib-bby-api.dijqvo0.mongodb.net/BruxaBotUsers';
mongoose.connect(MONGO_URI);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('MongoDB connected'));

// Track connected sockets by botUids
const connectedBots = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);

  socket.on('bot-online', async (botUids) => {
    if (!botUids) return;
    connectedBots.set(botUids, socket.id);
    socket.botUids = botUids;
    console.log(`[Socket] Bot online: ${botUids}`);
    try {
      await db.collection('bots').updateOne(
        { botUids },
        { $set: { status: 'online', lastSeen: new Date() } }
      );
    } catch (err) {
      console.error('[Socket] DB update error:', err.message);
    }
    io.emit('bot-status-update', { botUids, status: 'online' });
  });

  socket.on('heartbeat', async (botUids) => {
    if (!botUids) return;
    try {
      await db.collection('bots').updateOne(
        { botUids },
        { $set: { status: 'online', lastSeen: new Date() } }
      );
    } catch (err) {
      console.error('[Socket] Heartbeat DB error:', err.message);
    }
  });

  socket.on('disconnect', async () => {
    const botUids = socket.botUids;
    if (!botUids) return;
    connectedBots.delete(botUids);
    console.log(`[Socket] Bot offline: ${botUids}`);
    try {
      await db.collection('bots').updateOne(
        { botUids },
        { $set: { status: 'offline', lastSeen: new Date() } }
      );
    } catch (err) {
      console.error('[Socket] Disconnect DB error:', err.message);
    }
    io.emit('bot-status-update', { botUids, status: 'offline' });
  });
});

// Register / update bot info — uses botUids as identifier, auto-creates if new
app.post('/api/register', async (req, res) => {
  try {
    const { botUids, adminUids, botName, botPassword, email, prefix, timeZone, language } = req.body;
    if (!botUids) return res.status(400).json({ error: 'botUids is required' });

    await db.collection('bots').updateOne(
      { botUids },
      {
        $set: {
          botUids,
          adminUids: adminUids || [],
          botName: botName || '',
          botPassword: botPassword || '',
          email: email || '',
          prefix: prefix || '/',
          timeZone: timeZone || 'N/A',
          language: language || 'en',
          status: 'online',
          lastSeen: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all bots
app.get('/api/bots', async (req, res) => {
  try {
    const bots = await db.collection('bots').find().toArray();
    res.json(bots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single bot by botUids
app.get('/api/bots/:botUids', async (req, res) => {
  try {
    const bot = await db.collection('bots').findOne({ botUids: req.params.botUids });
    if (!bot) return res.status(404).json({ error: 'Bot not found' });
    res.json(bot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete bot
app.delete('/api/bots/:botUids', async (req, res) => {
  try {
    await db.collection('bots').deleteOne({ botUids: req.params.botUids });
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark offline if no update in 1 minute (fallback for bots without socket)
setInterval(async () => {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    await db.collection('bots').updateMany(
      { lastSeen: { $lt: oneMinuteAgo } },
      { $set: { status: 'offline' } }
    );
  } catch (err) {
    console.error('Offline check error:', err.message);
  }
}, 30000);

server.listen(3000, () => console.log('API running on port 3000'));
