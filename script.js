document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // --- STATE ---
    let items = [];
    const colors = [
        "#f43f5e", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6", 
        "#6366f1", "#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6"
    ];
    let currentTurn = 1;
    let isSpinning = false;
    let currentRotation = 0;

    // --- DOM ELEMENTS ---
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spin-btn');
    const resetBtn = document.getElementById('reset-btn');
    const displayTurn = document.getElementById('current-turn-display');
    const resultDisplay = document.getElementById('result-display');
    const winnerText = document.getElementById('winner-text');
    const wonItemText = document.getElementById('won-item');
    const wheelContainer = document.querySelector('.wheel-container');
    
    const p1Panel = document.querySelector('.player-1');
    const p2Panel = document.querySelector('.player-2');
    const p3Panel = document.querySelector('.player-3');
    const panels = { 1: p1Panel, 2: p2Panel, 3: p3Panel };
    
    const indicators = {
        1: p1Panel.querySelector('.turn-indicator'),
        2: p2Panel.querySelector('.turn-indicator'),
        3: p3Panel.querySelector('.turn-indicator')
    };
    
    const lists = {
        1: document.getElementById('list-1'),
        2: document.getElementById('list-2'),
        3: document.getElementById('list-3')
    };

    // Fix for HDPI displays
    function setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width === 500) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
        }
    }
    
    // Call once
    setupCanvas();

    // --- SOCKET EVENTS ---
    socket.on('gameState', (state) => {
        items = state.items;
        currentTurn = state.currentTurn;
        isSpinning = state.isSpinning;
        
        // Render lists
        [1, 2, 3].forEach(player => {
            lists[player].innerHTML = '';
            state.players[player].forEach(item => {
                const li = document.createElement('li');
                li.className = 'won-item';
                li.innerText = item;
                // remove slideIn animation so it doesn't replay on sync
                li.style.animation = 'none';
                li.style.opacity = '1';
                li.style.transform = 'translateX(0)';
                lists[player].appendChild(li);
            });
            lists[player].scrollTop = lists[player].scrollHeight;
        });

        if (!isSpinning) {
            canvas.style.transition = 'none';
            canvas.style.transform = 'rotate(0deg)';
            currentRotation = 0;
            spinBtn.disabled = items.length === 0;
            if (items.length > 0) {
                spinBtn.innerText = "SPIN THE WHEEL";
            }
            resultDisplay.classList.add('hidden');
        }

        updateUIForTurn();
        drawWheel();
    });

    socket.on('spinStart', () => {
        isSpinning = true;
        spinBtn.disabled = true;
        resultDisplay.classList.add('hidden');
        wheelContainer.classList.add('spinning');
    });

    socket.on('spinResult', ({ targetRotation, targetItem, targetIndex, currentTurn: turnNum }) => {
        currentRotation += targetRotation;
        
        canvas.style.transform = `rotate(${currentRotation}deg)`;
        const spinDuration = 4000;
        canvas.style.transition = `transform ${spinDuration}ms cubic-bezier(0.1, 0.7, 0.1, 1)`;
        
        setTimeout(() => {
            wheelContainer.classList.remove('spinning');
            
            // Celebration
            triggerConfetti(turnNum);
            winnerText.innerText = `Player ${turnNum}`;
            winnerText.style.color = getComputedStyle(document.body).getPropertyValue(`--p${turnNum}-color`);
            wonItemText.innerText = targetItem;
            resultDisplay.classList.remove('hidden');
            
            // Add item to list with animation locally before full state sync
            const li = document.createElement('li');
            li.className = 'won-item';
            li.innerText = targetItem;
            lists[turnNum].appendChild(li);
            lists[turnNum].scrollTop = lists[turnNum].scrollHeight;
            
        }, spinDuration);
    });

    // --- DRAWING THE WHEEL ---
    function drawWheel() {
        if (items.length === 0) {
            drawEmptyWheel();
            return;
        }

        const numSlices = items.length;
        const sliceAngle = 2 * Math.PI / numSlices;
        const centerX = 250;
        const centerY = 250;
        const radius = 240;
        
        ctx.clearRect(0, 0, 500, 500);
        
        for (let i = 0; i < numSlices; i++) {
            const startAngle = i * sliceAngle - Math.PI / 2;
            const endAngle = startAngle + sliceAngle;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.stroke();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px Outfit, sans-serif";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            const offset = items.length > 5 ? radius - 30 : radius / 2 + 20;
            ctx.fillText(items[i], offset, 0);
            ctx.restore();
        }
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
        ctx.fillStyle = "#1e293b";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
    }

    function drawEmptyWheel() {
        ctx.clearRect(0, 0, 500, 500);
        ctx.beginPath();
        ctx.arc(250, 250, 240, 0, 2 * Math.PI);
        ctx.fillStyle = "#1e293b";
        ctx.fill();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 24px Outfit";
        ctx.fillText("All items gone!", 250, 250);
        spinBtn.disabled = true;
        spinBtn.innerText = "GAME OVER";
    }

    function updateUIForTurn() {
        Object.values(panels).forEach(p => p.classList.remove('active'));
        Object.values(indicators).forEach(i => i.classList.add('hidden'));
        
        panels[currentTurn].classList.add('active');
        indicators[currentTurn].classList.remove('hidden');
        
        displayTurn.innerText = `Player ${currentTurn}`;
        displayTurn.style.color = getComputedStyle(document.body).getPropertyValue(`--p${currentTurn}-color`);
    }
    
    function triggerConfetti(playerNum) {
        const colorsConfetti = {
            1: ['#3b82f6', '#93c5fd'],
            2: ['#ef4444', '#fca5a5'],
            3: ['#10b981', '#6ee7b7']
        };
        
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            colors: colorsConfetti[playerNum]
        };

        function fire(particleRatio, opts) {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }

    // --- EVENT LISTENERS ---
    spinBtn.addEventListener('click', () => {
        socket.emit('spin');
    });

    resetBtn.addEventListener('click', () => {
        socket.emit('reset');
    });
});
