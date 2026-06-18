const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/chat', require('./routes/chat'));

// Basic route
app.get('/', (req, res) => {
  res.send('Complaint Management API is running...');
});

// Error handling middleware
app.use(errorHandler);

// Socket.io Real-time Chat setup
io.use((socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(
      socket.handshake.query.token,
      process.env.JWT_SECRET || 'super_secret_complaint_handling_jwt_key_987654321',
      (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.userId = decoded.id;
        next();
      }
    );
  } else {
    next(new Error('Authentication error'));
  }
}).on('connection', (socket) => {
  console.log(`User connected to chat: ${socket.userId}`);

  // Join a room for a specific complaint
  socket.on('joinRoom', ({ complaintId }) => {
    socket.join(complaintId);
    console.log(`Socket ${socket.id} joined complaint room: ${complaintId}`);
  });

  // Handle message sending
  socket.on('sendMessage', async ({ complaintId, text }) => {
    try {
      const user = await User.findById(socket.userId);
      if (!user) return;

      const message = await Message.create({
        complaint: complaintId,
        sender: socket.userId,
        text: text,
      });

      const populatedMessage = await Message.findById(message._id).populate('sender', 'name email role');

      // Emit message to everyone in the room
      io.to(complaintId).emit('message', populatedMessage);
    } catch (error) {
      console.error('Socket message save error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected from chat: ${socket.userId}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in production mode on port ${PORT}`);
});
