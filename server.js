const app = require('express')();
const server = app.listen(8080);
const { lookup } = require('dns');
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})

const io = require('socket.io')(server);

let players = {}

class Player {
    constructor() {
        this.health = 100;

        this.position = {
            x: 0,
            y: 0
        }

        this.speed = 5;
    }

    move(key) {
        switch(key) {
            case 'w':
                this.position.y += this.speed
                break;
            case 'a':
                this.position.x -= this.speed
                break;
            case 's':
                this.position.y -= this.speed;
                break;
            case 'd':
                this.position.x += this.speed;
                break;
            default:
                break;
        }
    }
}

io.on('connection', socket => {
    players[`${socket.id}`] = new Player(socket.id);
    
    socket.on('disconnect', () => {
        delete players[`${socket.id}`];
    })

    socket.on('input', (key) => {
        players[`${socket.id}`].move(key);
    })
});

function loop() {
    io.emit('render', players);
    setTimeout(loop, 1000);
}

loop();