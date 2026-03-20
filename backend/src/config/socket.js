import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const isAllowed = !origin || 
                         /^http:\/\/localhost:\d+$/.test(origin) ||
                         (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) ||
                         origin === 'https://vedaai-vqjp.onrender.com';

        if (isAllowed) {
          return callback(null, true);
        }
        
        // Return false instead of Error to avoid server-side crashes/500s
        callback(null, false);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });


  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join room by assignmentId for targeted events
    socket.on('join-assignment', (assignmentId) => {
      socket.join(`assignment:${assignmentId}`);
      console.log(`📩 Socket ${socket.id} joined room: assignment:${assignmentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
