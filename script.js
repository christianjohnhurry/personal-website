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
const cellSize = window.innerWidth < 600 ? 6 : 10;


// How many cells fit page 
const cols = Math.floor(canvas.width / cellSize);
const rows = Math.floor(canvas.height / cellSize);

const prob_init_alive = 0.15;

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
                ctx.fillStyle = '#6eb5ff';
                ctx.fillRect(x * cellSize, y*cellSize, cellSize, cellSize) // (x,y,width,height)
            }
        }
    }
}


//how many of 8 surrounding cells are alive?
function countNeighbours(grid, x, y){
    let count = 0;
    for (let dy = -1; dy <=1; dy ++){
        for (let dx = -1; dx <=1; dx ++){
            if (dy ===0 && dx === 0) continue; // skip cell itself

            //wrap around edges, so right edge interacts with left edge 
            let ny = (y + dy + rows) % rows;
            let nx = (x + dx + cols) % cols; 

            count += grid[ny][nx];
        }
    }
    return count;
}



function nextGeneration() {
    let newGrid = [];
    for (let y=0; y<rows; y++){
        newGrid[y] = [];
        for (let x=0; x<cols; x++){
            let neighbours = countNeighbours(grid,x,y)
            if (grid[y][x] ===1) {
                newGrid[y][x] = (neighbours ===2 || neighbours===3) ? 1 : 0;
            } else{
                newGrid[y][x] = (neighbours===3 || neighbours ===6) ? 1 : 0;
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
            if (Math.random() < prob_init_alive){
                grid[y][x] = 1;
            } else {
                grid[y][x] =0;
            }
        }
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

});

update(); //draw initial state
updateFade(); //set initial opacity so h1 visible on page load