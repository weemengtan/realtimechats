const express = require('express')
const http = require('http')
const path = require('path') //note that path is actually node core package - so DONT NEED to install
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { adduser, getUser, removeUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
const port = process.env.PORT || 3000 //use 3000 if run locally

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')

// setup static directory to serve
app.use(express.static(publicDirectoryPath))

app.get('', (req, res) => {
    res.render('index')
})

// general emit - socket.emit io.emit socket.broadcast.emit
// room emit only - io.to.emit socket.broadcast.to.emit (restrict to room only)

let welcome = "Hello and welcome to our chatroom"
io.on('connection', (socket) => {
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = adduser({ id: socket.id, username, room })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        console.log(`room ${user.room}`);
        socket.emit('message', generateMessage(`${user.room} Admin`, welcome)) //welcome message only to that particular user
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.room} Admin`, `${user.username} just joined`)) //broadcast only to room
        io.emit('roomdata', ({ room: user.room, users: getUsersInRoom(user.room) }))
        callback()
    })

    socket.on('sendchat', (message, callback) => {
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profinity is NOT allowed!')
        }
        console.log('receive message ', message);
        const user = getUser(socket.id)
        callback() //send acknowledgement call back to sender.
        io.to(user.room).emit('message', generateMessage(user.username, message)) //"broadcast to ALL connections"
    })

    socket.on('sendlocation', (message, callback) => {
        console.log('receive message ', message);
        //        io.emit('newchatmessage', message) //"broadcast to ALL connections"
        //        callback('Received Location')
        const user = getUser(socket.id)
        callback('Received Location')
        io.to(user.room).emit('geolocationmessage', generateLocationMessage(user.username, `https://google.com/maps?q=${message}`))
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.room} Admin`, `${user.username} has left.`)) //broadcast wnen someone left.
            io.emit('roomdata', ({ room: user.room, users: getUsersInRoom(user.room) }))
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}.`)
})