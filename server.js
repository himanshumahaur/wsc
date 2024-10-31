const app = require('express')();
const server = app.listen(8080);
const path = require('path');
const { isReadable } = require('stream');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})

const io = require('socket.io')(server);

const config = {
    'width': 600,
    'height': 300,
    'gravity': 2,
    'floor': 300
}

let players = {}
let characters = {}

class Character {
    constructor() {
        this.width = 10;
        this.height = 10;

        this.weight = 0.5 // [0, 1]

        this.speed = 5;
        this.jump = 20;
        this.damage = 5;
        this.hit = 5;

        this.actions = {
            0: {
                name: 'ideal',
                frames: 10,
                img: new Image()
            },
            1: {
                name: 'left',
                frames: 10,
                img: new Image()
            },
            2: {
                name: 'right',
                frames: 10,
                img: new Image()
            },
            3: {
                name: 'jump',
                frames: 10,
                img: new Image()
            },
            4: {
                name: 'attack',
                frames: 10,
                img: new Image()
            }
        }
    }
}

characters[0] = new Character();

class Player {
    constructor() {
        this.health = 100;

        this.controller = {
            w: 0,
            a: 0,
            s: 0, 
            d: 0,
            e: 0
        }

        this.position = {
            x: 0,
            y: 0
        }

        this.velocity = {
            y: 0
        }

        this.character = 0;

        this.action = 0;
        this.frame = 0;
    }
    
    // use extensive commands
    // functionsn are not carried over
    input(key, action) {
        this.controller[`${key}`] = action;
    }

    update() {
        const character = characters[this.character];

        // gravity logic
        this.velocity.y += config.gravity * character.weight;
        this.position.y += this.velocity.y;

        if(this.position.y + character.height > config.floor) {
            this.position.y = config.floor - character.height;
            this.velocity.y = 0;
        }

        // frame logic
        if(this.frame + 1 < character.actions[this.action].frames) {
            this.frame += 1;
        }
        else {
            this.action = 0;
            this.frame = 0;
        }

        // ACTION & RENDER
        
            // horizon
        if(this.controller.a == 0 && this.controller.d == 0) {
            if(this.action == 1 || this.action == 2) {
                this.action = 0;
                this.frame = 0;
            }
        }
        else if(this.controller.a) {
            this.position.x -= character.speed;

            if(this.action <= 2) {
                this.action = 1;
                this.frame = 0;
            }
        }
        else if(this.controller.d) {
            this.position.x += character.speed;

            if(this.action <= 2) {
                this.action = 2;
                this.frame = 0;
            }
        }

        if(this.position.x < 0) {
            this.position.x = 0;
        }
        if(this.position.x + character.width > config.width) {
            this.position.x = config.width - character.width;
        }

            // jump
        if(this.controller.w && this.position.y == config.floor - character.height) {
            this.velocity.y = -1 * character.jump;

            if(this.action < 3) {
                this.action = 3;
                this.frame = 0;
            }
        }

            // attack
        if(this.controller.e) {
                // config fighting styles
            if(this.action < 4) {
                this.action = 4;
                this.frame = 0;
            }
        }
    }
}

io.on('connection', socket => {
    const player = new Player();

    players[`${socket.id}`] = player;

    socket.emit('initialize', config, characters);

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

    setTimeout(loop, 100);
}

loop();