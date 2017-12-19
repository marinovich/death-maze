let snd = new Audio("sounds/shot.wav"); // buffers automatically when created
let numOfStarts = 0;

const CIRCLE = Math.PI * 2;
const display = document.getElementById('display');

let lockPointer = function() {
	display.requestPointerLock();
}

let unlockPointer = function() {
	document.exitPointerLock();
}

class Timer {
	constructor(time) {
		this._time = time * 1000;
		this.timeStart = 0;
		this.timeEnd = this._time;
		this.timeStop = true;
	}
	startTimer() {
		this.timeStop = false;
		this.timeStart = Date.now();
		this.timeEnd += this.timeStart; 
	}
	stopTimer() {
		this.timeStop = true;
		this.timeEnd -= Date.now();
	}
	get time() {
		return (this.timeStop) ? this.timeEnd : (this.timeEnd - Date.now() < 0) ? 0 : this.timeEnd - Date.now(); 
	}
	get timeAsString() {
		let time = (this.timeStop) ? this.timeEnd : this.timeEnd - Date.now();
		time = (time < 0) ? 0 : time;
		let minutes = Math.floor((time) / 1000 / 60);
		let seconds = Math.floor((time) / 1000 % 60);
		let milliseconds = Math.floor((time) / 100 % 10);
		minutes = (minutes < 10) ? '0' + minutes : '' + minutes;
		seconds = (seconds < 10) ? '0' + seconds : '' + seconds;
		return `${minutes}:${seconds}.${milliseconds}`;
	}
	reset() {
		this.timeStop = true;
		this.timeStart = Date.now();
		this.timeEnd = this._time + this.timeStart; 
	}
	addTime(time) {
		this.timeEnd += time; 
	}
	reduceTime(time) {
		this.timeEnd -= time; 
	}
}

function addEvents() {

}

function removeEvents() {

}

function Controls() {
	this.codes  = { 37: 'left', 39: 'right', 38: 'forward', 40: 'backward',
	                65: 'sideLeft', 68: 'sideRight', 87: 'forward', 83: 'backward', 120: 'F9' };
	this.states = { 'left': false, 'right': false, 'forward': false, 'backward': false, 'gamePaused': false };

    
	document.addEventListener('keydown', this.onKey.bind(this, true), false);
	document.addEventListener('keyup', this.onKey.bind(this, false), false);    
	document.addEventListener('click', this.onMouseClick.bind(this), false);
	document.addEventListener('mousedown', this.onMouseHold.bind(this), false);
	document.addEventListener('mouseup', this.onMouseUp.bind(this), false);
	document.addEventListener('wheel', this.onMouseWheel.bind(this), false);
	display.addEventListener('click', lockPointer, false);
    if (numOfStarts === 0) {
       document.addEventListener('mousemove', this.onMouseMovement.bind(this), false);
    }
}

Controls.prototype.onKey = function(val, e) {
	let state = this.codes[e.keyCode];
	if (typeof state === 'undefined') return;
	this.states[state] = val;
	e.preventDefault && e.preventDefault();
	e.stopPropagation && e.stopPropagation();
};

Controls.prototype.onMouseMovement = function(e) {
	let x = (e.movementX || e.mozMovementX || e.webkitMovementX || 0);
	if (x > 0 && !controls.states.gamePaused) player.rotate(Math.PI/3000 * x);
	if (x < 0 && !controls.states.gamePaused) player.rotate(Math.PI/3000 * x);
};

Controls.prototype.onMouseWheel = function(e) {
	if (e.target == document.getElementById('display')) {
		e.preventDefault && e.preventDefault();
		e.stopPropagation && e.stopPropagation();
	}
};

Controls.prototype.onMouseClick = function(e) {
	if(!controls.states.gamePaused) this.mouseClicked = true;
};

Controls.prototype.onMouseHold = function(e) {
	if(!controls.states.gamePaused) this.mouseHold = true;
};

Controls.prototype.onMouseUp = function(e) {
	this.mouseHold = false;
};

function Bitmap(src, width, height) {
	this.image = new Image();
	this.image.src = src;
	this.width = width;
	this.height = height;
}

function Player(x, y, direction) {
	this.x = x;
	this.y = y;
	this.direction = direction;
	this.weapon = {
		pos: [0, 0],
		sprite: new Sprite('img/pistol_arr.png', [0, 0], [130, 130], 80, [0, 1, 2], undefined, true, 1.7)
	};
	this.aim = new Bitmap('img/aim1.png', 512, 512);
	this.paces = 0;
}

Player.prototype.rotate = function(angle) {
	this.direction = (this.direction + angle + CIRCLE) % (CIRCLE);
};

Player.prototype.walk = function(distance, map, direction) {
  let dx = Math.cos(direction) * distance;
  let dy = Math.sin(direction) * distance;
  if (map.get(this.x + dx, this.y) <= 0) this.x += dx;
  if (map.get(this.x, this.y + dy) <= 0) this.y += dy;
  this.paces += distance;
};

Player.prototype.update = function(controls, map, seconds) {
  if (controls.left && !controls.gamePaused) this.rotate(-Math.PI * seconds);
  if (controls.right && !controls.gamePaused) this.rotate(Math.PI * seconds);
  if (controls.forward && !controls.gamePaused) this.walk(1.0 * seconds, map, this.direction);
  if (controls.backward && !controls.gamePaused) this.walk(-1.0 * seconds, map, this.direction);
  if (controls.sideLeft && !controls.gamePaused) this.walk(1.0 * seconds, map, this.direction - Math.PI/2);
  if (controls.sideRight && !controls.gamePaused) this.walk(-1.0 * seconds, map, this.direction - Math.PI/2);
  if (controls.F9) pauseGame(true);    
};

function pauseGame(isWindowShow) {
  if (controls.states.gamePaused && controls.states.F9) {
    controls.states.gamePaused = false;
    controls.states.F9 = false;
    timer.startTimer();
  }
  else {
    controls.states.gamePaused = true;
    controls.states.F9 = false; 
    timer.stopTimer();   
  }
  if (isWindowShow)
  	showWindow(document.getElementById('pause_window'));
}

function showWindow(elem) {
	elem.classList.toggle('show');
}

function Map(size) {
	this.size = size;
	this.wallGrid = new Uint8Array(size * size);
	this.skybox = new Bitmap('img/deathvalley_panorama.jpg', 2000, 750);
	this.wallTexture = new Bitmap('img/wall_texture1.jpg', 680, 438);
	//this.wallTexture = new Bitmap('img/wall_texture3.jpeg', 800, 640);
	//this.wallTexture = new Bitmap('img/wall_texture.jpg', 1024, 1024);
	this.light = 0;
	this.objects = [];
}

Map.prototype.get = function(x, y) {
	x = Math.floor(x);
	y = Math.floor(y);
	if (x < 0 || x > this.size - 1 || y < 0 || y > this.size - 1) return -1;
	return this.wallGrid[y * this.size + x];
};

Map.prototype.getObject = function(x, y) {
	x = Math.floor(x);
	y = Math.floor(y);
	return this.objects[y * this.size + x];
};

Map.prototype.generate = function() {
	this.wallGrid = mazeMap.map(x => (x > 1) ? 0 : x);
};

Map.prototype.cast = function(point, angle, range) {
	let self = this;
	let sin = Math.sin(angle);
	let cos = Math.cos(angle);
	let noWall = { length2: Infinity };

	return ray({ x: point.x, y: point.y, height: 0, distance: 0 });

	function ray(origin) {
		let stepX = step(sin, cos, origin.x, origin.y, false);
		let stepY = step(cos, sin, origin.y, origin.x, true);
		let nextStep = stepX.length2 < stepY.length2
			? inspect(stepX, 1, 0, origin.distance, stepX.y)
			: inspect(stepY, 0, 1, origin.distance, stepY.x);

		if (nextStep.distance > range) return [origin];
		return [origin].concat(ray(nextStep));
	}

	function step(rise, run, x, y, inverted) {
		if (run === 0) return noWall;
		let dx = run > 0 ? Math.floor(x + 1) - x : Math.ceil(x - 1) - x;
		let dy = dx * (rise / run);
		return {
			x: inverted ? y + dy : x + dx,
			y: inverted ? x + dx : y + dy,
			length2: dx * dx + dy * dy
		};
	}

	function inspect(step, shiftX, shiftY, distance, offset) {
		let dx = cos < 0 ? shiftX : 0;
		let dy = sin < 0 ? shiftY : 0;
		step.height = self.get(step.x - dx, step.y - dy);
		step.distance = distance + Math.sqrt(step.length2);
		step.object = self.getObject(step.x - dx, step.y - dy);
		if (shiftX) step.shading = cos < 0 ? 2 : 0;
		else step.shading = sin < 0 ? 2 : 1;
		step.offset = offset - Math.floor(offset);
		return step;
	}
};

Map.prototype.update = function(seconds) {  // молнии
	if (this.light > 0) this.light = Math.max(this.light - 10 * seconds, 0);
	/*else if (Math.random() * 5 < seconds) this.light = 2;*/ 
};

Map.prototype.addEnemies = function(enemiesMap, mapSize) {
	let animationArr = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];
	let addEnemy = this.addObject.bind(this, {
    	texture: new Sprite('img/zombie.png', [0, 0], [415, 487], 500, animationArr, undefined, false, 1),
		height: 0.6,
		width: .3,
		type: 'enemy',
		floorOffset: 0,
		speed: .1,
		logic: enemyLogic(),
		killed: false
});
	enemiesMap.map((x, i) => (x === 2) 
		? addEnemy(i % mapSize + 0.5, Math.floor(i / mapSize) + 0.5) 
		: undefined);
}

Map.prototype.addExit = function(exitMap, mapSize) {
	let addExit = this.addObject.bind(this, {
    	texture: new Sprite('img/antidot.png', [0, 0], [500, 519]),
		height: 0.6,
		width: .3,
		type: 'exit'
});
	exitMap.map((x, i) => (x === 3) 
		? addExit(i % mapSize + 0.5, Math.floor(i / mapSize) + 0.5) 
		: undefined);
}

Map.prototype.addObject = function(object, x, y) {
	this.objects.push(new MapObject(object, x, y));
};

Map.prototype.deleteObject = function(x, y) {
	this.objects = this.objects.filter(obj => obj.type !== 'enemy' || (obj.x !== x || obj.y !== y));
}

function MapObject(object, x, y) {
	for(let prop in object) {
		this[prop] = object[prop];
	}
	this.x = x;
	this.y = y;
}

function Camera(canvas, resolution, focalLength) {
	this.ctx = canvas.getContext('2d');
	this.width = canvas.width = window.innerWidth * 0.5;
	this.height = canvas.height = window.innerHeight * 0.5;
	this.resolution = resolution;
	this.spacing = this.width / resolution; //column width
	this.focalLength = focalLength || 1.2; 
	this.range = 10;  // wall visibility range
	this.lightRange = 4; // wall light range
	this.scale = (this.width + this.height) / 1200;
}

Camera.prototype.render = function(player, map) {
	this.drawSky(player.direction, map.skybox, map.light);
	this.drawColumns(player, map);
	this.drawWeapon(player.weapon, player.paces);
	this.drawAim(player.aim);
};

Camera.prototype.drawSky = function(direction, sky, ambient) {
	let width = sky.width * (this.height / sky.height) * 2;
	let left = (direction / CIRCLE) * -width;

	this.ctx.save();
	this.ctx.drawImage(sky.image, left, 0, width, this.height);
	if (left < width - this.width) {
		this.ctx.drawImage(sky.image, left + width, 0, width, this.height);
	}
	if (ambient < 100) {
		this.ctx.fillStyle = '#ffffff';
		this.ctx.globalAlpha = ambient * 0.1;
		this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5);
	}
	this.ctx.restore();
};

Camera.prototype.drawColumns = function(player, map, objects) {
	this.ctx.save();
	//if (player.x < 8 && player.y < 1) console.log("Win!")
	let allObjects = [];
	for (let column = 0; column < this.resolution; column++) {
		let angle = this.focalLength * (column / this.resolution - 0.5);
		let ray = map.cast(player, player.direction + angle, this.range);
		let columnProps = this.drawColumn(column, ray, angle, map);
		allObjects.push(columnProps);
	}
	this.ctx.restore();
	this.ctx.save();
	this.drawSprites(player, map, allObjects);
	this.ctx.restore();
};

Camera.prototype.drawWeapon = function(weapon, paces) {
	//let bobX = Math.cos(paces * 2) * this.scale * 6;
	//let bobY = Math.sin(paces * 4) * this.scale * 6;
	let left = this.width * 0.6// + bobX;
	let top = this.height - player.weapon.sprite.size[0] * player.weapon.sprite.scale//+ bobY;

	this.ctx.save();
    this.ctx.translate(left, top);
    weapon.sprite.render(this.ctx);
    this.ctx.restore();

	//this.ctx.drawImage(weapon.image, left, top, weapon.width * this.scale * 1.2, weapon.height * this.scale * 1.2);
};

Camera.prototype.drawAim = function(aim) {
	this.ctx.drawImage(aim.image, camera.width / 2, camera.height / 2, 15, 15);
}

Camera.prototype.drawColumn = function(column, ray, angle, map) {
	let ctx = this.ctx;
	let texture = map.wallTexture;
	let left = Math.floor(column * this.spacing);
	let width = Math.ceil(this.spacing);
	let hit = -1;
	let objects = [];
	let hitDistance;

	while (++hit < ray.length && ray[hit].height <= 0);

	for (let s = ray.length - 1; s >= 0; s--) {
		let step = ray[s];
		let rainDrops = Math.pow(Math.random(), 3) * s;
		let rain = (rainDrops > 0) && this.project(0.1, angle, step.distance);
		let textureX;
		let wall;

		if (s === hit) {
			textureX = Math.floor(texture.width * step.offset);
			wall = this.project(step.height, angle, step.distance);

			ctx.globalAlpha = 1;
			ctx.drawImage(texture.image, textureX, 0, 1, texture.height, left, wall.top, width, wall.height);

			// shadow on the wall

			ctx.fillStyle = '#000000';
			ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map.light, 0);
			ctx.fillRect(left, wall.top, width, wall.height + 1);
			hitDistance = step.distance;
		}

    	/*
    	* i dont know 
    	*/
		else if(step.object) {
			objects.push({
				object: step.object,
				distance: step.distance,
				offset: step.offset,
				angle: angle
			});			
		}

		//ctx.fillStyle = '#ffffff';
		//ctx.globalAlpha = 0.15;
		//while (--rainDrops > 0) ctx.fillRect(left, Math.random() * rain.top, 1, rain.height);
	}
	return {
		hit: hitDistance
	}
};

Camera.prototype.project = function(height, angle, distance) {
	let z = distance * Math.cos(angle);
	let wallHeight = this.height * height / z;
	let bottom = this.height / 2 * (1 + 1 / z);
	return {
		top: bottom - wallHeight,
		height: wallHeight
	};
};

Camera.prototype.projectSprite = function(height, distance) {
	let z = distance;
	let wallHeight = this.height * height / z;
	let bottom = this.height / 2 * (1 + 1 / z);
	return {
		top: bottom - wallHeight,
		height: wallHeight
	};
};

Camera.prototype.drawSprites = function(player, map, columnProps) {
	let screenWidth = this.width;
	let screenHeight = this.height;
	let screenRatio = screenWidth / this.focalLength;
	let resolution = this.resolution;

	//probably should get these and pass them in, but modifying originals for now
	// also this limits size of world

	let sprites = Array.prototype.slice.call(map.objects)
		.map(function(sprite){
			let distX = sprite.x - player.x;
		    let distY = sprite.y - player.y;
		    let width = sprite.width * screenWidth / sprite.distanceFromPlayer;
		    let height = sprite.height * screenHeight /  sprite.distanceFromPlayer;
		    let renderedFloorOffset = sprite.floorOffset / sprite.distanceFromPlayer;
		    let angleToPlayer = Math.atan2(distY,distX);
		    let angleRelativeToPlayerView = player.direction - angleToPlayer;
		    let top = (screenHeight / 2) * (1 + 1 / sprite.distanceFromPlayer) - height;

			if(angleRelativeToPlayerView >= CIRCLE / 2) {
				angleRelativeToPlayerView -= CIRCLE;    
			}

			let cameraXOffset = ( camera.width / 2 ) - (screenRatio * angleRelativeToPlayerView);
			let	numColumns = width / screenWidth * resolution;
			let	firstColumn = Math.floor( (cameraXOffset - width/2 ) / screenWidth * resolution);

			sprite.distanceFromPlayer = Math.sqrt( Math.pow( distX, 2) + Math.pow( distY, 2) );
			sprite.render = {
				width: width,
				height: height,
				angleToPlayer: angleRelativeToPlayerView,
				cameraXOffset: cameraXOffset,
				distanceFromPlayer: sprite.distanceFromPlayer,
				numColumns: numColumns,
				firstColumn: firstColumn,
				top: top
			};

			return sprite;
		})
		// sort sprites in distance order
		/*.sort(function(a, b){
			if(a.distanceFromPlayer < b.distanceFromPlayer){
			  return 1;
			}
			if(a.distanceFromPlayer > b.distanceFromPlayer){
			  return -1;
			}
			return 0;
		});*/

	let hits = columnProps.map(obj => obj.hit);
	if(Math.min.apply(null, sprites.filter(sprite => sprite.type === 'enemy')
								   .map(sprite => sprite.distanceFromPlayer)) < 0.3) {
		showWindow(document.getElementById('die_window'));
		pauseGame();
		unlockPointer();
	}
	if(Math.min.apply(null, sprites.filter(sprite => sprite.type === 'enemy')
								   .map(sprite => sprite.distanceFromPlayer)) < 1) {
		timer.reduceTime(100);
	}
	if(Math.min.apply(null, sprites.map(sprite => sprite.distanceFromPlayer)) < 5) {		
		this.ctx.save();
	
		sprites.map(sprite => {
			if (sprite.type == 'exit' && sprite.distanceFromPlayer < 0.7) {				
				showWindow(document.getElementById('win_window'));
				pauseGame();
				unlockPointer();				
			}
			sprite.texture.update(35 * 7 / map.objects.length);
			let max = sprite.texture.frames.length;
	        let idx = Math.floor(sprite.texture._index);
	        sprite.texture.frame = sprite.texture.frames[idx % max];       
		});	

		for (let column = 0; column < this.resolution; column++) {
			this.drawSpriteColumn(player, map, column, hits[column], sprites);
		}
		//this.newDrawSpriteColumn(player, map, hits, sprites);
		this.ctx.restore();
	}
}	

/*Camera.prototype.newDrawSpriteColumn = function(player, map, hits, sprites) {
	let ctx = this.ctx;
	let width = Math.ceil(this.spacing);
	let columnWidth = this.width / 720;	
	let startColumn;
	let endColumn;

	for (let column = 0; column < 720; column++) {

		let	left = Math.floor(column * this.spacing);	
		let angle = this.focalLength * (column / 720 - 0.5);
		let hit = hits[column];		
		sprite = sprites[0];

		let spriteIsInColumn = left > sprite.render.cameraXOffset - ( sprite.render.width / 2 ) 
								&& left < sprite.render.cameraXOffset + ( sprite.render.width / 2 );


		if(spriteIsInColumn) {
			let x = sprite.texture.pos[0];
        	x += sprite.texture.frame * sprite.texture.size[0];

			let textureX = Math.floor( sprite.texture.size[0] / sprite.render.numColumns * ( column - sprite.render.firstColumn ) );
			ctx.drawImage(sprite.texture.resource, 
       			textureX + x, 0, 
       			1, sprite.texture.size[1], 
       			left, sprite.render.top, 
       			width, sprite.render.height);
		}

		/*sprites = sprites.filter(sprite => sprite.distanceFromPlayer < hit); 
	


		for(let i = 0; i < sprites.length; i++) {
			let sprite = sprites[i];
			sprite.texture.update(3);
			let spriteIsInColumn = left > sprite.render.cameraXOffset - ( sprite.render.width / 2 ) 
								&& left < sprite.render.cameraXOffset + ( sprite.render.width / 2 );

			let x = sprite.texture.pos[0];
        	x += sprite.texture.frame * sprite.texture.size[0];

			if(spriteIsInColumn) {
				let textureX = Math.floor( sprite.texture.size[0] / sprite.render.numColumns * ( column - sprite.render.firstColumn ) );
				ctx.drawImage(sprite.texture.resource, 
       				textureX + x, 0, 
       				1, sprite.texture.size[1], 
       				left, sprite.render.top, 
       				width, sprite.render.height);
			}
		}
	}
}*/

Camera.prototype.drawSpriteColumn = function(player, map, column, hit, sprites) {
	let ctx = this.ctx;
	let left = Math.floor(column * this.spacing);
	let width = Math.ceil(this.spacing);
	let angle = this.focalLength * (column / this.resolution - 0.5);
	let columnWidth = this.width / this.resolution;
	//console.log(breaked)
	sprites = sprites.filter(sprite => sprite.distanceFromPlayer < hit);  
	for(let i = 0; i < sprites.length; i++){
		let sprite = sprites[i];    	

		//determine if sprite should be drawn based on current column position and sprite width
		let spriteIsInColumn = left > sprite.render.cameraXOffset - ( sprite.render.width / 2 ) 
							&& left < sprite.render.cameraXOffset + ( sprite.render.width / 2 );

		let isInAim =  left > sprite.render.cameraXOffset - ( sprite.render.width / 3 ) 
					&& left < sprite.render.cameraXOffset + ( sprite.render.width / 4 );

		if (isInAim && angle == 0 && controls.mouseHold) {
			map.deleteObject(sprite.x, sprite.y);
			return;
		}
			
		if (spriteIsInColumn) {
			//if (angle == 0) console.log('piu')
			let textureX = Math.floor( sprite.texture.size[0] / sprite.render.numColumns * ( column - sprite.render.firstColumn ) );
			//let brightness = Math.max(sprite.distanceFromPlayer / this.lightRange, 0) * 100;
      		//sprite.texture.render(ctx);
		
			//ctx.drawImage(resources.get(sprite.texture.url), textureX, 0, 1, sprite.texture.size[1], left, sprite.render.top, width, sprite.render.height);
      		//sprite.texture.render(ctx);
      		let x = sprite.texture.pos[0];
        	x += sprite.texture.frame * sprite.texture.size[0];      		
      		//console.log(sprite.texture.resource);
       		ctx.drawImage(sprite.texture.resource, 
       			textureX + x, 0, 
       			1, sprite.texture.size[1], 
       			left, sprite.render.top, 
       			width, sprite.render.height);
		} 
	};
};

function GameLoop() {
	this.frame = this.frame.bind(this);
	this.lastTime = 0;
	this.callback = function() {};
}

function Objects(){
	this.collection = [];
}

Objects.prototype.update = function(){
	map.objects.forEach(function(item){
		item.logic && item.logic();
	});
}

GameLoop.prototype.start = function(callback) {
	this.callback = callback;
	requestAnimationFrame(this.frame);
};

GameLoop.prototype.frame = function(time) {
	let seconds = (time - this.lastTime) / 1000;
	this.lastTime = time;
	if (seconds < 0.2) this.callback(seconds);
	if (!isGameOver) requestAnimationFrame(this.frame);
};

resources.load([
    'img/aim1.png',
    'img/pistol.png',
    'img/katana.png',
    'img/wall_texture.jpg',
    'img/wall_texture1.jpg',
    'img/wall_texture2.jpg',
    'img/deathvalley_panorama.jpg',
    'img/pistol_arr.png',
    'img/zombie.png',
    'img/antidot.png'
]);

let mazeMap;
let mapSize;
let map;
let player;

let controls;
//controls = new Controls();
let objects;
let camera;
let loop;
let timer;

let FPSCount = 0;
let FPSSeconds = 0;
let FPSTime = 1;

let isGameOver;

resources.onReady(allowStartButton);

function allowStartButton() {
    let startButton = document.getElementById('start_button');
    startButton.disabled = !startButton.disabled;
}
//resources.onReady(map.addExit.bind(map, mazeMap, mapSize));

function findPlayerPosition(mazeMap, mapSize) {
	let map = mazeMap.map((x,i) => (x === 5) ? [i % mapSize + 0.5, Math.floor(i / mapSize) + 0.5] : 0);
	return map.filter(x => x)[0];
}

function createMap(level) {
	mazeMap = levels[level].mazeMap;
	mapSize = levels[level].mapSize;
	map = new Map(mapSize);

	let playerPos = findPlayerPosition(mazeMap, mapSize);
	player = new Player(playerPos[0], playerPos[1], Math.PI * 1.5);

	objects = new Objects();
	controls = new Controls();
	camera = new Camera(display, 480, 1.2);
	loop = new GameLoop();
	timer = new Timer(levels[level].time);
}

function startGame(level) {
	if (level > levels.length - 1) {
		level = 0;
	}
	isGameOver = false;
	createMap(level);

	map.addEnemies(mazeMap, mapSize);
	map.addExit(mazeMap, mapSize);

	showGame();
	
	timer.startTimer();	
	map.generate();
    if (numOfStarts == 0) {
	   loop.start(frame);	
	   numOfStarts++;
    }
}

function frame(seconds) {
	if (!controls.states.gamePaused) {
		map.update(seconds);		
		camera.render(player, map);
		camera.showFPS(seconds);
	}
	if (controls.mouseHold || player.weapon.sprite._index != 0) {
		animateWeapon(seconds);
	}
	player.update(controls.states, map, seconds);
}

Camera.prototype.showFPS = function(seconds) {
	FPSCount++;
	FPSSeconds += seconds; 
	if (FPSCount === 20) {
		FPSCount = 0;
		FPSTime = FPSSeconds;
		FPSSeconds = 0;
	}
	this.ctx.fillStyle = "red";
	this.ctx.font = "20px Arial";
	this.ctx.fillText(`${Math.round(1 / FPSTime * 20)}`, 10, 30);
	this.ctx.fillText(timer.timeAsString, 70, 30);
	if (timer.time == 0) {
		showWindow(document.getElementById('die_window'));
		pauseGame();
		unlockPointer();
	}
}

function animateWeapon(seconds) {
	if (!player.weapon.sprite._index) {
	  snd.pause();
	  snd.currentTime = 0;
	  snd.play();
	}
	player.weapon.sprite.update(seconds * 1000);
	player.weapon.sprite.checkEnd();
}

function enemyLogic(base) {
	return function() {
		let self = this;

		//console.log('logic!')

		/*if(self.distanceFromPlayer < 2){
		  if (this.floorOffset){
		    this.texture = new Bitmap('img/ogre.png', 600, 500);
		    this.floorOffset--;
		  }
		  else {
		    this.texture = new Bitmap('img/cowboy.png', 639, 1500);
		    this.floorOffset++;
		  }
		  /*this.x += this.speed * Math.cos(this.render.angleToPlayer);
		  this.y += this.speed * Math.sin(this.render.angleToPlayer);*/
		  
		//} 
	};
}
