document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let items = [
        "Pizza", "Burger", "Sushi", "Tacos", "Pasta", 
        "Ice Cream", "Steak", "Salad", "Sandwich", "Ramen"
    ];
    
    // Nice vibrant aesthetic colors
    const colors = [
        "#f43f5e", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6", 
        "#6366f1", "#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6"
    ];
    
    let currentTurn = 1; // 1, 2, or 3
    let isSpinning = false;
    let currentRotation = 0;
    
    // --- DOM ELEMENTS ---
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spin-btn');
    const displayTurn = document.getElementById('current-turn-display');
    const resultDisplay = document.getElementById('result-display');
    const winnerText = document.getElementById('winner-text');
    const wonItemText = document.getElementById('won-item');
    const wheelContainer = document.querySelector('.wheel-container');
    
    // Panels
    const p1Panel = document.querySelector('.player-1');
    const p2Panel = document.querySelector('.player-2');
    const p3Panel = document.querySelector('.player-3');
    const panels = { 1: p1Panel, 2: p2Panel, 3: p3Panel };
    
    // Indicators
    const indicators = {
        1: p1Panel.querySelector('.turn-indicator'),
        2: p2Panel.querySelector('.turn-indicator'),
        3: p3Panel.querySelector('.turn-indicator')
    };
    
    // Lists
    const lists = {
        1: document.getElementById('list-1'),
        2: document.getElementById('list-2'),
        3: document.getElementById('list-3')
    };

    // --- INITIALIZATION ---
    function init() {
        // Fix for HDPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        // Only do this once
        if (canvas.width === 500) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
        }
        
        updateUIForTurn();
        drawWheel();
    }

    // --- DRAWING THE WHEEL ---
    function drawWheel() {
        if (items.length === 0) {
            drawEmptyWheel();
            return;
        }

        const numSlices = items.length;
        const sliceAngle = 2 * Math.PI / numSlices;
        const centerX = 250; // Half of nominal CSS width
        const centerY = 250;
        const radius = 240; // Slightly less than half to avoid clipping
        
        ctx.clearRect(0, 0, 500, 500);
        
        for (let i = 0; i < numSlices; i++) {
            const startAngle = i * sliceAngle - Math.PI / 2; // Start from top
            const endAngle = startAngle + sliceAngle;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            
            // Add subtle border
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.stroke();
            
            // Draw text
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
            
            // Adjust text position based on slice count
            const offset = items.length > 5 ? radius - 30 : radius / 2 + 20;
            ctx.fillText(items[i], offset, 0);
            ctx.restore();
        }
        
        // Draw center dot
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

    // --- SPIN LOGIC ---
    function spin() {
        if (isSpinning || items.length === 0) return;
        isSpinning = true;
        
        // UI Updates
        spinBtn.disabled = true;
        resultDisplay.classList.add('hidden');
        wheelContainer.classList.add('spinning');
        
        // Calculate rotation
        // 5-10 full spins + random stop
        const spins = Math.floor(Math.random() * 5) + 5; 
        const randomDegree = Math.floor(Math.random() * 360);
        const totalDegrees = (spins * 360) + randomDegree;
        
        currentRotation += totalDegrees;
        
        // Apply CSS transform
        canvas.style.transform = `rotate(${currentRotation}deg)`;
        
        // Wait for animation to finish (CSS transition is 4 seconds)
        // Set fixed duration in CSS or JS. Let's enforce it via inline style for safety
        const spinDuration = 4000;
        canvas.style.transition = `transform ${spinDuration}ms cubic-bezier(0.1, 0.7, 0.1, 1)`;
        
        setTimeout(() => {
            finishSpin(currentRotation % 360);
        }, spinDuration);
    }
    
    function finishSpin(finalDegree) {
        isSpinning = false;
        wheelContainer.classList.remove('spinning');
        
        // Calculate which item won
        // The pointer is at the TOP. Since we draw starting from -PI/2 (top),
        // we need to map the final rotation to the slice.
        
        // If wheel rotates clockwise by X degrees, the slice at the top moves by X.
        // The slice currently at the top is equivalent to moving counter-clockwise by X.
        const sliceAngle = 360 / items.length;
        
        // Adjust for negative/positive modulo math behavior
        let normalizedDegree = 360 - (finalDegree % 360);
        if (normalizedDegree === 360) normalizedDegree = 0;
        
        // The winning index
        const winningIndex = Math.floor(normalizedDegree / sliceAngle);
        const wonItem = items[winningIndex];
        
        handleWin(wonItem, winningIndex);
    }
    
    function handleWin(item, index) {
        // 1. Show celebration
        triggerConfetti(currentTurn);
        
        // 2. Announce
        winnerText.innerText = `Player ${currentTurn}`;
        winnerText.style.color = getComputedStyle(document.body).getPropertyValue(`--p${currentTurn}-color`);
        wonItemText.innerText = item;
        resultDisplay.classList.remove('hidden');
        
        // 3. Add to player's list
        const li = document.createElement('li');
        li.className = 'won-item';
        li.innerText = item;
        lists[currentTurn].appendChild(li);
        
        // Scroll to bottom
        lists[currentTurn].scrollTop = lists[currentTurn].scrollHeight;
        
        // 4. Remove from wheel data
        items.splice(index, 1);
        
        // 5. Short delay before passing turn and redrawing
        setTimeout(() => {
            // Need to reset canvas rotation to 0 before redrawing otherwise
            // it visually jumps if we redraw slices while rotated
            
            // To prevent visual jump, we actually keep the rotation, but when drawing,
            // the new slices are drawn from the start. A slight jump is inevitable when 
            // removing an item unless we animate the slice disappearing.
            // For simplicity, we reset rotation to 0 without transition, then redraw.
            canvas.style.transition = 'none';
            canvas.style.transform = 'rotate(0deg)';
            currentRotation = 0;
            
            drawWheel();
            
            if (items.length > 0) {
                passTurn();
                spinBtn.disabled = false;
                resultDisplay.classList.add('hidden');
            }
        }, 2500); // 2.5s celebration time
    }
    
    function passTurn() {
        currentTurn = currentTurn === 3 ? 1 : currentTurn + 1;
        updateUIForTurn();
    }
    
    function updateUIForTurn() {
        // Reset all
        Object.values(panels).forEach(p => p.classList.remove('active'));
        Object.values(indicators).forEach(i => i.classList.add('hidden'));
        
        // Set active
        panels[currentTurn].classList.add('active');
        indicators[currentTurn].classList.remove('hidden');
        
        // Update header text
        displayTurn.innerText = `Player ${currentTurn}`;
        displayTurn.style.color = getComputedStyle(document.body).getPropertyValue(`--p${currentTurn}-color`);
    }
    
    function triggerConfetti(playerNum) {
        const colors = {
            1: ['#3b82f6', '#93c5fd'],
            2: ['#ef4444', '#fca5a5'],
            3: ['#10b981', '#6ee7b7']
        };
        
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            colors: colors[playerNum]
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
    spinBtn.addEventListener('click', spin);
    
    // START
    setTimeout(init, 100); // small delay to ensure fonts loaded
});
