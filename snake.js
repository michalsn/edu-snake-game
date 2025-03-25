const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const playAgainButton = document.getElementById('play-again-button');
const scoreDisplay = document.getElementById('score-display');
const mistakesDisplay = document.getElementById('mistakes');
const finalScoreDisplay = document.getElementById('final-score');
const gameOverDisplay = document.getElementById('game-over');
const gameOverReason = document.getElementById('game-over-reason');
const wordDisplay = document.getElementById('word-display');
const winScreen = document.getElementById('win-screen');
const winScore = document.getElementById('win-score');
const winMistakes = document.getElementById('win-mistakes');
const selectListsModal = document.getElementById('select-lists-modal');
const listsContainer = document.getElementById('lists-container');
const confirmListsButton = document.getElementById('confirm-lists-button');
const cancelListsButton = document.getElementById('cancel-lists-button');
const listSelectError = document.getElementById('list-select-error');
const loadingIndicator = document.getElementById('loading-indicator');
const currentListsDisplay = document.getElementById('current-lists');
const changeListsButtonGameOver = document.getElementById('change-lists-button-gameover');
const changeListsButtonWin = document.getElementById('change-lists-button-win');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let letterOptions = [];
let currentWordIndex = 0;
let completedWords = 0;
let dx = 0;
let dy = 0;
let score = 0;
let mistakes = 0;
let gameRunning = false;
let gameSpeed = 0;
let gameInterval;

// Word lists variables
let availableWordLists = [];
let selectedListIds = [];
let wordList = [];
let returningFromListSelection = false;

// Constants
const WORD_LISTS_DIRECTORY = './word_lists/';
const WORD_LISTS_INDEX = 'word_lists_index.json';

async function init() {
    // Initial draw of empty board
    drawGame();

    setupEventListeners();

    // Load available word lists
    await loadAvailableWordLists();
}

function initGame() {
    // Reset game state
    snake = [
        { x: 10, y: 10 }
    ];
    score = 0;
    mistakes = 0;
    dx = 0;
    dy = 0;
    gameRunning = true;
    gameSpeed = 200;
    currentWordIndex = 0;
    completedWords = 0;

    scoreDisplay.textContent = `Score: ${score}`;
    mistakesDisplay.textContent = `Mistakes: ${mistakes}/3`;

    // Shuffle words
    shuffleArray(wordList);

    displayCurrentWord();
    generateLetterOptions();

    gameOverDisplay.style.display = 'none';
    winScreen.style.display = 'none';

    // Start game loop
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function displayCurrentWord() {
    const currentWord = wordList[currentWordIndex].word;
    wordDisplay.textContent = currentWord;
}

function generateLetterOptions() {
    letterOptions = [];
    const currentWord = wordList[currentWordIndex];

    // Create correct letter option
    letterOptions.push({
        letter: currentWord.correctLetter,
        isCorrect: true,
        x: Math.floor(Math.random() * (tileCount - 2)) + 1,
        y: Math.floor(Math.random() * (tileCount - 2)) + 1
    });

    // Create incorrect letter option
    let x, y;
    do {
        x = Math.floor(Math.random() * (tileCount - 2)) + 1;
        y = Math.floor(Math.random() * (tileCount - 2)) + 1;
    } while (
        // Make sure they don't spawn on top of each other
        (x === letterOptions[0].x && y === letterOptions[0].y) ||
        // Make sure they don't spawn on the snake
        snake.some(segment => segment.x === x && segment.y === y)
    );

    letterOptions.push({
        letter: currentWord.incorrectLetter,
        isCorrect: false,
        x: x,
        y: y
    });
}

function gameLoop() {
    if (!gameRunning) return;

    moveSnake();

    if (checkWallCollisions()) {
        gameOverReason.textContent = "You hit the wall!";
        gameOver();
        return;
    }

    if (checkSelfCollisions()) {
        gameOverReason.textContent = "You hit yourself!";
        gameOver();
        return;
    }

    checkLetterCollisions();

    drawGame();
}

function moveSnake() {
    // Create new head at new position
    const head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy
    };

    // Add new head to start of array
    snake.unshift(head);

    // Remove tail by default (will be kept if food is eaten in checkLetterCollisions)
    snake.pop();
}

function checkWallCollisions() {
    const head = snake[0];
    return (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount);
}

function checkSelfCollisions() {
    const head = snake[0];

    // Check each segment (except head)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }

    return false;
}

// Check if snake is eating a letter
function checkLetterCollisions() {
    const head = snake[0];

    for (let i = 0; i < letterOptions.length; i++) {
        const option = letterOptions[i];

        if (head.x === option.x && head.y === option.y) {
            if (option.isCorrect) {
                score++;
                scoreDisplay.textContent = `Score: ${score}`;

                // Make snake longer
                snake.push({...snake[snake.length-1]});

                completedWords++;

                if (completedWords >= wordList.length) {
                    showWinScreen();
                    return;
                }

                // Move to the next word
                currentWordIndex = (currentWordIndex + 1) % wordList.length;
                displayCurrentWord();

                // Speed up the game slightly
                if (gameSpeed > 70) {
                    gameSpeed -= 2;
                    clearInterval(gameInterval);
                    gameInterval = setInterval(gameLoop, gameSpeed);
                }
            } else {
                mistakes++;
                mistakesDisplay.textContent = `Mistakes: ${mistakes}/3`;

                if (mistakes >= 3) {
                    gameOverReason.textContent = "You made 3 mistakes!";
                    gameOver();
                    return;
                }
            }

            // Clear any existing letter indicators before generating new options
            document.querySelectorAll('.letter-indicator').forEach(el => {
                el.remove();
            });

            generateLetterOptions();
            break;
        }
    }
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw letter options
    letterOptions.forEach(option => {
        // Draw letter background - same color for both options
        ctx.fillStyle = '#ff8c00';
        ctx.fillRect(option.x * gridSize, option.y * gridSize, gridSize, gridSize);

        // Draw a letter
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(option.letter, option.x * gridSize + gridSize/2, option.y * gridSize + gridSize/2);
    });

    // Draw snake
    snake.forEach((segment, index) => {
        // Head is a different color
        if (index === 0) {
            ctx.fillStyle = '#00ff00';
        } else {
            // Gradient from bright green to darker green
            const colorValue = Math.max(100, 255 - index * 15);
            ctx.fillStyle = `rgb(0, ${colorValue}, 0)`;
        }

        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);

        // Draw eyes on the head
        if (index === 0) {
            ctx.fillStyle = '#000';

            // Position eyes based on direction
            if (dx === 1) { // Right
                ctx.fillRect(segment.x * gridSize + gridSize * 0.7, segment.y * gridSize + gridSize * 0.3, gridSize * 0.2, gridSize * 0.2);
                ctx.fillRect(segment.x * gridSize + gridSize * 0.7, segment.y * gridSize + gridSize * 0.7, gridSize * 0.2, gridSize * 0.2);
            } else if (dx === -1) { // Left
                ctx.fillRect(segment.x * gridSize + gridSize * 0.1, segment.y * gridSize + gridSize * 0.3, gridSize * 0.2, gridSize * 0.2);
                ctx.fillRect(segment.x * gridSize + gridSize * 0.1, segment.y * gridSize + gridSize * 0.7, gridSize * 0.2, gridSize * 0.2);
            } else if (dy === 1) { // Down
                ctx.fillRect(segment.x * gridSize + gridSize * 0.3, segment.y * gridSize + gridSize * 0.7, gridSize * 0.2, gridSize * 0.2);
                ctx.fillRect(segment.x * gridSize + gridSize * 0.7, segment.y * gridSize + gridSize * 0.7, gridSize * 0.2, gridSize * 0.2);
            } else if (dy === -1) { // Up
                ctx.fillRect(segment.x * gridSize + gridSize * 0.3, segment.y * gridSize + gridSize * 0.1, gridSize * 0.2, gridSize * 0.2);
                ctx.fillRect(segment.x * gridSize + gridSize * 0.7, segment.y * gridSize + gridSize * 0.1, gridSize * 0.2, gridSize * 0.2);
            } else { // Default (right)
                ctx.fillRect(segment.x * gridSize + gridSize * 0.7, segment.y * gridSize + gridSize * 0.3, gridSize * 0.2, gridSize * 0.2);
                ctx.fillRect(segment.x * gridSize + gridSize * 0.7, segment.y * gridSize + gridSize * 0.7, gridSize * 0.2, gridSize * 0.2);
            }
        }
    });
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameInterval);
    finalScoreDisplay.textContent = `Your score: ${score}`;
    gameOverDisplay.style.display = 'block';

    // Make sure to remove all letter indicators
    document.querySelectorAll('.letter-indicator').forEach(el => {
        el.remove();
    });
}

function showWinScreen() {
    gameRunning = false;
    clearInterval(gameInterval);

    winScore.textContent = `Your final score: ${score}`;
    winMistakes.textContent = `Mistakes made: ${mistakes}/3`;

    winScreen.style.display = 'block';

    wordDisplay.textContent = "VICTORY!";
}

async function loadAvailableWordLists() {
    try {
        loadingIndicator.style.display = 'block';

        const response = await fetch(`${WORD_LISTS_DIRECTORY}${WORD_LISTS_INDEX}`);

        if (!response.ok) {
            throw new Error(`Failed to load word lists index: ${response.status}`);
        }

        availableWordLists = await response.json();

        populateWordListsModal();
    } catch (error) {
        console.error("Error loading word lists:", error);
        alert("Failed to load word lists. Please try again later.");
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

function populateWordListsModal() {
    listsContainer.innerHTML = '';

    availableWordLists.forEach(list => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        listItem.dataset.id = list.id;

        if (selectedListIds.includes(list.id)) {
            listItem.classList.add('selected');
        }

        listItem.innerHTML = `
                <h3>${list.name}</h3>
                <p>${list.description}</p>
            `;

        // Make items selectable
        listItem.addEventListener('click', () => {
            listItem.classList.toggle('selected');

            // Update selectedListIds
            if (listItem.classList.contains('selected')) {
                if (!selectedListIds.includes(list.id)) {
                    selectedListIds.push(list.id);
                }
            } else {
                selectedListIds = selectedListIds.filter(id => id !== list.id);
            }

            listSelectError.style.display = 'none';
        });

        listsContainer.appendChild(listItem);
    });
}

async function loadSelectedWordLists() {
    loadingIndicator.style.display = 'block';

    try {
        wordList = [];

        for (const listId of selectedListIds) {
            const listInfo = availableWordLists.find(list => list.id === listId);

            if (listInfo) {
                const response = await fetch(`${WORD_LISTS_DIRECTORY}${listInfo.path}`);

                if (!response.ok) {
                    console.error(`Failed to load word list ${listInfo.name}: ${response.status}`);
                    continue;
                }

                const listWords = await response.json();

                wordList = wordList.concat(listWords);
            }
        }

        updateCurrentListsDisplay();

        return wordList.length;
    } catch (error) {
        console.error("Error loading word lists:", error);
        return 0;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

function updateCurrentListsDisplay() {
    if (selectedListIds.length === 0) {
        currentListsDisplay.textContent = "No word lists selected";
        return;
    }

    const selectedLists = selectedListIds.map(id => {
        const list = availableWordLists.find(list => list.id === id);
        return list ? list.name : id;
    });

    currentListsDisplay.textContent = `Selected lists: ${selectedLists.join(', ')}`;
}

function setupEventListeners() {
    startButton.addEventListener('click', () => {
        if (!gameRunning) {
            showListSelectionModal();
        }
    });

    restartButton.addEventListener('click', () => {
        if (wordList.length > 0) {
            initGame();
        } else {
            gameOverDisplay.style.display = 'none';
            showListSelectionModal();
        }
    });

    playAgainButton.addEventListener('click', () => {
        if (wordList.length > 0) {
            initGame();
        } else {
            winScreen.style.display = 'none';
            showListSelectionModal();
        }
    });

    changeListsButtonGameOver.addEventListener('click', () => {
        gameOverDisplay.style.display = 'none';
        showListSelectionModal();
    });

    changeListsButtonWin.addEventListener('click', () => {
        winScreen.style.display = 'none';
        showListSelectionModal();
    });

    confirmListsButton.addEventListener('click', async () => {
        if (selectedListIds.length === 0) {
            listSelectError.style.display = 'block';
            return;
        }

        const wordCount = await loadSelectedWordLists();

        if (wordCount > 0) {
            selectListsModal.style.display = 'none';
            initGame();
        } else {
            alert("No words could be loaded. Please try again or select different lists.");
        }
    });

    cancelListsButton.addEventListener('click', () => {
        // Only hide if we have words already and are changing lists
        if (wordList.length > 0 && returningFromListSelection) {
            selectListsModal.style.display = 'none';
            returningFromListSelection = false;
        }
    });

    // Keyboard input handling
    document.addEventListener('keydown', (event) => {
        if (!gameRunning) return;

        // Prevent default behavior for arrow keys
        if (event.key.startsWith('Arrow')) {
            event.preventDefault();
        }

        // Handle direction change
        // Don't allow reversing a direction (e.g., can't go right if going left)
        switch (event.key) {
            case 'ArrowUp':
                if (dy === 0) { // Only if not moving vertically
                    dx = 0;
                    dy = -1;
                }
                break;
            case 'ArrowDown':
                if (dy === 0) {
                    dx = 0;
                    dy = 1;
                }
                break;
            case 'ArrowLeft':
                if (dx === 0) {
                    dx = -1;
                    dy = 0;
                }
                break;
            case 'ArrowRight':
                if (dx === 0) {
                    dx = 1;
                    dy = 0;
                }
                break;
        }
    });
}

function showListSelectionModal() {
    // If changing lists after game has been played
    if (gameRunning || wordList.length > 0) {
        returningFromListSelection = true;
    }

    populateWordListsModal();

    selectListsModal.style.display = 'block';
}

init();