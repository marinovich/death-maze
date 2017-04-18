const requestAnimFrame = (function(){
    return window.requestAnimationFrame    ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

const gameField = document.getElementById("game-field");
const armyWrap = document.getElementById("army-wrap");
const armyUnit1 = document.getElementById("unit1");
const armyUnit2 = document.getElementById("unit2");
const armyUnit3 = document.getElementById("unit3");
const armyUnit4 = document.getElementById("unit4");
const timeBlock = document.getElementById("time-block");
const statusBar = document.getElementById("status-bar");
const gold = document.getElementById("gold");
const upgradeTime = document.getElementById("time-to-upgrade");
const defeatTime = document.getElementById("time-to-defeat");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let timeBlockHeight = 28;
let armyWrapWidth = 70;
let statusBarHeight = 40;

canvas.width = 512;
canvas.height = 480;
hp.height = 15;
hp.width = canvas.width + 4;

timeBlock.style.height = `${timeBlockHeight}px`;
armyWrap.style.width = `${armyWrapWidth}px`;
statusBar.style.height = `${statusBarHeight}px`; 
gameField.style.width = `${canvas.width + armyWrapWidth + 8}px`;
gameField.style.height = `${canvas.height + timeBlockHeight + statusBarHeight + hp.height + 4}px`;

let armyUnit = [armyUnit1, armyUnit2, armyUnit3, armyUnit4];
let selectedUnit = 0;
armyUnit[selectedUnit].style.opacity = '1';
let totalGold = initGold;
let goldMulti = 1;

armyUnit.forEach((item,i) => item.onmouseover = () => (i !== selectedUnit) ? item.style.opacity = "0.5" : false);

armyUnit.forEach((item,i) => item.onmouseleave = () => (i !== selectedUnit) ? item.style.opacity = "0.3" : false);

armyUnit.forEach((item,i,arr) => item.onclick = () => 
	arr.forEach(function (item,index) {
		if (index !== i) 
			item.style.opacity = "0.3";
		else {
			item.style.opacity = "1";
			selectedUnit = index;
		}
	}));

document.onkeydown = function(e) {
    if (String.fromCharCode(e.keyCode || e.charCode) == 'V') { armyUnit[0].onclick(); }
    if (String.fromCharCode(e.keyCode || e.charCode) == 'C') { armyUnit[1].onclick(); }
    if (String.fromCharCode(e.keyCode || e.charCode) == 'X') { armyUnit[2].onclick(); }
    if (String.fromCharCode(e.keyCode || e.charCode) == 'Z') { armyUnit[3].onclick(); }
};

updateHP();

document.onselectstart = function () {return false} // do not select when clicking
canvas.onmousedown = function () {return false}	  // do not select when clicking

let matrixWidth = 20;
let matrixHeight = 30;
let cellHeight = canvas.height / matrixHeight;
let cellWidth = canvas.width / matrixWidth;
let maxFreeTime = 9999; // maximum matrix[i][j].freeTime

let matrix = new Array(matrixHeight);
for(let i = 0; i < matrixHeight; i++)
	matrix[i] = new Array(matrixWidth);
for (let i = 0; i < matrixHeight; i++) 
	for (let j = 0; j < matrixWidth; j++)
		matrix[i][j] = {startPos: [j * cellWidth, i * cellHeight],
						endPos: [(j + 1) * cellWidth, (i + 1) * cellHeight],
						freeTime: maxFreeTime,
						textStyle: "#a0a0a0"};

let ctxArr = new Array(matrixHeight);
for(let i = 0; i < matrixHeight; i++)
	ctxArr[i] = new Array(matrixWidth);

let count = 0;
let goldCount = 0;
let fps = 0;
let a = document.getElementById("score");

a.style.display = 'none'; // it's FPS

// The main game loop
let lastTime = Date.now();;
function main() {
    let now = Date.now();
    let dt = (now - lastTime) / 1000.0;

    //calculate average fps (15 frames)
    fps += 1/dt;
    if (count === 20) {
    	fps = Math.floor(fps/15);
    	a.innerText = fps;
    	fps = 0;

        goldMulti = (initUpgrades.length + 1 - upgrades.length);
        totalGold += goldMulti*initGoldMulti;
        gold.innerHTML = Math.round(totalGold);

        count = 0;
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
    'img/space-ship.png',
    'img/unit3.png',
    'img/6B.png',
    'img/8B.png',
    'img/13.png',
    'img/exhaust.png',
    'img/12B.png'
]);
resources.onReady(init);

// Game state
let player = {
    pos: [0, 0],
    sprite: new Sprite('img/6B.png', [0, 0], [85, 51]),
    hp: initPlayerHP
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
let rockets = [];
let enemies = [];
let explosions = [];

let lastFire = Date.now();
let lastFireRocket = Date.now();
let gameTime = 0;
let isGameOver = false;
let terrainPattern;

let score = 0;
let scoreEl = document.getElementById('score');

// Speed in pixels per second
let playerSpeed = 300;
let enemySpeed = 150;
let upgrades = initUpgrades.slice();

let bulletSpeed = 500;
let initBulletDamage = 1;
let bulletFrequency = 300;

let isRockets = false;
let rocketSpeed = 150;
let rocketDamage = 10;
let rocketFrequency = 1500;

let moveAI = {};
	moveAI.down = false;
	moveAI.up = false;
	moveAI.right = false;
	moveAI.left = false;
	moveAI.target = [];

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    gameField.style.visibility = 'visible';
    isGameOver = false;
    totalGold = initGold;
    gameTime = 0;
    score = 0;
    player.hp = initPlayerHP;
    updateHP();

    enemies = [];
    bullets = [];
    rockets = [];

    playerSpeed = 300;
    
    bulletSpeed = 500;
    initBulletDamage = 1;
    bulletFrequency = 300;
    
    isRockets = false;
    rocketSpeed = 150;
    rocketDamage = 10;
    rocketFrequency = 1500;

    upgrades = initUpgrades.slice();

    player.pos = [canvas.width/2-20, canvas.height / matrixHeight+1];
    exhaustLeft.pos = [player.pos[0], player.pos[1]-20];
    exhaustRight.pos = [player.pos[0]+20, player.pos[1]-20];

    for (let i = 0; i < matrixHeight; i++)
        for (let j = 0; j < matrixWidth; j++)
            matrix[i][j].freeTime = maxFreeTime;
};

// Update game objects
function update(dt) {
    gameTime += dt;
    if (gameTime > totalTime)
        gameOver();

    if (Math.floor((totalTime - gameTime) % 60) >= 10) 
        defeatTime.innerHTML = `${Math.floor((totalTime - gameTime) / 60)}:${Math.floor((totalTime - gameTime) % 60)}`;
    else 
        defeatTime.innerHTML = `${Math.floor((totalTime - gameTime) / 60)}:0${Math.floor((totalTime - gameTime) % 60)}`;
    
    handleInput(dt);
    updateEntities(dt);

    upgradesTimer();

    canvas.onclick = function (event) {
    	let posY = event.clientY - (canvas.offsetTop + 
    								canvas.parentElement.offsetTop + 
    								canvas.parentElement.parentElement.offsetTop);
    	if (posY > canvas.height - 90) {
    		if (selectedUnit === 0 && totalGold >= 1) {
    			let posX = event.clientX - (canvas.offsetLeft + 
    								canvas.parentElement.offsetLeft + 
    								canvas.parentElement.parentElement.offsetLeft) - 35/2;
    			let posY = event.clientY - (canvas.offsetTop + 
    								canvas.parentElement.offsetTop + 
    								canvas.parentElement.parentElement.offsetTop) - 45/2;
    			totalGold -= 1;
        		enemies.push({
        		    pos: [posX, posY],
        		    sprite: new Sprite('img/8B.png', [0, 0], [35, 45]),
        		    startPos: [posX, posY],
        		    speed: enemySpeed,
        		    moveType: 'non-linear',
        		    type: selectedUnit,
        		    damage: 3,
        		    hp: 2
        		});
        	}
        	if (selectedUnit === 1 && totalGold >= 10) {
        		let unitWidth = 84;  // search at sprite picture
        		let unitHeight = 52;  // search at sprite picture
        		let posX = event.clientX - (canvas.offsetLeft + 
    								canvas.parentElement.offsetLeft + 
    								canvas.parentElement.parentElement.offsetLeft) - unitWidth/2;
    			let posY = event.clientY - (canvas.offsetTop + 
    								canvas.parentElement.offsetTop + 
    								canvas.parentElement.parentElement.offsetTop) - unitHeight/2;
        		totalGold -= 10;
        		enemies.push({
        		    pos: [posX, posY],
        		    sprite: new Sprite('img/13.png', [0, 0], [unitWidth, unitHeight]),
        		    startPos: [posX, posY],
        		    speed: 100,
        		    moveType: 'linear',
        		    type: selectedUnit,
        		    damage: 10,
        		    hp: 10,
        		    exhaust: {
        		    	sprite: new Sprite('img/exhaust.png', [0, 0], [12, 32], 50, [3,2]),
        		    	pos: [] },
        		    exhaustPos: [[unitWidth/2 - 17, unitHeight - 3], [unitWidth/2 + 6, unitHeight - 3]],
        		    exhausts: []
        		});
        	}
        	if (selectedUnit === 2 && totalGold >= 100) {
        		let unitWidth = 171;  // search at sprite picture
        		let unitHeight = 61;  // search at sprite picture
        		let posX = event.clientX - (canvas.offsetLeft + 
    								canvas.parentElement.offsetLeft + 
    								canvas.parentElement.parentElement.offsetLeft) - unitWidth/2;
    			let posY = event.clientY - (canvas.offsetTop + 
    								canvas.parentElement.offsetTop + 
    								canvas.parentElement.parentElement.offsetTop) - unitHeight/2 ;
        		totalGold -= 100;
        		enemies.push({
        		    pos: [posX, posY],
        		    sprite: new Sprite('img/12B.png', [0, 0], [unitWidth, unitHeight]),
        		    startPos: [posX, posY],
        		    speed: 150,
        		    moveType: 'linear',
        		    type: selectedUnit,
        		    damage: 20,
        		    hp: 100,
        		    exhaust: {
        		    	sprite: new Sprite('img/exhaust.png', [0, 0], [12, 32], 50, [1,2]),
        		    	pos: [] },
        		    exhaustPos: [[unitWidth/2 - 30, unitHeight - 7], [unitWidth/2 + 18, unitHeight - 7]],
        		    exhausts: []
        		});
        	}
        	if (selectedUnit === 3) {}
            createPath();
        	moveAI = avoidEnemy(undefined, selectedUnit);
        }
    }
    findPosition(); 
    createPath();
    moveAI = avoidEnemy(moveAI);

    checkCollisions();
    //scoreEl.innerHTML = score;
};

let upgradesTimer = function upgradesTimer() {
    if (upgrades.length > 0) {
        if (Math.floor((upgrades[0][0] - gameTime) % 60) > 9)
            upgradeTime.innerHTML = `${Math.floor((upgrades[0][0] - gameTime) / 60)}:${Math.floor((upgrades[0][0] - gameTime) % 60)}`;
        else
            upgradeTime.innerHTML = `${Math.floor((upgrades[0][0] - gameTime) / 60)}:0${Math.floor((upgrades[0][0] - gameTime) % 60)}`;
        if (gameTime > upgrades[0][0]) {
            eval(`${upgrades[0][1]} = ${upgrades[0][2]}`);
            upgrades.splice(0, 1);
        }
    }
    else
        upgradeTime.innerHTML = '--:--';
}

let handleInput = function handleInput(dt) {

    if(/*input.isDown('DOWN') || input.isDown('s') || */moveAI.down) {
        player.pos[1] += playerSpeed * dt;
    }

    if(/*input.isDown('UP') || input.isDown('w') || */moveAI.up) {
        player.pos[1] -= playerSpeed * dt;
    }

    if(/*input.isDown('LEFT') || input.isDown('a') || */moveAI.left) {
        player.pos[0] -= playerSpeed * dt;
    }

    if(/*input.isDown('RIGHT') || input.isDown('d') || */moveAI.right) {
        player.pos[0] += playerSpeed * dt;
    }

    // set start pos for player's exhaust
    exhaustRight.pos[0] = player.pos[0] + 45;
    exhaustRight.pos[1] = player.pos[1] - 26;

    exhaustLeft.pos[0] = player.pos[0] + 28;
    exhaustLeft.pos[1] = player.pos[1] - 26;

    if((input.isDown('SPACE') || true) &&
       !isGameOver &&
        Date.now() - lastFire > bulletFrequency) {
        let x = player.pos[0];
        let y = player.pos[1] + player.sprite.size[1] / 2;

        bullets.push({ pos: [x + player.sprite.size[0] / 2 - 14, y],
                       dir: 'down',
                       sprite: new Sprite('img/space-ship.png', [0, 70], [10, 25]),
                       damage: initBulletDamage });
        bullets.push({ pos: [x + player.sprite.size[0] / 2 + 4, y],
                       dir: 'down',
                       sprite: new Sprite('img/space-ship.png', [0, 70], [10, 25]),
                       damage: initBulletDamage });
        lastFire = Date.now();
    }

    if (isRockets)
        if((input.isDown('SPACE') || true) &&
       		!isGameOver &&
        	Date.now() - lastFireRocket > rocketFrequency) {
        	let x = player.pos[0];
        	let y = player.pos[1] + player.sprite.size[1] / 2;
        	rockets.push({ pos: [x + player.sprite.size[0] / 2 - 40, y],
        	               dir: 'down',
        	               sprite: new Sprite('img/space-ship.png', [0, 70], [10, 25]),
        	               damage: rocketDamage });
        	rockets.push({ pos: [x + player.sprite.size[0] / 2 + 30, y],
        	               dir: 'down',
        	               sprite: new Sprite('img/space-ship.png', [0, 70], [10, 25]),
        	               damage: rocketDamage });
        	lastFireRocket = Date.now();
        }

        
}

let updateEntities = function updateEntities(dt) {
    // Update the player sprite animation
    player.sprite.update(dt);
    exhaustRight.sprite.update(dt);
    exhaustLeft.sprite.update(dt);

    // Update all the bullets
    for(let i = 0; i < bullets.length; i++) {
        let bullet = bullets[i];

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

    for(let i = 0; i < rockets.length; i++) {
        let rocket = rockets[i];

        switch(rocket.dir) {
        case 'up': rocket.pos[1] -= rocketSpeed * dt; break;
        case 'down': rocket.pos[1] += rocketSpeed * dt; break;
        default:
            rocket.pos[0] += rocketSpeed * dt;
        }

        // Remove the rocket if it goes offscreen
        if(rocket.pos[1] < 0 || rocket.pos[1] > canvas.height ||
           rocket.pos[0] > canvas.width) {
            rockets.splice(i, 1);
            i--;
        }
    }

    // Update all the enemies
    for(let k = 0; k < enemies.length; k++) {
    	if (enemies[k].moveType == 'non-linear') {
        	enemies[k].pos[1] = enemies[k].pos[1] - enemies[k].speed * dt;
        	if (enemies[k].startPos[0] >= canvas.width / 2)
        		enemies[k].pos[0] = enemies[k].startPos[0] - (canvas.width - enemies[k].startPos[0] - 40) * 
        							(Math.sin((enemies[k].startPos[1] - enemies[k].pos[1]) / 50));
        	else 
        		enemies[k].pos[0] = enemies[k].startPos[0] - enemies[k].startPos[0] * 
        					 		(Math.sin((enemies[k].startPos[1] - enemies[k].pos[1]) / 50));
       	}
       	if (enemies[k].moveType == 'linear') {
       	 	enemies[k].pos[1] = enemies[k].pos[1] - enemies[k].speed * dt;
       	}

       	// add exhaust to armyUnits
       	if (!!enemies[k].exhaustPos) {
       		
       			enemies[k].exhaustPos.map(function (item, i) {
       				let currentEx = {};
					for (let key in enemies[k].exhaust) {
					  	currentEx[key] = enemies[k].exhaust[key];
					}

       				currentEx.pos[0] = enemies[k].pos[0] + item[0];
       				currentEx.pos[1] = enemies[k].pos[1] + item[1];
       				
       				enemies[k].exhausts[i] = {'sprite': currentEx.sprite, 'pos': currentEx.pos.slice()};
       			});
       		
       		enemies[k].exhausts.map((item) => item.sprite.update(dt));
       	}



        enemies[k].sprite.update(dt);

        // Remove if offscreen
        if(enemies[k].pos[0] + enemies[k].sprite.size[0] < 0 ||
           enemies[k].pos[1] + enemies[k].sprite.size[1] < -10) {

        	enemies.splice(k, 1);
            k--;
        }

        
    }
    if (enemies.length == 0)
        for (let i = 0; i < matrixHeight; i++)
            for (let j = 0; j < matrixWidth; j++)
                matrix[i][j].freeTime = maxFreeTime;

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

let collides = function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
}

let boxCollides = function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
}

let checkCollisions = function checkCollisions() {
    checkPlayerBounds();
    let isDestroyed = false;
    
    // Run collision detection for all enemies and bullets
    for(let i = 0; i < enemies.length; i++) {
    	let isBreaked = false;
        let pos = enemies[i].pos;
        let size = enemies[i].sprite.size;

        for(let j = 0; j < bullets.length; j++) {
            let pos2 = bullets[j].pos;
            let size2 = bullets[j].sprite.size;

            if(boxCollides(pos, size, pos2, size2)) {
                enemies[i].hp -= bullets[j].damage;
            	if (enemies[i].hp <= 0) {
                    if (enemies[i].moveType === 'linear') {
                	    let jStart = Math.floor(enemies[i].pos[0] / (canvas.width / matrixWidth));
					    let jEnd = Math.floor((enemies[i].pos[0] + enemies[i].sprite.size[0]) / (canvas.width / matrixWidth));
					    if (jStart < 0) jStart = 0;
					    if (jEnd == matrixWidth) jEnd -= 1;
					    for (let i = 0; i < matrixHeight; i++)
					   	for (let j = jStart; j <= jEnd; j++)
					   		matrix[i][j].freeTime = maxFreeTime;
                    }
                    else if (enemies[i].moveType === 'non-linear')
                        createPathNLinear(enemies[i], true);
	
					// Remove the enemy
                	enemies.splice(i, 1);
                	i--;
                	isBreaked = true;
	
                	// Add score
                	score += 100;
	
                	// Add an explosion
                	explosions.push({
                	    pos: pos,
                	    sprite: new Sprite('img/sprites.png',
                	                       [0, 117],
                	                       [39, 39],
                	                       50,
                	                       [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                	                       null,
                	                       true)
                	});
                }

                // Remove the bullet and stop this iteration
                bullets.splice(j, 1);
                break;
            }
        }
        if (isBreaked) { continue; }

        for(let j = 0; j < rockets.length; j++) {
            let pos2 = rockets[j].pos;
            let size2 = rockets[j].sprite.size;

            if(boxCollides(pos, size, pos2, size2)) {
                enemies[i].hp -= rockets[j].damage;
            	if (enemies[i].hp <= 0) {
                    if (enemies[i].moveType === 'linear') {
                	    let jStart = Math.floor(enemies[i].pos[0] / (canvas.width / matrixWidth));
					    let jEnd = Math.floor((enemies[i].pos[0] + enemies[i].sprite.size[0]) / (canvas.width / matrixWidth));
					    if (jStart < 0) jStart = 0;
					    if (jEnd == matrixWidth) jEnd -= 1;
					    for (let i = 0; i < matrixHeight; i++)
					   	for (let j = jStart; j <= jEnd; j++)
					   		matrix[i][j].freeTime = maxFreeTime;
                    }
                    else if (enemies[i].moveType === 'non-linear')
                        createPathNLinear(enemies[i], true);
	
					// Remove the enemy
                	enemies.splice(i, 1);
                	i--;
                	isBreaked = true;
	
                	// Add score
                	score += 100;
	
                	// Add an explosion
                	explosions.push({
                	    pos: pos,
                	    sprite: new Sprite('img/sprites.png',
                	                       [0, 117],
                	                       [39, 39],
                	                       50,
                	                       [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                	                       null,
                	                       true)
                	});
                }

                // Remove the rocket and stop this iteration
                rockets.splice(j, 1);
                break;
            }
        }
        if (isBreaked) { continue; }

        if(boxCollides(pos, size, player.pos, player.sprite.size)) {
        	if (!enemies[i].collide) {
        		enemies[i].collide = true;
        		player.hp -= enemies[i].damage;
        		updateHP(player.hp);
        	}
        	if (player.hp <= 0)
            	gameOver();

            let jStart = Math.floor(enemies[i].pos[0] / (canvas.width / matrixWidth));
			let jEnd = Math.floor((enemies[i].pos[0] + enemies[i].sprite.size[0]) / (canvas.width / matrixWidth));
			if (jStart < 0) jStart = 0;
			if (jEnd == matrixWidth) jEnd -= 1;
			for (let i = 0; i < matrixHeight; i++)
				for (let j = jStart; j <= jEnd; j++)
					matrix[i][j].freeTime = maxFreeTime;

            enemies.splice(i, 1);
            i--;

            // Add an explosion
            explosions.push({
                pos: pos,
                sprite: new Sprite('img/sprites.png',
                                   [0, 117],
                                   [39, 39],
                                   50,
                                   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                   null,
                                   true)
            });
        }
    }
}

let checkPlayerBounds = function checkPlayerBounds() {
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
	let ctxText = canvas.getContext("2d");
	ctxText.font = "8px Arial";
	ctxText.textAlign = "center";

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	let pattern = ctx.createPattern(bgImage, "repeat");	
	ctx.fillStyle = pattern;
	ctx.rect(0, 0, canvas.width, canvas.height);
	ctx.fill();

	ctxLine = canvas.getContext("2d"); // WAT!!! Без этих строк
	ctxLine.beginPath();				// быстро снижается FPS
	ctxLine.lineWidth = "1";	
	ctxLine.strokeStyle = "red";	
	ctxLine.moveTo(0, canvas.height - 90);
	ctxLine.lineTo(canvas.width, canvas.height - 90);
	ctxLine.stroke();
    /*for (let i = 0; i < matrixHeight; i++) 
		for (let j = 0; j < matrixWidth; j++) {
			ctxArr[i][j] = canvas.getContext("2d");
			ctxArr[i][j].beginPath();
			ctxArr[i][j].lineWidth = "1";
			ctxArr[i][j].strokeStyle = "transparent";
			ctxArr[i][j].rect(matrix[i][j].startPos[0], matrix[i][j].startPos[1], 
							  canvas.width / matrix[i].length, canvas.height/matrix.length);	
			ctxArr[i][j].stroke();
			ctxText.fillStyle = matrix[i][j].textStyle;
			ctxText.fillText(matrix[i][j].freeTime, 
							 matrix[i][j].startPos[0]+(matrix[i][j].endPos[0] - matrix[i][j].startPos[0])/2, 
							 matrix[i][j].startPos[1]+(matrix[i][j].endPos[1] - matrix[i][j].startPos[1])/2 + 5);
		}*/

    // Render the player if the game isn't over
    if(!isGameOver) {
        renderEntity(player);
        renderEntity(exhaustRight);
        renderEntity(exhaustLeft);
        renderEntities(bullets);
        renderEntities(rockets);
        enemies.map(function(item) {
            if (!!item.exhausts) 
                renderEntities(item.exhausts) 
            });
    	renderEntities(enemies);    	
    	renderEntities(explosions);
    }
};

function renderEntities(list) {
    for(let i = 0; i < list.length; i++) {
        renderEntity(list[i]);
    }    
}

function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();
}

function renderExhaust(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.render(ctx);
    ctx.restore();
}

// Game over
function gameOver() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over_reason').style.fontFamily = 'zorqueregular';
    if (gameTime <= 300) { document.getElementById('game-over_reason').innerHTML = 'ALIENS WIN!'; }
    else { document.getElementById('game-over_reason').innerHTML = 'HUMANITY WINS!'; }
    document.getElementById('game-over-overlay').style.display = 'block';
    isGameOver = true;
    gameField.style.visibility = 'hidden';

    for (let i = 0; i < matrixHeight; i++)
        for (let j = 0; j < matrixWidth; j++)
            matrix[i][j].freeTime = maxFreeTime;
}
