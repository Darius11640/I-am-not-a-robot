(function() {
    // ---------- Game State ----------
    let score = 0;
    let round = 0;
    let currentPuzzle = null;
    let selectedCells = new Set();
    let gameActive = true;
    let pendingNextRound = false;

    const levelTypes = ['classic', 'inverse', 'oddOneOut', 'category'];
    let levelIndex = 0;
    let levelName = 'Classic';

    const emojiLibrary = {
        animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
        vehicles: ['🚗', '🚌', '🚲', '🛵', '🏍️', '✈️', '🚁', '⛵', '🚤', '🚂', '🚜', '🛴'],
        food: ['🍎', '🍕', '🍔', '🍦', '☕', '🍩', '🍪', '🧁', '🍇', '🍓', '🥕', '🍿'],
        nature: ['🌲', '🌸', '☀️', '🌈', '🌻', '🍀', '🌵', '🍄', '🌊', '⭐'],
        buildings: ['🏠', '🏫', '🏥', '🏪', '⛪', '🏢', '🏛️', '🏩'],
        symbols: ['⚠️', '♻️', '❤️', '✅', '🚫', '🔞', '☢️', '💯'],
    };

    const allEmojis = Object.values(emojiLibrary).flat();

    // DOM
    const widget = document.getElementById('recaptchaWidget');
    const checkboxArea = document.getElementById('checkboxArea');
    const challengeArea = document.getElementById('challengeArea');
    const challengePrompt = document.getElementById('challengePrompt');
    const imageGrid = document.getElementById('imageGrid');
    const verifyBtn = document.getElementById('verifyBtn');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const roundDisplay = document.getElementById('roundDisplay');
    const messageOverlay = document.getElementById('messageOverlay');
    const messageBadge = document.getElementById('messageBadge');
    const resetBtn = document.getElementById('resetBtn');

    // Level type display
    const levelTypeDisplay = document.createElement('div');
    levelTypeDisplay.style.fontSize = '0.9rem';
    levelTypeDisplay.style.marginTop = '5px';
    levelTypeDisplay.style.color = '#555';
    document.querySelector('.scoreboard').insertAdjacentElement('afterend', levelTypeDisplay);

    function updateLevelDisplay() {
        levelTypeDisplay.textContent = `Level Type: ${levelName}`;
    }

    function showMessage(text, type) {
        messageBadge.textContent = text;
        messageBadge.className = `message-badge ${type} show`;
        setTimeout(() => messageBadge.classList.remove('show'), 1800);
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Puzzle generators
    function generateClassicPuzzle() {
        const categories = Object.keys(emojiLibrary);
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const items = emojiLibrary[cat];
        const target = items[Math.floor(Math.random() * items.length)];
        const gridSize = 9;
        const targetCount = Math.floor(Math.random() * 3) + 2;
        const cells = new Array(gridSize).fill(null);
        const targetIndices = new Set();
        while (targetIndices.size < targetCount) {
            targetIndices.add(Math.floor(Math.random() * gridSize));
        }
        targetIndices.forEach(idx => { cells[idx] = target; });
        const distractors = items.filter(e => e !== target);
        for (let i = 0; i < gridSize; i++) {
            if (cells[i] === null) cells[i] = distractors[Math.floor(Math.random() * distractors.length)];
        }
        return { type: 'classic', targetEmoji: target, targetLabel: target, grid: cells, solution: new Set(targetIndices) };
    }

    function generateInversePuzzle() {
        const puzzle = generateClassicPuzzle();
        puzzle.type = 'inverse';
        const allIndices = new Set([...Array(9).keys()]);
        puzzle.solution = new Set([...allIndices].filter(i => !puzzle.solution.has(i)));
        return puzzle;
    }

    function generateOddOneOutPuzzle() {
        const oddIndex = Math.floor(Math.random() * 9);
        const baseEmoji = allEmojis[Math.floor(Math.random() * allEmojis.length)];
        let oddEmoji;
        do { oddEmoji = allEmojis[Math.floor(Math.random() * allEmojis.length)]; } while (oddEmoji === baseEmoji);
        const cells = Array(9).fill(baseEmoji);
        cells[oddIndex] = oddEmoji;
        return { type: 'oddOneOut', grid: cells, solution: new Set([oddIndex]), targetLabel: 'the different one', targetEmoji: oddEmoji };
    }

    function generateCategoryPuzzle() {
        const categories = Object.keys(emojiLibrary);
        const targetCategory = categories[Math.floor(Math.random() * categories.length)];
        const otherCategories = categories.filter(c => c !== targetCategory);
        const gridSize = 9;
        const targetCount = Math.floor(Math.random() * 3) + 3;
        const cells = new Array(gridSize).fill(null);
        const targetIndices = new Set();
        while (targetIndices.size < targetCount) targetIndices.add(Math.floor(Math.random() * gridSize));
        const targetItems = emojiLibrary[targetCategory];
        targetIndices.forEach(idx => { cells[idx] = targetItems[Math.floor(Math.random() * targetItems.length)]; });
        for (let i = 0; i < gridSize; i++) {
            if (cells[i] === null) {
                const randomCat = otherCategories[Math.floor(Math.random() * otherCategories.length)];
                cells[i] = emojiLibrary[randomCat][Math.floor(Math.random() * emojiLibrary[randomCat].length)];
            }
        }
        return { type: 'category', targetCategory, grid: cells, solution: new Set(targetIndices), targetLabel: targetCategory };
    }

    function generatePuzzle() {
        const type = levelTypes[levelIndex];
        levelName = type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1');
        updateLevelDisplay();
        if (type === 'classic') return generateClassicPuzzle();
        if (type === 'inverse') return generateInversePuzzle();
        if (type === 'oddOneOut') return generateOddOneOutPuzzle();
        if (type === 'category') return generateCategoryPuzzle();
    }

    function renderChallenge(puzzle) {
        if (puzzle.type === 'classic') challengePrompt.innerHTML = `Select all squares with <strong>${puzzle.targetEmoji}</strong>`;
        else if (puzzle.type === 'inverse') challengePrompt.innerHTML = `Select all squares that <strong>do NOT</strong> contain <strong>${puzzle.targetEmoji}</strong>`;
        else if (puzzle.type === 'oddOneOut') challengePrompt.innerHTML = `Select the square that is <strong>different</strong>`;
        else if (puzzle.type === 'category') challengePrompt.innerHTML = `Select all <strong>${puzzle.targetCategory}</strong>`;

        imageGrid.innerHTML = '';
        puzzle.grid.forEach((emoji, index) => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.textContent = emoji;
            cell.dataset.index = index;
            cell.addEventListener('click', () => toggleCell(index, cell));
            imageGrid.appendChild(cell);
        });
        selectedCells.clear();
        verifyBtn.disabled = true;
    }

    function toggleCell(index, cellElement) {
        if (!gameActive || pendingNextRound) return;
        if (currentPuzzle && currentPuzzle.type === 'oddOneOut') {
            document.querySelectorAll('.grid-cell.selected').forEach(c => c.classList.remove('selected'));
            selectedCells.clear();
            selectedCells.add(index);
            cellElement.classList.add('selected');
        } else {
            if (selectedCells.has(index)) {
                selectedCells.delete(index);
                cellElement.classList.remove('selected');
            } else {
                selectedCells.add(index);
                cellElement.classList.add('selected');
            }
        }
        verifyBtn.disabled = selectedCells.size === 0;
    }

    function resetToCheckbox() {
        checkboxArea.classList.remove('checked', 'verifying');
        challengeArea.classList.remove('active');
        selectedCells.clear();
        pendingNextRound = false;
        gameActive = true;
        checkboxArea.querySelector('.checkbox-text').textContent = "I'm not a robot";
    }

    function verifySelection() {
        if (!gameActive || pendingNextRound || !currentPuzzle) return;
        const solution = currentPuzzle.solution;
        if (selectedCells.size !== solution.size) { failVerification(); return; }
        for (let idx of selectedCells) { if (!solution.has(idx)) { failVerification(); return; } }
        successVerification();
    }

    function successVerification() {
        gameActive = false;
        pendingNextRound = true;
        score += 10;
        round++;
        updateScoreboard();
        showMessage('✅ Human! +10', 'success');
        checkboxArea.classList.add('checked');
        checkboxArea.classList.remove('verifying');
        checkboxArea.querySelector('.checkbox-text').textContent = 'You are human!';
        challengeArea.classList.remove('active');
        levelIndex = (levelIndex + 1) % levelTypes.length;
        setTimeout(() => {
            if (!gameActive && pendingNextRound) {
                checkboxArea.classList.remove('checked');
                checkboxArea.querySelector('.checkbox-text').textContent = "I'm not a robot";
                pendingNextRound = false;
                gameActive = true;
                updateLevelDisplay();
            }
        }, 2200);
    }

    function failVerification() {
        gameActive = false;
        pendingNextRound = false;
        showMessage('🤖 Robot detected!', 'error');
        widget.style.transition = '0.1s';
        widget.style.boxShadow = '0 0 0 3px #ea4335';
        setTimeout(() => widget.style.boxShadow = 'var(--box-shadow)', 300);
        setTimeout(resetGame, 2000);
    }

    function resetGame() {
        score = 0;
        round = 0;
        levelIndex = 0;
        levelName = 'Classic';
        updateScoreboard();
        updateLevelDisplay();
        resetToCheckbox();
        gameActive = true;
        pendingNextRound = false;
        currentPuzzle = null;
        challengeArea.classList.remove('active');
        widget.style.boxShadow = 'var(--box-shadow)';
        imageGrid.innerHTML = '';
        verifyBtn.disabled = true;
    }

    function updateScoreboard() {
        scoreDisplay.textContent = score;
        roundDisplay.textContent = round;
    }

    function onCheckboxClick() {
        if (!gameActive || pendingNextRound) return;
        if (checkboxArea.classList.contains('checked') || checkboxArea.classList.contains('verifying')) return;
        checkboxArea.classList.add('verifying');
        checkboxArea.querySelector('.checkbox-text').textContent = 'Verifying...';
        currentPuzzle = generatePuzzle();
        renderChallenge(currentPuzzle);
        setTimeout(() => {
            if (!gameActive) return;
            checkboxArea.classList.remove('verifying');
            challengeArea.classList.add('active');
            checkboxArea.querySelector('.checkbox-text').textContent = "I'm not a robot";
        }, 800);
    }

    checkboxArea.addEventListener('click', onCheckboxClick);
    verifyBtn.addEventListener('click', verifySelection);
    resetBtn.addEventListener('click', () => { resetGame(); showMessage('Game reset', 'success'); });
    document.querySelectorAll('.fake-links span').forEach(el => el.addEventListener('click', e => e.stopPropagation()));

    updateScoreboard();
    updateLevelDisplay();
    resetToCheckbox();
})();