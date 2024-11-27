const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const socket = require('socket.io');

const app = express();
require('dotenv').config();

const corsOptions = {
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', userRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => { res.send('Hello World') })

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("Connected to MongoDb")
}).catch((err) => {
    console.log(err.message);
});

const server = app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

const io = socket(server, {
    cors: {
        origin: '*',
        credentials: true,
        methods: ["GET", "POST"]
    }
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
    global.chatSocket = socket
    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
    });
    socket.on("send-msg", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("msg-receive", data.message);
        }
    })
});