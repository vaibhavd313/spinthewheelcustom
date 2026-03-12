const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const defaultItems = [
    "hosting the call", "taking MoM", "launch"
];

let gameState = {
    items: [...defaultItems],
    currentTurn: 1,
    isSpinning: false,
    players: {
        1: [],
        2: [],
        3: []
    }
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Send current state to newly connected client
    socket.emit('gameState', gameState);

    socket.on('spin', () => {
        if (gameState.isSpinning || gameState.items.length === 0) return;
        
        gameState.isSpinning = true;
        io.emit('spinStart');
        
        const minSpins = 5;
        const maxSpins = 10;
        const spins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
        
        const numSlices = gameState.items.length;
        const winningIndex = Math.floor(Math.random() * numSlices);
        const wonItem = gameState.items[winningIndex];
        
        const sliceAngle = 360 / numSlices;
        const normalizedDegree = winningIndex * sliceAngle + (sliceAngle / 2);
        let finalModuloDegree = 360 - normalizedDegree;
        
        const totalDegrees = (spins * 360) + finalModuloDegree;
        
        const spinResult = {
            targetRotation: totalDegrees,
            targetItem: wonItem,
            targetIndex: winningIndex,
            currentTurn: gameState.currentTurn
        };
        
        io.emit('spinResult', spinResult);
        
        // Wait for spin (4s) + celebration (2.5s)
        setTimeout(() => {
            gameState.isSpinning = false;
            
            gameState.players[gameState.currentTurn].push(wonItem);
            gameState.items.splice(winningIndex, 1);
            
            if (gameState.items.length > 0) {
                gameState.currentTurn = gameState.currentTurn === 3 ? 1 : gameState.currentTurn + 1;
            }
            
            io.emit('gameState', gameState);
        }, 6500);
    });

    socket.on('reset', () => {
        gameState = {
            items: [...defaultItems],
            currentTurn: 1,
            isSpinning: false,
            players: {
                1: [],
                2: [],
                3: []
            }
        };
        io.emit('gameState', gameState);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
