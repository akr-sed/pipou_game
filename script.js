// Game canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const scoreElement = document.getElementById('score');
const swipeInstructions = document.getElementById('swipe-instructions');

// Set canvas size based on viewport
function resizeCanvas() {
    const containerWidth = canvas.parentElement.clientWidth;
    const size = Math.min(containerWidth, window.innerHeight * 0.7);
    
    canvas.width = size;
    canvas.height = size;
    
    // Redraw if game is already running
    if (gameRunning) {
        render();
    }
}

// Initial canvas sizing
resizeCanvas();

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
    swipeInstructions.classList.remove('hidden');
    setTimeout(() => {
        swipeInstructions.classList.add('visible');
        setTimeout(() => {
            swipeInstructions.classList.remove('visible');
        }, 3000);
    }, 500);
}

// Game settings
let gridSize; // Will be calculated dynamically
let gridWidth;
let gridHeight;

// Update grid dimensions
function updateGridDimensions() {
    gridSize = canvas.width / 20; // 20 cells across
    gridWidth = canvas.width / gridSize;
    gridHeight = canvas.height / gridSize;
}

// Call update on resize
updateGridDimensions();

// Game state
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let gameRunning = false;
let gameSpeed = 170; // milliseconds
let score = 0;
let gameLoop;

// Custom assets - Replace these file paths with your own custom images/sounds
// ===================================================================
// TO CUSTOMIZE: Replace these image/sound files with your own files
// ===================================================================
const snakeHeadImage = new Image();
snakeHeadImage.src = 'pipou.jpg'; // REPLACE WITH YOUR CUSTOM SNAKE HEAD IMAGE

const foodImage = new Image();
foodImage.src = 'maninou.jpg'; // REPLACE WITH YOUR CUSTOM FOOD IMAGE

const eatSound = new Audio();
eatSound.src = 'bayna.mp3'; // REPLACE WITH YOUR CUSTOM EATING SOUND

const gameOverSound = new Audio();
gameOverSound.src = 'pipou_sound.mp3'; // REPLACE WITH YOUR CUSTOM GAME OVER SOUND
// ===================================================================

// Initialize the game
function initGame() {
    // Reset game state
    updateGridDimensions(); // Ensure grid is properly sized
    
    snake = [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreElement.textContent = score;
    
    // Generate initial food
    spawnFood();
    
    // Start the game loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameUpdate, gameSpeed);
    gameRunning = true;
}

// Generate food at a random position
function spawnFood() {
    // Generate random position that doesn't overlap with snake
    let validPosition = false;
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // Check if food overlaps with snake
        validPosition = true;
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                validPosition = false;
                break;
            }
        }
    }
}

// Main game update logic
function gameUpdate() {
    // Update direction
    direction = nextDirection;
    
    // Move snake based on direction
    const head = { ...snake[0] };
    
    switch (direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // Check collision with walls
    if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
        gameOver();
        return;
    }
    
    // Check collision with self
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }
    
    // Add new head to snake
    snake.unshift(head);
    
    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
        // Increase score and spawn new food
        score += 10;
        scoreElement.textContent = score;
        spawnFood();
        
        // Play eating sound
        eatSound.currentTime = 0;
        eatSound.play().catch(e => console.log("Audio play error:", e));
        
        // Increase game speed slightly
        if (gameSpeed > 60) {
            gameSpeed -= 2;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameUpdate, gameSpeed);
        }
    } else {
        // Remove tail segment if no food was eaten
        snake.pop();
    }
    
    // Render game
    render();
}

// Render the game
function render() {
    // Clear canvas
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid (optional)
    ctx.strokeStyle = '#333';
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            ctx.strokeRect(x * gridSize, y * gridSize, gridSize, gridSize);
        }
    }
    
    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        if (i === 0) {
            // Draw the custom head image
            ctx.save();
            
            // Rotate head image based on direction
            let rotationAngle = 0;
            switch (direction) {
                case 'up': rotationAngle = -Math.PI/2; break;
                case 'down': rotationAngle = Math.PI/2; break;
                case 'left': rotationAngle = Math.PI; break;
                case 'right': rotationAngle = 0; break;
            }
            
            // Center of the grid cell
            const centerX = snake[i].x * gridSize + gridSize/2;
            const centerY = snake[i].y * gridSize + gridSize/2;
            
            // Translate to center, rotate, then draw
            ctx.translate(centerX, centerY);
            ctx.rotate(rotationAngle);
            ctx.drawImage(
                snakeHeadImage, 
                -gridSize/2, 
                -gridSize/2, 
                gridSize, 
                gridSize
            );
            
            ctx.restore();
        } else {
            // Draw regular snake body
            ctx.fillStyle = i % 2 === 0 ? '#4CAF50' : '#2E7D32';
            ctx.fillRect(
                snake[i].x * gridSize, 
                snake[i].y * gridSize, 
                gridSize, 
                gridSize
            );
        }
    }
    
    // Draw food
    ctx.drawImage(
        foodImage, 
        food.x * gridSize, 
        food.y * gridSize, 
        gridSize, 
        gridSize
    );
}

// Handle game over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    gameOverSound.play().catch(e => console.log("Audio play error:", e));
    
    // Display game over message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const fontSize = Math.max(24, Math.floor(canvas.width / 12));
    
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
    
    ctx.font = `${fontSize / 2}px Arial`;
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + fontSize);
    ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + fontSize * 2);
}

// Handle keyboard input for desktop
document.addEventListener('keydown', function(e) {
    if (!gameRunning && e.key === ' ') {
        initGame();
        return;
    }
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') nextDirection = 'right';
            break;
    }
    
    // Prevent scrolling with arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

// Touch controls for mobile (swipe gestures)
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let lastSwipeTime = 0;

// Add touch event listeners to the canvas
canvas.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    e.preventDefault(); // Prevent scrolling when touching the canvas
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
    // Prevent scrolling
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
    // Don't process swipes too quickly (prevent accidental double swipes)
    const now = Date.now();
    if (now - lastSwipeTime < 100) return;
    
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
    lastSwipeTime = now;
    
    e.preventDefault(); // Prevent other actions
}, { passive: false });

// Start the game on tap if not already running
canvas.addEventListener('click', function() {
    if (!gameRunning) {
        initGame();
    }
});

// Handle swipe gestures
function handleSwipe() {
    const xDiff = touchStartX - touchEndX;
    const yDiff = touchStartY - touchEndY;
    
    // Only process substantial swipes (prevent tiny accidental swipes)
    const minSwipeDistance = 30;
    
    // Detect which direction has the greatest movement
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        // Horizontal swipe
        if (Math.abs(xDiff) < minSwipeDistance) return;
        
        if (xDiff > 0) {
            // Swipe left
            if (direction !== 'right') nextDirection = 'left';
        } else {
            // Swipe right
            if (direction !== 'left') nextDirection = 'right';
        }
    } else {
        // Vertical swipe
        if (Math.abs(yDiff) < minSwipeDistance) return;
        
        if (yDiff > 0) {
            // Swipe up
            if (direction !== 'down') nextDirection = 'up';
        } else {
            // Swipe down
            if (direction !== 'up') nextDirection = 'down';
        }
    }
}

// Start button event listener
startBtn.addEventListener('click', function() {
    initGame();
});

// Handle window resize
window.addEventListener('resize', function() {
    resizeCanvas();
    updateGridDimensions();
    if (gameRunning) {
        render();
    }
});

// Prevent page scrolling when playing on mobile
document.body.addEventListener('touchmove', function(e) {
    if (gameRunning) {
        e.preventDefault();
    }
}, { passive: false });

// Initial render
render();