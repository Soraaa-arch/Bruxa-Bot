const express = require('express');
const mongoose = require('mongoose');
const http = require('http'); // Required for Socket.io
const { Server } = require('socket.io'); // Required for Socket.io

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, { 
  cors: { origin: "*" } 
});

app.use(express.json());
app.use(express.static('public'));

const MONGO_URI = 'mongodb+srv://rakib_adil:dbpass22@rakib-bby-api.dijqvo0.mongodb.net/BruxaBotUsers';
mongoose.connect(MONGO_URI);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('MongoDB connected'));

// --- Socket.io Logic ---
io.on("connection", (socket) => {
  console.log("A client connected to dashboard");

  // When a bot connects via socket (Heartbeat/Live Status)
  socket.on("bot-online", async (botUids) => {
    socket.botId = botUids; // Attach ID to socket instance
    await db.collection('bots').updateOne(
      { botUids },
      { $set: { status: 'online', lastSeen: new Date() } }
    );
    io.emit("update-dashboard"); // Notify frontend
  });

  socket.on("disconnect", async () => {
    if (socket.botId) {
      await db.collection('bots').updateOne(
        { botUids: socket.botId },
        { $set: { status: 'offline' } }
      );
      io.emit("update-dashboard"); // Notify frontend
    }
  });
});

// Register / update bot info
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
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    io.emit("update-dashboard"); // Tell frontend to refresh
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post owner uid
app.post('/api/owner', async (req, res) => {
  try {
    const apikey = req.headers['x-api-key'];
    if (apikey !== 'adilbot') {
      return res.status(401).json({ error: 'Unauthorized'});
    }
    
    const { ownerUids } = req.body;
    if (!ownerUids) return res.status(400).json({ error: 'owner uid is required'});

    // handle if owner uid come as a array
    if (Array.isArray(ownerUids)) {
      ownerUids = ownerUids.join(',');
    }

    await db.collection('owner').updateOne(
        { ownerUids },
        {$set : { ownerUids }},
        { upsert: true }
      )
    
    res.json({ status: 'success'});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get owner uid
app.get('/api/owner', async (req, res) => {
  try {
    const owner = await db.collection('owner').findOne({}, { _id: 0});
    res.json({ owner })
  } catch (error) {
    res.status(500).json({ err: error.message })
  }
})

// Get all bots
app.get('/api/bots', async (req, res) => {
  try {
    const bots = await db.collection('bots').find({}, { botPassword: 0, _id: 0 }).toArray();
    res.json(bots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete bot
app.delete('/api/bots/:botUids', async (req, res) => {
  try {
    await db.collection('bots').deleteOne({ botUids: req.params.botUids });
    io.emit("update-dashboard"); // Refresh dashboard after deletion
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-check for offline bots every 30 seconds
setInterval(async () => {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const result = await db.collection('bots').updateMany(
      { lastSeen: { $lt: oneMinuteAgo }, status: 'online' },
      { $set: { status: 'offline' } }
    );

    // Only notify frontend if a status actually changed
    if (result.modifiedCount > 0) {
      io.emit("update-dashboard");
    }
  } catch (err) {
    console.error('Offline check error:', err.message);
  }
}, 30000);

// IMPORTANT: Use server.listen instead of app.listen
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`API & Socket Server running on port ${PORT}` ));