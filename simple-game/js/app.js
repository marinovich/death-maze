
// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
const requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Create the canvas
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.onselectstart = function () {return false} // do not select when clicking
canvas.onmousedown = function () {return false}	  // do not select when clicking

canvas.width = 512;
canvas.height = 480;

document.body.appendChild(canvas);

let matrixWidth = 10;
let matrixHeight = 10;
let maxFreeTime = 9999; // maximum matrix[i][j].freeTime

let matrix = new Array(matrixHeight);
for(let i = 0; i < matrix.length; i++)
	matrix[i] = new Array(matrixWidth);
for (let i = 0; i < matrix.length; i++) 
	for (let j = 0; j < matrix[i].length; j++)
		matrix[i][j] = {startPos: [j*canvas.width/matrix[i].length, i*canvas.height/matrix.length],
						endPos: [(j+1)*canvas.width/matrix[i].length, (i+1)*canvas.height/matrix.length],
						freeTime: maxFreeTime,
						textStyle: "#a0a0a0"};

let ctxArr = new Array(matrixHeight);
for(let i = 0; i < ctxArr.length; i++)
	ctxArr[i] = new Array(matrixWidth);

let count = 0;
let fps = 0;
let a = document.getElementById("score");

// The main game loop
let lastTime = Date.now();;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    //calculate average fps (15 frames)
    fps += 1/dt;
    if (count == 15) {
    	fps = Math.floor(fps/15);
    	a.innerText = fps;
    	count = 0;
    	fps = 0;
    }

    update(dt);
    render();

    lastTime = now;
    requestAnimFrame(main);
    count++;
};

function init() {
    document.getElementById('play-again').addEventListener('click', function() {
        reset();
    });

    reset();
    lastTime = Date.now();
    main();
}

resources.load([
    'img/sprites.png',
    'img/space-ship.png'
]);
resources.onReady(init);

// Game state
let player = {
    pos: [0, 0],
    sprite: new Sprite('img/space-ship.png', [0, 32], [28, 35])
};

let exhaustLeft = {
	pos: [0, 0],
	sprite: new Sprite('img/space-ship.png', [0, 0], [12, 32], 50, [0,1])
};

let exhaustRight = {
	pos: [0, 0],
	sprite: new Sprite('img/space-ship.png', [0, 0], [12, 32], 50, [0,1])
};

let bullets = [];
let enemies = [];
let explosions = [];

let lastFire = Date.now();
let gameTime = 0;
let isGameOver;
let terrainPattern;

let score = 0;
let scoreEl = document.getElementById('score');

// Speed in pixels per second
let playerSpeed = 200;
let bulletSpeed = 500;
let enemySpeedX = 250;
let enemySpeedY = 150;

let moveAI ='';
// Update game objects
function update(dt) {
    gameTime += dt;
    

    handleInput(dt);
    updateEntities(dt);

    // It gets harder over time by adding enemies using this
    // equation: 1-.993^gameTime
    /*if(Math.random() < 1 - Math.pow(0, gameTime)) {*/
    canvas.onclick = function (event) {
    	let posX = event.clientX - document.getElementsByTagName('canvas')[0].offsetLeft;
    	let posY = event.clientY - document.getElementsByTagName('canvas')[0].offsetTop - 20;
        enemies.push({
            pos: [posX - 39/2, posY],
            sprite: new Sprite('img/sprites.png', [0, 0], [39, 32], 10, [0,1], null, null, [posX, posY], enemySpeedY)
        });
    }
    findPosition();
    createPath();
    moveAI = avoidEnemy();

    checkCollisions();
    //if (gameTime >= 20) gameOver(); 

    //scoreEl.innerHTML = score;
};

let num = 0;
let avoidEnemy = function f() {

	let jStart = Math.floor(player.pos[0] / (canvas.width / matrixWidth));
	let jEnd = Math.floor((player.pos[0] + player.sprite.size[0]) / (canvas.width / matrixWidth));

	let iStart = Math.floor(player.pos[1] / (canvas.height / matrixHeight));
	let iEnd = Math.floor((player.pos[1] + player.sprite.size[1]) / (canvas.height / matrixHeight));

	/*if (num == 0) {
		console.log([[iStart,iEnd],[jStart,jEnd]]);
		num++;
	}*/
	if (matrix[iEnd][jStart].freeTime === maxFreeTime && 
		matrix[iEnd][jEnd].freeTime === maxFreeTime)
		return '';

	if (matrix[iEnd][jStart].freeTime === maxFreeTime && 
		matrix[iEnd][jEnd].freeTime !== maxFreeTime)
		return 'left';

	if (matrix[iEnd][jStart].freeTime !== maxFreeTime && 
		matrix[iEnd][jEnd].freeTime === maxFreeTime)
		return 'right';

	if (jStart !== 0 && jStart !== matrixWidth - 1) {
		if (matrix[iEnd][jStart-1].freeTime > matrix[iEnd][jStart+1].freeTime) {
			return 'left';
		}
		if (matrix[iEnd][jStart-1].freeTime < matrix[iEnd][jStart+1].freeTime) {
			return 'right';
		}
		if (matrix[iEnd][jStart-1].freeTime === matrix[iEnd][jStart+1].freeTime &&
			matrix[iEnd][jStart-1].freeTime > matrix[iEnd][jStart].freeTime) {
			if (jStart > matrixWidth / 2) return 'left';
			else return 'right';
		}
	}
	if (jStart === 0 && matrix[iEnd][jStart+1].freeTime > matrix[iEnd][jStart].freeTime) { return 'right'; }
	if (jStart === matrixWidth - 1 && matrix[iEnd][jStart-1].freeTime > matrix[iEnd][jStart].freeTime) { return 'left'; }
}

let createPath = function f() {
	for(let k = 0; k < enemies.length; k++) {
		let jStart = Math.floor(enemies[k].pos[0] / (canvas.width / matrixWidth));
		let jEnd = Math.floor((enemies[k].pos[0] + enemies[k].sprite.size[0]) / (canvas.width / matrixWidth));
		if (jStart < 0) jStart = 0;
		if (jEnd == matrixWidth) jEnd -= 1;

		let iStart = Math.floor(enemies[k].pos[1] / (canvas.height / matrixHeight));
		let iEnd = Math.floor((enemies[k].pos[1] + enemies[k].sprite.size[1]) / (canvas.height / matrixHeight));
		if (iEnd > matrixHeight-1) iEnd = matrixHeight-1;

		for(let j = jStart; j <= jEnd ; j++) {
			for(let i = iStart; i >= -1 ; i--) {
				if (i == iStart) {
					if (i >= 0 && i < matrixHeight-1) { 
						matrix[i][j].freeTime = 0;
						matrix[i+1][j].freeTime = 0;
					}
				}
				else if (i >= 0) { 
					if (matrix[i][j].freeTime == 0) break;
					let dPos = enemies[k].pos[1] - matrix[i][j].endPos[1];
					matrix[i][j].freeTime = Math.round(dPos / enemies[k].sprite.speed * 1000); 
				}
			}
			for(let i = iEnd + 1; i < matrixHeight; i++) {
				if (iStart == -1) matrix[i-1][j].freeTime = maxFreeTime;
				if (matrix[i][j].freeTime == 0) matrix[i][j].freeTime = maxFreeTime;
			}
		}	
	}
}

let findPosition = function f() {
	/*for (let j = 0; j < matrixWidth; j++)
		for (let i = matrixHeight - 1; i >= 0; i--) 
		 {
			if (((matrix[i][j].startPos[1] <= player.pos[1] && player.pos[1] <= matrix[i][j].endPos[1]) &&
				(matrix[i][j].startPos[0] <= player.pos[0] && player.pos[0] <= matrix[i][j].endPos[0])) ||
				((matrix[i][j].startPos[1] <= player.pos[1] + player.sprite.size[1]  && player.pos[1] <= matrix[i][j].endPos[1]) &&
				(matrix[i][j].startPos[0] <= player.pos[0] + player.sprite.size[0] && player.pos[0] <= matrix[i][j].endPos[0]))){
				matrix[i][j].textStyle = "red";
			}
			else matrix[i][j].textStyle = "#a0a0a0";

			
		}*/
}

function handleInput(dt) {

    if(input.isDown('DOWN') || input.isDown('s') || moveAI == 'down') {
        player.pos[1] += playerSpeed * dt;
    }

    if(input.isDown('UP') || input.isDown('w') || moveAI == 'up') {
        player.pos[1] -= playerSpeed * dt;
    }

    if(input.isDown('LEFT') || input.isDown('a') || moveAI == 'left') {
        player.pos[0] -= playerSpeed * dt;
    }

    if(input.isDown('RIGHT') || input.isDown('d') || moveAI == 'right') {
        player.pos[0] += playerSpeed * dt;
    }

    exhaustRight.pos[0] = player.pos[0] + 17;
    exhaustRight.pos[1] = player.pos[1] - 29;

    exhaustLeft.pos[0] = player.pos[0] - 1;
    exhaustLeft.pos[1] = player.pos[1] - 29;

    if((input.isDown('SPACE') || true) &&
       !isGameOver &&
       Date.now() - lastFire > 1000) {
        var x = player.pos[0];
        var y = player.pos[1] + player.sprite.size[1] / 2;

        /*bullets.push({ pos: [x, y-15],
                       dir: 'forward',
                       sprite: new Sprite('img/sprites.png', [0, 39], [18, 8]) });
        bullets.push({ pos: [x, y-5],
                       dir: 'forward',
                       sprite: new Sprite('img/sprites.png', [0, 39], [18, 8]) });
        bullets.push({ pos: [x, y+5],
                       dir: 'forward',
                       sprite: new Sprite('img/sprites.png', [0, 39], [18, 8]) });
        bullets.push({ pos: [x, y],
                       dir: 'up',
                       sprite: new Sprite('img/sprites.png', [0, 50], [9, 5]) });*/
        bullets.push({ pos: [x-1, y],
                       dir: 'down',
                       sprite: new Sprite('img/space-ship.png', [0, 70], [10, 25]) });
        bullets.push({ pos: [x + player.sprite.size[0] / 2 + 4, y],
                       dir: 'down',
                       sprite: new Sprite('img/space-ship.png', [0, 70], [10, 25]) });

        lastFire = Date.now();
    }
}

function updateEntities(dt) {
    // Update the player sprite animation
    player.sprite.update(dt);
    exhaustRight.sprite.update(dt);
    exhaustLeft.sprite.update(dt);

    // Update all the bullets
    for(var i=0; i<bullets.length; i++) {
        var bullet = bullets[i];

        switch(bullet.dir) {
        case 'up': bullet.pos[1] -= bulletSpeed * dt; break;
        case 'down': bullet.pos[1] += bulletSpeed * dt; break;
        default:
            bullet.pos[0] += bulletSpeed * dt;
        }

        // Remove the bullet if it goes offscreen
        if(bullet.pos[1] < 0 || bullet.pos[1] > canvas.height ||
           bullet.pos[0] > canvas.width) {
            bullets.splice(i, 1);
            i--;
        }
    }

    // Update all the enemies
    for(let k = 0; k < enemies.length; k++) {
        enemies[k].pos[1] = enemies[k].pos[1] - enemies[k].sprite.speed * dt;

        enemies[k].sprite.update(dt);

        // Remove if offscreen
        if(enemies[k].pos[0] + enemies[k].sprite.size[0] < 0 ||
           enemies[k].pos[1] + enemies[k].sprite.size[1] < 20) {

        	enemies.splice(k, 1);
            k--;
        }
    }

    // Update all the explosions
    for(let i = 0; i < explosions.length; i++) {
        explosions[i].sprite.update(dt);

        // Remove if animation is done
        if(explosions[i].sprite.done) {
            explosions.splice(i, 1);
            i--;
        }
    }
}

// Collisions

function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
}

function checkCollisions() {
    checkPlayerBounds();
    
    // Run collision detection for all enemies and bullets
    for(let i = 0; i < enemies.length; i++) {
        let pos = enemies[i].pos;
        let size = enemies[i].sprite.size;

        for(let j = 0; j < bullets.length; j++) {
            let pos2 = bullets[j].pos;
            let size2 = bullets[j].sprite.size;

            if(boxCollides(pos, size, pos2, size2)) {
                // Remove the enemy

                let jStart = Math.floor(enemies[i].pos[0] / (canvas.width / matrixWidth));
				let jEnd = Math.floor((enemies[i].pos[0] + enemies[i].sprite.size[0]) / (canvas.width / matrixWidth));
				if (jStart < 0) jStart = 0;
				if (jEnd == matrixWidth) jEnd -= 1;
				for (let i = 0; i < matrixHeight; i++)
					for (let j = jStart; j <= jEnd; j++)
						matrix[i][j].freeTime = maxFreeTime;

                enemies.splice(i, 1);
                i--;

                // Add score
                score += 100;

                // Add an explosion
                explosions.push({
                    pos: pos,
                    sprite: new Sprite('img/sprites.png',
                                       [0, 117],
                                       [39, 39],
                                       16,
                                       [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                       null,
                                       true)
                });

                // Remove the bullet and stop this iteration
                bullets.splice(j, 1);
                break;
            }
        }

        if(boxCollides(pos, size, player.pos, player.sprite.size)) {
            gameOver();
        }
    }
}

function checkPlayerBounds() {
    // Check bounds
    if(player.pos[0] < 0) {
        player.pos[0] = 0;
    }
    else if(player.pos[0] > canvas.width - player.sprite.size[0]) {
        player.pos[0] = canvas.width - player.sprite.size[0];
    }

    if(player.pos[1] < 0) {
        player.pos[1] = 0;
    }
    else if(player.pos[1] > canvas.height - player.sprite.size[1]) {
        player.pos[1] = canvas.height - player.sprite.size[1];
    }
}

// Make sure the image is loaded first otherwise nothing will draw.

let bgImage = new Image();
bgImage.src = "img/background-min.png";  
   
// Draw everything
function render() {
	/*let ctxText = canvas.getContext("2d");
	ctxText.font = "16px Arial";
	ctxText.textAlign = "center";*/

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	let pattern = ctx.createPattern(bgImage, "repeat");	
	ctx.fillStyle = pattern;
	ctx.rect(0, 0, canvas.width, canvas.height);
	ctx.fill();

    for (let i = 0; i < ctxArr.length; i++) 
		for (let j = 0; j < ctxArr[0].length; j++) {
			ctxArr[i][j] = canvas.getContext("2d");
			ctxArr[i][j].beginPath();
			/*ctxArr[i][j].lineWidth = "1";
			ctxArr[i][j].strokeStyle = "transparent";
			ctxArr[i][j].rect(matrix[i][j].startPos[0], matrix[i][j].startPos[1], 
							  canvas.width/matrix[i].length, canvas.height/matrix.length);	
			ctxArr[i][j].stroke();
			ctxText.fillStyle = matrix[i][j].textStyle;
			ctxText.fillText(matrix[i][j].freeTime, 
							 matrix[i][j].startPos[0]+(matrix[i][j].endPos[0] - matrix[i][j].startPos[0])/2, 
							 matrix[i][j].startPos[1]+(matrix[i][j].endPos[1] - matrix[i][j].startPos[1])/2 + 5);*/
		}

    // Render the player if the game isn't over
    if(!isGameOver) {
        renderEntity(player);
        renderEntity(exhaustRight);
        renderEntity(exhaustLeft);
        renderEntities(bullets);
    	renderEntities(enemies);
    	renderEntities(explosions);
    }
    
};

function renderEntities(list) {
    for(var i=0; i < list.length; i++) {
        renderEntity(list[i]);
    }    
}

function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();
}

// Game over
function gameOver() {
    document.getElementById('game-over').style.display = 'block';
    if (gameTime < 20) { document.getElementById('game-over_reason').innerText = 'ALIENS WIN!'; }
    else { document.getElementById('game-over_reason').innerText = 'HUMANITY WINS!'; }
    document.getElementById('game-over-overlay').style.display = 'block';
    isGameOver = true;
}

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    isGameOver = false;
    gameTime = 0;
    score = 0;

    /*for (let i = 0; i < matrixHeight; i++)
    	for (let j = 0; j < matrixWidth; j++)
    		matrix[i][j] = maxFreeTime;*/

    enemies = [];
    bullets = [];

    player.pos = [canvas.width/2-20, canvas.height / matrixHeight+1];
    exhaustLeft.pos = [player.pos[0], player.pos[1]-20];
    exhaustRight.pos = [player.pos[0]+20, player.pos[1]-20];
};


// health points bar
/*
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
let height = 30;
let width = 250;
hpPersent = 10;

// Red rectangle
ctx.beginPath();
ctx.lineWidth = "2";
ctx.strokeStyle = "#000";
ctx.rect(5, 5, width, height);  
ctx.stroke();

// Green rectangle
ctx.beginPath();
ctx.lineWidth = "4";
ctx.fillStyle = "green";
ctx.fillRect(6, 6, width*hpPersent/100-2, height-2);


// Green rectangle
//if (hpPersent < 100) {
    ctx.beginPath();    
    ctx.lineWidth = "4";
    ctx.fillStyle = "red";
    ctx.fillRect(width*hpPersent/100+4, 6, width-width*hpPersent/100, height-2);
//}
*/
