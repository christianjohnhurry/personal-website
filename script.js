// This JavaScript file is used to generate Conway's Game of Life as 
// a background graphic

// get canvas element from html file, set up for drawing 
const canvas = document.getElementById('game-of-life');
const ctx = canvas.getContext('2d'); //drawing tool, 2d for 2d graphics

//set canvas size to fill window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// cell sixe in pixels
const cellSize = 20;


// How many cells fit page 
const cols = Math.floor(canvas.width / cellSize);
const rows = Math.floor(canvas.height / cellSize);


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

drawGrid();