// Hexagonal Game of Life background for the CV page
// Uses a hex grid where each cell has 6 neighbours instead of 8

const canvas = document.getElementById('hex-game-of-life');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Hex sizing
// Using flat-top hexagons
// hexSize is the distance from center to vertex
const hexSize = window.innerWidth < 600 ? 5 : 8;
const hexWidth = hexSize * 2;
const hexHeight = Math.sqrt(3) * hexSize;

// Grid dimensions - how many hexes fit
// Flat-top hex: columns spaced by 3/2 * hexSize, rows spaced by hexHeight
// Odd columns offset down by hexHeight/2
const cols = Math.ceil(canvas.width / (hexSize * 1.5)) + 1;
const rows = Math.ceil(canvas.height / hexHeight) + 1;

const prob_init_alive = 0.20;

// Create grid
let grid = [];
for (let q = 0; q < cols; q++) {
    grid[q] = [];
    for (let r = 0; r < rows; r++) {
        grid[q][r] = Math.random() < prob_init_alive ? 1 : 0;
    }
}

// Convert hex grid coordinates to pixel center
function hexToPixel(q, r) {
    let x = hexSize * 1.5 * q;
    let y = hexHeight * r;
    // Odd columns are offset down
    if (q % 2 === 1) {
        y += hexHeight / 2;
    }
    return { x: x, y: y };
}

// Draw a single flat-top hexagon at pixel center (cx, cy)
function drawHexagon(cx, cy, alive) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        let angle = Math.PI / 180 * (60 * i);
        let hx = cx + hexSize * Math.cos(angle);
        let hy = cy + hexSize * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(hx, hy);
        } else {
            ctx.lineTo(hx, hy);
        }
    }
    ctx.closePath();

    if (alive) {
        ctx.fillStyle = '#6eb5ff';
        ctx.fill();
    }

    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 0.5;
    ctx.stroke();
}

// Get the 6 neighbours of a hex cell (offset coordinates, flat-top)
// For flat-top hexagons with offset coords (odd-q offset):
//   Even columns and odd columns have different neighbour offsets
function getNeighbours(q, r) {
    let neighbours = [];
    let directions;

    if (q % 2 === 0) {
        // Even column
        directions = [
            [+1, -1], [+1, 0],  // right-up, right-down
            [-1, -1], [-1, 0],  // left-up, left-down
            [0, -1],  [0, +1]   // up, down
        ];
    } else {
        // Odd column
        directions = [
            [+1, 0], [+1, +1],  // right-up, right-down
            [-1, 0], [-1, +1],  // left-up, left-down
            [0, -1], [0, +1]    // up, down
        ];
    }

    for (let i = 0; i < directions.length; i++) {
        let dq = directions[i][0];
        let dr = directions[i][1];
        // Wrap around edges
        let nq = (q + dq + cols) % cols;
        let nr = (r + dr + rows) % rows;
        neighbours.push(grid[nq][nr]);
    }

    return neighbours;
}

function countAliveNeighbours(q, r) {
    let neighbours = getNeighbours(q, r);
    let count = 0;
    for (let i = 0; i < neighbours.length; i++) {
        if (neighbours[i] === 1) count++;
    }
    return count;
}

// Hex Game of Life rules (B2/S34)
// - Birth: dead cell with exactly 2 neighbours becomes alive
// - Survival: alive cell with 3 or 4 neighbours survives
function nextGeneration() {
    let newGrid = [];
    for (let q = 0; q < cols; q++) {
        newGrid[q] = [];
        for (let r = 0; r < rows; r++) {
            let alive = countAliveNeighbours(q, r);
            if (grid[q][r] === 1) {
                // Alive cell: survive with 3 or 4 neighbours
                newGrid[q][r] = (alive === 3 || alive === 4) ? 1 : 0;
            } else {
                // Dead cell: birth with exactly 2 neighbours
                newGrid[q][r] = (alive === 2) ? 1 : 0;
            }
        }
    }
    grid = newGrid;
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let q = 0; q < cols; q++) {
        for (let r = 0; r < rows; r++) {
            let pos = hexToPixel(q, r);
            drawHexagon(pos.x, pos.y, grid[q][r] === 1);
        }
    }
}

// Scroll-driven generation updates
let lastScrollY = window.scrollY;
let scrollAccumulator = 0;
const scrollThreshold = 50;

function update() {
    drawGrid();
}

// Reseed button
document.getElementById('reseed-button').addEventListener('click', function() {
    for (let q = 0; q < cols; q++) {
        for (let r = 0; r < rows; r++) {
            grid[q][r] = Math.random() < prob_init_alive ? 1 : 0;
        }
    }
    update();
});

// Fade sections in/out based on viewport position
function updateFade() {
    var elements = document.querySelectorAll('h1, section');
    var vh = window.innerHeight;
    var fadeDistance = vh * 0.3;

    elements.forEach(function(el) {
        var rect = el.getBoundingClientRect();

        var fadeIn = 1;
        if (rect.top > vh) {
            fadeIn = 0;
        } else if (rect.top > vh - fadeDistance) {
            fadeIn = (vh - rect.top) / fadeDistance;
        }

        var fadeOut = 1;
        if (rect.bottom < 0) {
            fadeOut = 0;
        } else if (rect.bottom < fadeDistance) {
            fadeOut = rect.bottom / fadeDistance;
        }

        el.style.opacity = Math.min(fadeIn, fadeOut);
    });
}

// Highlight nav links when their section is in view
var navLinks = document.querySelectorAll('nav a[href^="#"]');

function updateNavHighlight() {
    var vh = window.innerHeight;

    navLinks.forEach(function(link) {
        var href = link.getAttribute('href');
        var target = document.getElementById(href.substring(1));
        if (!target) return;

        var rect = target.getBoundingClientRect();
        var isActive = rect.top < vh && rect.bottom > 0;

        if (isActive) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Scroll progress bars within sections
function updateScrollProgress() {
    var wrappers = document.querySelectorAll('.sticky-wrapper');

    wrappers.forEach(function(wrapper) {
        var section = wrapper.querySelector('section');
        var progressBar = section.querySelector('.scroll-progress-bar');
        if (!progressBar) return;

        var wrapperRect = wrapper.getBoundingClientRect();
        var wrapperHeight = wrapper.offsetHeight;
        var viewportHeight = window.innerHeight;

        var progress = 0;
        if (wrapperRect.top <= 0) {
            progress = Math.abs(wrapperRect.top) / (wrapperHeight - viewportHeight);
            progress = Math.min(progress, 1);
        }

        progressBar.style.width = (progress * 100) + '%';
    });
}

// Page progress bar (mobile)
var pageProgressBar = document.getElementById('page-progress-bar');
var lastWrapper = document.querySelector('.sticky-wrapper:last-of-type');
var progressEndPoint = lastWrapper.offsetTop + lastWrapper.offsetHeight - window.innerHeight;

// Main scroll handler
window.addEventListener('scroll', function() {
    var scrollDelta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;

    scrollAccumulator += Math.abs(scrollDelta);

    if (scrollAccumulator >= scrollThreshold) {
        nextGeneration();
        scrollAccumulator = 0;
    }

    update();
    updateFade();
    updateNavHighlight();
    updateScrollProgress();

    // Page progress
    var scrollPercentage = (window.scrollY / progressEndPoint) * 100;
    var clampedPercentage = Math.min(100, Math.max(0, scrollPercentage));
    pageProgressBar.style.width = clampedPercentage + '%';
});

// Infinite scroll
window.addEventListener('scroll', function() {
    var scrollBottom = window.scrollY + window.innerHeight;
    var docHeight = document.body.scrollHeight;

    if (docHeight - scrollBottom < 2000) {
        document.body.style.minHeight = (docHeight + 1000) + 'px';
    }
});

// Initial render
update();
updateFade();
updateNavHighlight();
