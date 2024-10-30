const app = require('express')();
const server = app.listen(8080);
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})

const io = require('socket.io')(server);

let players = {}
let characters = {}

class Character {
    constructor() {
        this.speed = 5;
        this.damage = 5;
        this.hit = 5;
    }
}

class Player {
    constructor() {
        this.health = 100;

        this.controller = {
            w: 0,
            a: 0,
            s: 0, 
            d: 0
        }

        this.position = {
            x: 0,
            y: 0
        }

        this.character = 0;
    }
    
    // use extensive commands
    // functionsn are not carried over
    input(key, action) {
        this.controller[`${key}`] = action;
    }

    update() {
        if(this.controller.w) this.position.y -= 5;
        if(this.controller.a) this.position.x -= 5;
        if(this.controller.s) this.position.y += 5;
        if(this.controller.d) this.position.x += 5;
    }
}

io.on('connection', socket => {
    const player = new Player();

    players[`${socket.id}`] = player;

    socket.on('disconnect', () => {
        delete players[`${socket.id}`];
    })

    socket.on('input', (key, action) => {
        player.input(key, action);
    })
});

function loop() {
    io.emit('render', players);

    // Iterate over all the players
    Object.entries(players).forEach(([id, player]) => {
        player.update();
    });

    setTimeout(loop, 15);
}

loop();