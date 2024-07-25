document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');
    const nextCanvas = document.getElementById('nextCanvas');
    const nextContext = nextCanvas.getContext('2d');
    const initialControls = document.getElementById('initial-controls');
    const initialStartButton = document.getElementById('initial-start-button');
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    const gameOverStartButton = document.getElementById('game-over-start-button');
    const gameOverText = document.getElementById('game-over');
    const finalScoreText = document.getElementById('final-score');
    const levelText = document.getElementById('level');
    const gameOverDifficultyButtons = document.querySelectorAll('#game-over-difficulty-buttons .difficulty-button');

    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 30;
    const NEXT_BLOCK_SIZE = 30;
    let dropCounter = 0;
    let dropInterval = 800;
    let lastTime = 0;
    let gameOver = false;

    context.scale(BLOCK_SIZE, BLOCK_SIZE);
    nextContext.scale(NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE);

    const colors = [
        null,
        '#FF0D72', // T
        '#0DC2FF', // I
        '#0DFF72', // S
        '#F538FF', // Z
        '#FF8E0D', // L
        '#FFE138', // O
        '#3877FF'  // J
    ];

    const arena = createMatrix(COLS, ROWS);

    const player = {
        pos: {x: 0, y: 0},
        matrix: null,
        score: 0,
        next: null
    };

    function createMatrix(width, height) {
        const matrix = [];
        while (height--) {
            matrix.push(new Array(width).fill(0));
        }
        return matrix;
    }

    function drawMatrix(matrix, offset, context, fade = false) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = colors[value];
                    if (fade) {
                        context.globalAlpha = 0.5;
                    }
                    context.fillRect(x + offset.x, y + offset.y, 1, 1);
                    context.globalAlpha = 1.0;
                }
            });
        });
    }

    function draw() {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        drawMatrix(arena, {x: 0, y: 0}, context, gameOver);
        if (!gameOver) {
            drawMatrix(player.matrix, player.pos, context);
        }

        nextContext.fillStyle = '#000';
        nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

        drawMatrix(player.next, {x: 1, y: 1}, nextContext);
    }

    function update(time = 0) {
        if (!gameOver) {
            const deltaTime = time - lastTime;
            lastTime = time;
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                playerDrop();
            }
            draw();
            requestAnimationFrame(update);
        } else {
            draw();
        }
    }

    function playerReset() {
        const pieces = 'TJLOSZI';
        if (player.next === null) {
            player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
        }
        player.matrix = player.next;
        player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
        player.pos.y = 0;
        player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

        if (collide(arena, player)) {
            gameOver = true;
            player.matrix = null;
            finalScoreText.innerText = `Final Score: ${player.score}`;
            gameOverText.classList.remove('hidden');
            finalScoreText.classList.remove('hidden');
            levelText.classList.add('hidden');
            draw();
        }
    }

    function createPiece(type) {
        switch (type) {
            case 'T':
                return [
                    [0, 0, 0],
                    [1, 1, 1],
                    [0, 1, 0],
                ];
            case 'O':
                return [
                    [2, 2],
                    [2, 2],
                ];
            case 'L':
                return [
                    [0, 3, 0],
                    [0, 3, 0],
                    [0, 3, 3],
                ];
            case 'J':
                return [
                    [0, 4, 0],
                    [0, 4, 0],
                    [4, 4, 0],
                ];
            case 'I':
                return [
                    [0, 5, 0, 0],
                    [0, 5, 0, 0],
                    [0, 5, 0, 0],
                    [0, 5, 0, 0],
                ];
            case 'S':
                return [
                    [0, 6, 6],
                    [6, 6, 0],
                    [0, 0, 0],
                ];
            case 'Z':
                return [
                    [7, 7, 0],
                    [0, 7, 7],
                    [0, 0, 0],
                ];
        }
    }

    function collide(arena, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }

        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    document.addEventListener('keydown', event => {
        if (!gameOver) {
            switch (event.code) {
                case 'ArrowLeft':
                    playerMove(-1);
                    break;
                case 'ArrowRight':
                    playerMove(1);
                    break;
                case 'ArrowDown':
                    playerDrop();
                    break;
                case 'ArrowUp':
                    playerRotate();
                    break;
                case 'Space':
                    playerDropToBottom();
                    break;
            }
        }
    });

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(arena, player)) {
            player.pos.x -= dir;
        }
    }

    function playerDrop() {
        player.pos.y++;
        dropCounter = 0;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            if (!gameOver) {
                arenaSweep();
                updateScore();
            }
        }
    }

    function playerDropToBottom() {
        while (!collide(arena, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(arena, player);
        playerReset();
        if (!gameOver) {
            arenaSweep();
            updateScore();
        }
    }

    function playerRotate() {
        rotate(player.matrix, 1);
        while (collide(arena, player)) {
            player.pos.x++;
            if (collide(arena, player)) {
                player.pos.x -= 2;
            }
        }
    }

    function arenaSweep() {
        outer: for (let y = arena.length - 1; y > 0; --y) {
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) {
                    continue outer;
                }
            }

            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            ++y;

            player.score += 10;
        }
    }

    function updateScore() {
        document.getElementById('score').innerText = `Score: ${player.score}`;
    }

    function resetGame() {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
        playerReset();
        gameOver = false;
        gameOverText.classList.add('hidden');
        finalScoreText.classList.add('hidden');
        initialControls.classList.add('hidden');
        levelText.classList.remove('hidden');
        update();
    }

    initialStartButton.addEventListener('click', () => {
        resetGame();
    });

    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            dropInterval = parseInt(button.getAttribute('data-speed'));
            levelText.innerText = `Level: ${button.getAttribute('data-level')}`;
            difficultyButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    gameOverStartButton.addEventListener('click', () => {
        resetGame();
        gameOverText.classList.add('hidden');
        finalScoreText.classList.add('hidden');
        gameOverDifficultyButtons.forEach(button => button.classList.remove('selected'));
    });

    gameOverDifficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            dropInterval = parseInt(button.getAttribute('data-speed'));
            levelText.innerText = `Level: ${button.getAttribute('data-level')}`;
            gameOverDifficultyButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    update();
});
