// This JavaScript file is used to generate Conway's Game of Life as 
// a background graphic

//Rules (HighLife varian - B36/S23)
// 1. Underpopulation - cell with less than 2 neighbours dies 
// 2. Living - cell with 2 or 3 live neighbours lives on 
// 3. Overpopulation - Cell with more than 3 live neighbours dies 
// 4. Reproduction - a dead cell with 3 or 6 neighbours becomes alive 

// get canvas element from html file, set up for drawing 
const canvas = document.getElementById('game-of-life');
const ctx = canvas.getContext('2d'); //drawing tool, 2d for 2d graphics

//set canvas size to fill window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// cell sixe in pixels
const cellSize = window.innerWidth < 600 ? 4 : 6;


// How many cells fit page 
const cols = Math.floor(canvas.width / cellSize);
const rows = Math.floor(canvas.height / cellSize);

const prob_init_alive = 0.15;

// Competition mode: two species compete for space
let competitionMode = false;
const GREEN_PROB = 0.15; // probability for green cells during sprinkle

// create grid as array of arrays 
// each cell is alive (1) or dead (0)
let grid = [];
for (let y = 0; y < rows; y++) {
    grid[y] = [];
    for (let x = 0; x < cols; x++) {
        //initialise cells
        grid[y][x] = Math.random() < prob_init_alive ? 1 : 0; // shorthand if else 
    }
}


// draw grid 
function drawGrid() {
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 0.5;

    //Draw vertical lines
    for (let x =0; x <= cols; x++){
        ctx.beginPath(); // start a path
        ctx.moveTo(x * cellSize, 0); // move to a point
        ctx.lineTo(x * cellSize, canvas.height); //draw line to another point
        ctx.stroke(); //render the line drawn
    }

    //Draw horizontal lines
    for (let y=0; y<=rows; y++){
        ctx.beginPath();
        ctx.moveTo(y * cellSize, 0);
        ctx.lineTo(y*cellSize, canvas.width);
        ctx.stroke();
    }
}


function drawCells() {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++){
            if (grid[y][x] === 1) {
                ctx.fillStyle = '#6eb5ff'; // blue species
                ctx.fillRect(x * cellSize, y*cellSize, cellSize, cellSize)
            } else if (grid[y][x] === 2) {
                ctx.fillStyle = '#66cc88'; // green species
                ctx.fillRect(x * cellSize, y*cellSize, cellSize, cellSize)
            }
        }
    }
}


//how many of 8 surrounding cells are alive?
// returns { blue, green, total } counts for each species
function countNeighbours(grid, x, y){
    let blue = 0;
    let green = 0;
    for (let dy = -1; dy <=1; dy ++){
        for (let dx = -1; dx <=1; dx ++){
            if (dy ===0 && dx === 0) continue; // skip cell itself

            //wrap around edges, so right edge interacts with left edge
            let ny = (y + dy + rows) % rows;
            let nx = (x + dx + cols) % cols;

            if (grid[ny][nx] === 1) blue++;
            else if (grid[ny][nx] === 2) green++;
        }
    }
    return { blue: blue, green: green, total: blue + green };
}



// Competition rules: mutual predation between blue and green species
function competitionRules(cell, n) {
    // cell is 0 (dead), 1 (blue), or 2 (green)
    // n is { blue, green, total }

    if (cell === 0) {
        // DEAD CELL - birth rules
        // born as species with 3 or 6 own-kind neighbours
        // if both qualify, cell stays dead (contested territory)
        let blueBirth = (n.blue === 3 || n.blue === 6);
        let greenBirth = (n.green === 3 || n.green === 6);

        if (blueBirth && !greenBirth) return 1;
        if (greenBirth && !blueBirth) return 2;
        return 0; // contested or neither qualifies
    }

    // ALIVE CELL - survival and conversion rules
    let ownCount = (cell === 1) ? n.blue : n.green;
    let enemyCount = (cell === 1) ? n.green : n.blue;
    let enemySpecies = (cell === 1) ? 2 : 1;

    // Conversion: enemy has 3+ neighbours AND own kind has <2 (isolated and overwhelmed)
    let converted = (enemyCount >= 3 && ownCount < 2);
    if (converted) return enemySpecies;

    // Survival: 2 or 3 neighbours of own kind
    let survives = (ownCount === 2 || ownCount === 3);
    if (survives) return cell;

    return 0; // dies from underpopulation or overpopulation
}

function nextGeneration() {
    let newGrid = [];
    for (let y=0; y<rows; y++){
        newGrid[y] = [];
        for (let x=0; x<cols; x++){
            let n = countNeighbours(grid,x,y)
            if (!competitionMode) {
                // Original HighLife rules (B36/S23) using total count
                if (grid[y][x] ===1) {
                    newGrid[y][x] = (n.total ===2 || n.total===3) ? 1 : 0;
                } else{
                    newGrid[y][x] = (n.total===3 || n.total ===6) ? 1 : 0;
                }
            } else {
                // Competition mode: mutual predation rules
                newGrid[y][x] = competitionRules(grid[y][x], n);
            }
        }
    }
    grid = newGrid;
}

//Track how far we've scrolled since last generation update 
let lastScrollY = window.scrollY;
let scrollAccumulator = 0;
const scrollThreshold = 50; //update generation every 50px of scroll

function update(){
    ctx.clearRect(0,0,canvas.width,canvas.height)
    drawGrid();
    drawCells();
}

//Reseed: sprinkle random new cells
document.getElementById('reseed-button').addEventListener('click',function(){
    for (let y=0; y <rows; y++){
        for (let x = 0; x <cols; x++){
            if (competitionMode) {
                // In competition mode, randomly assign blue, green, or dead
                let r = Math.random();
                if (r < prob_init_alive) {
                    grid[y][x] = 1; // blue
                } else if (r < prob_init_alive + GREEN_PROB) {
                    grid[y][x] = 2; // green
                } else {
                    grid[y][x] = 0; // dead
                }
            } else {
                grid[y][x] = Math.random() < prob_init_alive ? 1 : 0;
            }
        }
    }
    update();
});

// Competition button: toggle competing species mode
const competitionButton = document.getElementById('competition-button');
const playSection = document.getElementById('play-the-gol');

competitionButton.addEventListener('click', function(){
    if (!competitionMode) {
        // Activate: sprinkle green cells onto empty spaces
        competitionMode = true;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (grid[y][x] === 0 && Math.random() < GREEN_PROB) {
                    grid[y][x] = 2;
                }
            }
        }
        this.textContent = 'Remove Competition';
    } else {
        // Deactivate: remove all green cells, revert to normal mode
        competitionMode = false;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (grid[y][x] === 2) {
                    grid[y][x] = 0;
                }
            }
        }
        this.textContent = 'Add Competition';
    }
    update();
});

//Fade sections in/out based on position in viewport
function updateFade() {
    const elements = document.querySelectorAll('h1,section');
    const vh = window.innerHeight;
    const fadeDistance = vh * 0.3; // fading occurs of 30% of screen height

    elements.forEach(function(el){
        const rect = el.getBoundingClientRect(); //where each element is now

        //Fade in: ramps 0 -> 1 as element enters from bottom 
        let fadeIn = 1;

        if (rect.top > vh) { // if still below screen, don't fade in
            fadeIn = 0;
        } else if (rect.top > vh - fadeDistance) {
            fadeIn = (vh - rect.top)/fadeDistance
        }

        //Fade out: ramps from 1->0 as element exits from top
        let fadeOut = 1;
        if (rect.bottom <0) {
            fadeOut = 0;
        } else if (rect.bottom < fadeDistance) {
            fadeOut = rect.bottom / fadeDistance;
        }

        el.style.opacity = Math.min(fadeIn,fadeOut)
    });
}

// Highlight nav links when their section is in view
const navLinks = document.querySelectorAll('nav a');

// Map of nav links to the section IDs they should respond to
// Most links map to a single section, but "Game of Life" maps to three
const navSectionMap = {
    '#gol': ['gol', 'gol2', 'gol3']
};

function updateNavHighlight() {
    let vh = window.innerHeight;

    navLinks.forEach(function(link) {
        let href = link.getAttribute('href');
        let sectionIds = navSectionMap[href] || [href.substring(1)];
        let isActive = false;

        if (sectionIds.length > 1) {
            // Grouped sections: check the full range from first wrapper top
            // to last wrapper bottom (includes gaps between them)
            let firstWrapper = document.getElementById(sectionIds[0]).closest('.sticky-wrapper');
            let lastWrapper = document.getElementById(sectionIds[sectionIds.length - 1]).closest('.sticky-wrapper');
            let topRect = firstWrapper.getBoundingClientRect();
            let bottomRect = lastWrapper.getBoundingClientRect();

            if (topRect.top < vh && bottomRect.bottom > 0) {
                isActive = true;
            }
        } else {
            // Single section: check if it overlaps the viewport
            let target = document.getElementById(sectionIds[0]);
            if (target) {
                let rect = target.getBoundingClientRect();
                if (rect.top < vh && rect.bottom > 0) {
                    isActive = true;
                }
            }
        }

        if (isActive) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

window.addEventListener('scroll',function(){
    let scrollDelta = window.scrollY - lastScrollY; 
    lastScrollY = window.scrollY;

    scrollAccumulator += Math.abs(scrollDelta); //works scrolling up and down

    if (scrollAccumulator >= scrollThreshold) {
        nextGeneration();
        scrollAccumulator = 0; 
    }

    update();
    updateFade();
    updateNavHighlight();
    updateScrollProgress();

    // Show/hide competition button based on scroll position
    var playRect = playSection.getBoundingClientRect();
    if (playRect.top < window.innerHeight) {
        competitionButton.style.display = 'block';
    } else {
        competitionButton.style.display = 'none';
    }

});

update(); //draw initial state
updateFade(); //set initial opacity so h1 visible on page load
updateNavHighlight(); //set initial nav highlight


// Add progress bar for page under nav bar, update with scroll
const pageProgressBar = document.getElementById('page-progress-bar')
const lastWrapper = document.querySelector('.sticky-wrapper:last-of-type');
const progressEndPoint = lastWrapper.offsetTop + lastWrapper.offsetHeight - window.innerHeight;
window.addEventListener('scroll',function() {


    const scrollPercentage = ( window.scrollY / (progressEndPoint)) *100;
    const clampedPercentage = Math.min(100, Math.max(0, scrollPercentage));
    pageProgressBar.style.width = clampedPercentage + '%';

});


//Dynamically extend page height when scrolled to the bottom 
//to create inifinite scroll effect

window.addEventListener('scroll',function() {
    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = document.body.scrollHeight;

    if (docHeight - scrollBottom < 2000 ) {
        document.body.style.minHeight = (docHeight + 1000) + 'px';
    }
});

// Scroll progress bar update code

function updateScrollProgress() {
    const wrappers = document.querySelectorAll('.sticky-wrapper')

    wrappers.forEach(function(wrapper) {
        const section = wrapper.querySelector('section');
        const progressBar = section.querySelector('.scroll-progress-bar');


        if (!progressBar) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const wrapperHeight = wrapper.offsetHeight;
        const viewportHeight = window.innerHeight;

        let progress = 0;
        if (wrapperRect.top <= 0) {
            progress = Math.abs(wrapperRect.top) / (wrapperHeight-viewportHeight);
            progress = Math.min(progress,1); //cap at 100%
        }

        progressBar.style.width = (progress * 100) + '%'
    
    });
}
