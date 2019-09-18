// Отстой пидорский 80е говно!
import _ from 'lodash';

import { Bitmap } from './components/Bitmap';
import { Sprite } from './components/Sprite';
import { levels } from './components/levels';

import './css/main.css';

import shot from './sounds/shot.wav';
import ambient from './sounds/ambient.mp3';
import danger from './sounds/come-here.wav';
import reload from './sounds/reload.wav';

import aim from './img/aim1.png';
import pistol from './img/pistol.png';
import katana from './img/katana.png';
import wall from './img/wall_texture4.jpg';
import panorama from './img/deathvalley_panorama.jpg';
import pistols from './img/pistol_arr.png';
import pistolReload from './img/pistol_reload.png';
import zombie from './img/zombie.png';
import antidot from './img/antidot.png';

(function () {
  const resourceCache = {};
  const readyCallbacks = [];

  // Load an image url or an array of image urls
  function load(urlOrArr) {
    if (urlOrArr instanceof Array) {
      urlOrArr.forEach(function (url) {
        _load(url);
      });
    }
    else {
      _load(urlOrArr);
    }
  }

  function _load(url) {
    if (resourceCache[url]) {
      return resourceCache[url];
    }

    const img = new Image();
    img.onload = function () {
      resourceCache[url] = img;

      if (isReady()) {
        readyCallbacks.forEach(func => func());
      }
    };
    resourceCache[url] = false;
    img.src = url;
  }

  function get(url) {
    return resourceCache[url];
  }

  function isReady() {
    let ready = true;

    for (const k in resourceCache) {
      if (resourceCache.hasOwnProperty(k) &&
        !resourceCache[k]) {
        ready = false;
      }
    }

    return ready;
  }

  function onReady(func) {
    readyCallbacks.push(func);
  }

  window.resources = {
    load: load,
    get: get,
    onReady: onReady,
    isReady: isReady
  };
})();


const shotSound = new Audio(shot);
const ambientSound = new Audio(ambient);
const dieSound = new Audio(danger);
const reloadSound = new Audio(reload);

ambientSound.loop = true;
ambientSound.volume = 1;

let numOfStarts = 0;

const CIRCLE = Math.PI * 2;
const display = document.getElementById('display');

const lockPointer = () => {
  display.requestPointerLock();
};

const unlockPointer = () => {
  document.exitPointerLock();
};

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
    const milliseconds = Math.floor((time) / 100 % 10);
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

function Controls() {
  this.codes = {
    37: 'left',
    39: 'right',
    38: 'forward',
    40: 'backward',
    65: 'sideLeft',
    68: 'sideRight',
    87: 'forward',
    83: 'backward',
    120: 'F9',
    82: 'reload',
  };

  this.states = {
    left: false,
    right: false,
    forward: false,
    backward: false,
    gamePaused: false,
    weaponReload: false,
  };


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

Controls.prototype.onKey = function (val, e) {
  const state = this.codes[e.keyCode];

  if (typeof state === 'undefined') {
    return;
  }

  this.states[state] = val;
  e.preventDefault && e.preventDefault();
  e.stopPropagation && e.stopPropagation();
};

Controls.prototype.onMouseMovement = function (e) {
  const x = (e.movementX || e.mozMovementX || e.webkitMovementX || 0);

  if (x > 0 && !controls.states.gamePaused) {
    player.rotate(Math.PI / 3000 * x);
  }

  if (x < 0 && !controls.states.gamePaused) {
    player.rotate(Math.PI / 3000 * x);
  }
};

Controls.prototype.onMouseWheel = function (e) {
  if (e.target === document.getElementById('display')) {
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
  }
};

Controls.prototype.onMouseClick = function () {
  !controls.states.gamePaused && (this.mouseClicked = true);
};

Controls.prototype.onMouseHold = function () {
  !controls.states.gamePaused && (this.mouseHold = true);
};

Controls.prototype.onMouseUp = function () {
  this.mouseHold = false;
};

function Player(x, y, direction) {
  this.x = x;
  this.y = y;
  this.direction = direction;
  this.weapon = {
    currentBullet: 12,
    totalBullet: 20,
    pos: [0, 0],
    sprite: new Sprite(pistols, [0, 0], [130, 130], 80, [0, 1, 2], undefined, true, 1.7),
    needReload: false,
    reloadSprite: new Sprite(pistolReload, [0, 0], [130, 130], 80,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], undefined, false, 1.7)
  };
  this.aim = new Bitmap(aim, 512, 512);
  this.paces = 0;
}

Player.prototype.rotate = function (angle) {
  this.direction = (this.direction + angle + CIRCLE) % (CIRCLE);
};

Player.prototype.walk = function (distance, map, direction) {
  const dx = Math.cos(direction) * distance;
  const dy = Math.sin(direction) * distance;

  if (map.get(this.x + dx, this.y) <= 0) {
    this.x += dx;
  }
  if (map.get(this.x, this.y + dy) <= 0) {
    this.y += dy;
  }
  this.paces += distance;
};

Player.prototype.update = function (controls, map, seconds) {
  if (controls.left && !controls.gamePaused) {
    this.rotate(-Math.PI * seconds);
  }
  if (controls.right && !controls.gamePaused) {
    this.rotate(Math.PI * seconds);
  }
  if (controls.forward && !controls.gamePaused) {
    this.walk(1.0 * seconds, map, this.direction);
  }
  if (controls.backward && !controls.gamePaused) {
    this.walk(-1.0 * seconds, map, this.direction);
  }
  if (controls.sideLeft && !controls.gamePaused) {
    this.walk(1.0 * seconds, map, this.direction - Math.PI / 2);
  }
  if (controls.sideRight && !controls.gamePaused) {
    this.walk(-1.0 * seconds, map, this.direction - Math.PI / 2);
  }
  if (controls.reload && !controls.gamePaused && (player.weapon.totalBullet || player.weapon.currentBullet)) {
    this.weapon.needReload = true;
    this.weapon.sprite._index = 0;
    reloadSound.playbackRate = 0.5;
    reloadSound.pause();
    reloadSound.currentTime = 0;
    reloadSound.play();
  }
  if (controls.F9) {
    pauseGame(true);
    unlockPointer();
  }
};

function pauseGame(isWindowShow) {
  if (controls.states.gamePaused && controls.states.F9) {
    controls.states.gamePaused = false;
    controls.states.F9 = false;
    timer.startTimer();
    lockPointer();
  }
  else {
    controls.states.gamePaused = true;
    controls.states.F9 = false;
    timer.stopTimer();
  }
  if (isWindowShow) {
    showWindow(document.getElementById('pause_window'));
  }
}

function showWindow(elem) {
  elem.classList.toggle('show');
}

function Map(size) {
  this.size = size;
  this.wallGrid = new Uint8Array(size * size);
  this.skyBox = new Bitmap(panorama, 2000, 750);
  this.wallTexture = new Bitmap(wall, 680, 438);
  //this.wallTexture = new Bitmap('img/wall_texture3.jpg', 600, 400);
  //this.wallTexture = new Bitmap('img/wall_texture.jpg', 1024, 1024);
  this.light = 0;
  this.objects = [];
}

Map.prototype.get = function (x, y) {
  x = Math.floor(x);
  y = Math.floor(y);

  if (x < 0 || x > this.size - 1 || y < 0 || y > this.size - 1) {
    return -1;
  }
  return this.wallGrid[y * this.size + x];
};

Map.prototype.getObject = function (x, y) {
  x = Math.floor(x);
  y = Math.floor(y);
  return this.objects[y * this.size + x];
};

Map.prototype.generate = function () {
  this.wallGrid = mazeMap.map(x => (x > 1) ? 0 : x);
};

Map.prototype.cast = function (point, angle, range) {
  const self = this;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const noWall = { length2: Infinity };

  return ray({ x: point.x, y: point.y, height: 0, distance: 0 });

  function ray(origin) {
    const stepX = step(sin, cos, origin.x, origin.y, false);
    const stepY = step(cos, sin, origin.y, origin.x, true);
    const nextStep = stepX.length2 < stepY.length2
      ? inspect(stepX, 1, 0, origin.distance, stepX.y)
      : inspect(stepY, 0, 1, origin.distance, stepY.x);

    if (nextStep.distance > range) {
      return [origin];
    }

    return [origin].concat(ray(nextStep));
  }

  function step(rise, run, x, y, inverted) {
    if (run === 0) {
      return noWall;
    }

    const dx = run > 0 ? Math.floor(x + 1) - x : Math.ceil(x - 1) - x;
    const dy = dx * (rise / run);

    return {
      x: inverted ? y + dy : x + dx,
      y: inverted ? x + dx : y + dy,
      length2: dx * dx + dy * dy
    };
  }

  function inspect(step, shiftX, shiftY, distance, offset) {
    const dx = cos < 0 ? shiftX : 0;
    const dy = sin < 0 ? shiftY : 0;

    step.height = self.get(step.x - dx, step.y - dy);
    step.distance = distance + Math.sqrt(step.length2);
    step.object = self.getObject(step.x - dx, step.y - dy);

    if (shiftX) {
      step.shading = cos < 0 ? 2 : 0;
    } else {
      step.shading = sin < 0 ? 2 : 1;
    }

    step.offset = offset - Math.floor(offset);

    return step;
  }
};

Map.prototype.update = function (seconds) {
  if (this.light > 0) {
    this.light = Math.max(this.light - 10 * seconds, 0);
  }
  // else if (Math.random() * 5 < seconds) this.light = 2;
};

Map.prototype.addEnemies = function (enemiesMap, mapSize) {
  const animationArr = Array(33).fill(0).map((el, i) => i);
  const addEnemy = this.addObject.bind(this, {
    texture: new Sprite(zombie, [0, 0], [415, 487], 500, animationArr, undefined, false, 1),
    height: 0.6,
    width: 0.3,
    type: 'enemy',
    floorOffset: 0,
    speed: 0.1,
    logic: enemyLogic(),
    killed: false
  });
  enemiesMap.map((x, i) => (x === 2)
    ? addEnemy(i % mapSize + 0.5, Math.floor(i / mapSize) + 0.5)
    : undefined);
};

Map.prototype.addExit = function (exitMap, mapSize) {
  const addExit = this.addObject.bind(this, {
    texture: new Sprite(antidot, [0, 0], [500, 519]),
    height: 0.6,
    width: .3,
    type: 'exit'
  });
  exitMap.map((x, i) => (x === 3)
    ? addExit(i % mapSize + 0.5, Math.floor(i / mapSize) + 0.5)
    : undefined);
};

Map.prototype.addObject = function (object, x, y) {
  this.objects.push(new MapObject(object, x, y));
};

Map.prototype.deleteObject = function (x, y) {
  this.objects = this.objects.filter(obj => obj.type !== 'enemy' || (obj.x !== x || obj.y !== y));
};

function MapObject(object, x, y) {
  for (const prop in object) {
    this[prop] = object[prop];
  }
  this.x = x;
  this.y = y;
}

function Camera(canvas, resolution, focalLength) {
  this.ctx = canvas.getContext('2d');
  this.width = canvas.width = window.innerWidth * 0.5;
  this.height = canvas.height = window.innerHeight * 0.5;
  this.resolution = resolution || 320;
  this.spacing = this.width / this.resolution; //column width
  this.focalLength = focalLength || 1.2;
  this.range = 10;  // wall visibility range
  this.lightRange = 4; // wall light range
  this.scale = (this.width + this.height) / 1200;
}

Camera.prototype.render = function (player, map) {
  this.drawSky(player.direction, map.skyBox, map.light);
  this.drawColumns(player, map);
  this.drawWeapon(player.weapon, player.paces);
  this.drawAim(player.aim);
};

Camera.prototype.drawSky = function (direction, sky, ambient) {
  const width = sky.width * (this.height / sky.height) * 2;
  const left = (direction / CIRCLE) * -width;

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

Camera.prototype.drawColumns = function (player, map) {
  this.ctx.save();
  const allObjects = [];

  for (let column = 0; column < this.resolution; column++) {
    const angle = this.focalLength * (column / this.resolution - 0.5);
    const ray = map.cast(player, player.direction + angle, this.range);
    const columnProps = this.drawColumn(column, ray, angle, map);
    allObjects.push(columnProps);
  }

  this.ctx.restore();
  this.ctx.save();
  this.drawSprites(player, map, allObjects);
  this.ctx.restore();
};

Camera.prototype.drawWeapon = function (weapon) {
  const left = this.width * 0.6;
  const top = this.height - player.weapon.sprite.size[0] * player.weapon.sprite.scale;

  this.ctx.save();
  this.ctx.translate(left, top);
  if (!weapon.needReload) {
    weapon.sprite.render(this.ctx);
    if (weapon.currentBullet <= 0 && weapon.sprite._index === 0) {
      weapon.needReload = true;
    }
  } else {
    weapon.reloadSprite.render(this.ctx);
  }

  this.ctx.restore();
};

Camera.prototype.drawAim = function (aim) {
  this.ctx.drawImage(aim.image, camera.width / 2 - 15 / 2, camera.height / 2, 15, 15);
};

Camera.prototype.drawColumn = function (column, ray, angle, map) {
  const ctx = this.ctx;
  const texture = map.wallTexture;
  const left = Math.floor(column * this.spacing);
  const width = Math.ceil(this.spacing);
  const objects = [];
  let hit = 0;
  let hitDistance;

  while (hit < ray.length && ray[hit].height <= 0) {
    hit++;
  }

  for (let s = ray.length - 1; s >= 0; s--) {
    const step = ray[s];
    // const rainDrops = Math.pow(Math.random(), 3) * s;
    // const rain = (rainDrops > 0) && this.project(0.1, angle, step.distance);
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
    } else if (step.object) {
      objects.push({
        object: step.object,
        distance: step.distance,
        offset: step.offset,
        angle: angle
      });
    }
  }
  return {
    hit: hitDistance
  };
};

Camera.prototype.project = function (height, angle, distance) {
  const z = distance * Math.cos(angle);
  const wallHeight = this.height * height / z;
  const bottom = this.height / 2 * (1 + 1 / z);

  return {
    top: bottom - wallHeight,
    height: wallHeight
  };
};

Camera.prototype.projectSprite = function (height, distance) {
  const z = distance;
  const wallHeight = this.height * height / z;
  const bottom = this.height / 2 * (1 + 1 / z);

  return {
    top: bottom - wallHeight,
    height: wallHeight
  };
};

Camera.prototype.drawSprites = function (player, map, columnProps) {
  const screenWidth = this.width;
  const screenHeight = this.height;
  const screenRatio = screenWidth / this.focalLength;
  const resolution = this.resolution;

  //probably should get these and pass them in, but modifying originals for now
  // also this limits size of world

  const sprites = Array.prototype.slice.call(map.objects).map(function (sprite) {
    const distX = sprite.x - player.x;
    const distY = sprite.y - player.y;
    const width = sprite.width * screenWidth / sprite.distanceFromPlayer;
    const height = sprite.height * screenHeight / sprite.distanceFromPlayer;
    // const renderedFloorOffset = sprite.floorOffset / sprite.distanceFromPlayer;
    const angleToPlayer = Math.atan2(distY, distX);
    let angleRelativeToPlayerView = player.direction - angleToPlayer;
    const top = (screenHeight / 2) * (1 + 1 / sprite.distanceFromPlayer) - height;

    if (angleRelativeToPlayerView >= CIRCLE / 2) {
      angleRelativeToPlayerView -= CIRCLE;
    }

    const cameraXOffset = (camera.width / 2) - (screenRatio * angleRelativeToPlayerView);
    const numColumns = width / screenWidth * resolution;
    const firstColumn = Math.floor((cameraXOffset - width / 2) / screenWidth * resolution);

    sprite.distanceFromPlayer = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
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
  });

  const hits = columnProps.map(obj => obj.hit);
  const enemies = sprites.filter(sprite => sprite.type === 'enemy');
  const minDistanceFromPlayer = Math.min.apply(null, enemies.map(sprite => sprite.distanceFromPlayer));

  if (minDistanceFromPlayer < 0.3) {
    showWindow(document.getElementById('die_window'));
    pauseGame();
    unlockPointer();
  }
  if (minDistanceFromPlayer < 1) {
    timer.reduceTime(100);
    dieSound.play();
  }
  if (Math.min.apply(null, sprites.map(sprite => sprite.distanceFromPlayer)) < 5) {
    this.ctx.save();

    sprites.forEach(sprite => {
      if (sprite.type === 'exit' && sprite.distanceFromPlayer < 0.7) {
        showWindow(document.getElementById('win_window'));
        pauseGame();
        unlockPointer();
      }

      sprite.texture.update(35 * 7 / map.objects.length);
      const max = sprite.texture.frames.length;
      const idx = Math.floor(sprite.texture._index);
      sprite.texture.frame = sprite.texture.frames[idx % max];
    });

    for (let column = 0; column < this.resolution; column++) {
      this.drawSpriteColumn(player, map, column, hits[column], sprites);
    }

    this.ctx.restore();
  }
};

Camera.prototype.drawSpriteColumn = function (player, map, column, hit, sprites) {
  const ctx = this.ctx;
  const left = Math.floor(column * this.spacing);
  const width = Math.ceil(this.spacing);
  const angle = this.focalLength * (column / this.resolution - 0.5);
  // const columnWidth = this.width / this.resolution;

  sprites = sprites.filter(sprite => sprite.distanceFromPlayer < hit);
  for (let i = 0; i < sprites.length; i++) {
    const sprite = sprites[i];

    //determine if sprite should be drawn based on current column position and sprite width
    const spriteIsInColumn = left > sprite.render.cameraXOffset - (sprite.render.width / 2)
      && left < sprite.render.cameraXOffset + (sprite.render.width / 2);

    const isInAim = left > sprite.render.cameraXOffset - (sprite.render.width / 3)
      && left < sprite.render.cameraXOffset + (sprite.render.width / 4);

    if (isInAim && angle === 0 && controls.mouseHold && !player.weapon.needReload) {
      map.deleteObject(sprite.x, sprite.y);
      return;
    }

    if (spriteIsInColumn) {
      //if (angle == 0) console.log('piu')
      const textureX = Math.floor(sprite.texture.size[0] / sprite.render.numColumns * (column - sprite.render.firstColumn));
      //let brightness = Math.max(sprite.distanceFromPlayer / this.lightRange, 0) * 100;
      //sprite.texture.render(ctx);

      //ctx.drawImage(resources.get(sprite.texture.url), textureX, 0, 1, sprite.texture.size[1], left, sprite.render.top, width, sprite.render.height);
      //sprite.texture.render(ctx);
      let x = sprite.texture.pos[0];
      x += sprite.texture.frame * sprite.texture.size[0];
      //console.log(sprite.texture.resource);
      ctx.drawImage(
        sprite.texture.resource,
        textureX + x, 0,
        1, sprite.texture.size[1],
        left, sprite.render.top,
        width, sprite.render.height,
      );
    }
  }
};

function GameLoop() {
  this.frame = this.frame.bind(this);
  this.lastTime = 0;
  this.callback = function () { };
}

function Objects() {
  this.collection = [];
}

Objects.prototype.update = function () {
  map.objects.forEach(function (item) {
    item.logic && item.logic();
  });
};

GameLoop.prototype.start = function (callback) {
  this.callback = callback;
  requestAnimationFrame(this.frame);
};

GameLoop.prototype.frame = function (time) {
  const seconds = (time - this.lastTime) / 1000;
  this.lastTime = time;

  if (seconds < 0.2) {
    this.callback(seconds);
  }

  if (!isGameOver) {
    requestAnimationFrame(this.frame);
  }
};

window.resources.load([
  aim,
  pistol,
  katana,
  wall,
  panorama,
  pistols,
  pistolReload,
  zombie,
  antidot,
]);

let resolution = 720;
let levelNum = 0;

let mazeMap;
let mapSize;
let map;
let player;

let controls;
let camera;
let loop;
let timer;

let FPSCount = 0;
let FPSSeconds = 0;
let FPSTime = 1;

let isGameOver;

window.resources.onReady(allowStartButton);

function allowStartButton() {
  const startButton = document.getElementById('start_button');
  startButton.disabled = !startButton.disabled;
}

function findPlayerPosition(mazeMap, mapSize) {
  const map = mazeMap.map((x, i) => (x === 5) ? [i % mapSize + 0.5, Math.floor(i / mapSize) + 0.5] : 0);
  return map.filter(x => x)[0];
}

function createMap(level) {
  mazeMap = levels[level].mazeMap;
  mapSize = levels[level].mapSize;
  map = new Map(mapSize);

  const playerPosition = findPlayerPosition(mazeMap, mapSize);
  player = new Player(playerPosition[0], playerPosition[1], Math.PI * 1.5);
  controls = new Controls();
  camera = new Camera(display, resolution, 1.2);
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

  ambientSound.play();

  timer.startTimer();
  map.generate();

  if (numOfStarts === 0) {
    loop.start(frame);
    numOfStarts++;
  }
}

function frame(seconds) {
  player.update(controls.states, map, seconds);
  if ((controls.mouseHold || player.weapon.sprite._index !== 0) && !player.weapon.needReload) {
    animateWeapon(seconds);
  }
  else if (player.weapon.needReload && (player.weapon.totalBullet || player.weapon.currentBullet)) {
    animateWeaponReload(seconds);
  }
  if (!controls.states.gamePaused) {
    map.update(seconds);
    camera.render(player, map);
    camera.showFPS(seconds);
  }
}

Camera.prototype.showFPS = function (seconds) {
  FPSCount++;
  FPSSeconds += seconds;
  if (FPSCount === 20) {
    FPSCount = 0;
    FPSTime = FPSSeconds;
    FPSSeconds = 0;
  }
  this.ctx.fillStyle = '#2fd761';
  this.ctx.font = '20px Calibri';
  this.ctx.fillText(`${Math.round(1 / FPSTime * 20)}`, 10, 30);
  this.ctx.fillText(timer.timeAsString, 70, 30);
  this.ctx.fillText(`${player.weapon.currentBullet}/${player.weapon.totalBullet}`, 170, 30);
  if (timer.time === 0) {
    showWindow(document.getElementById('die_window'));
    pauseGame();
    unlockPointer();
  }
};

function animateWeapon(seconds) {
  if (player.weapon.sprite._index === 0) {
    shotSound.pause();
    shotSound.currentTime = 0;
    shotSound.play();
    player.weapon.currentBullet--;
  }
  player.weapon.sprite.update(seconds * 1000);
  player.weapon.sprite.checkEnd();

}

function animateWeaponReload(seconds) {
  player.weapon.reloadSprite.update(seconds * 1000);
  if (player.weapon.reloadSprite.checkEnd()) {
    const allBullets = player.weapon.totalBullet;
    const currBullets = player.weapon.currentBullet;
    if (allBullets >= 12) {
      player.weapon.totalBullet -= 12 - player.weapon.currentBullet;
      player.weapon.currentBullet = 12;
    }
    else if (allBullets < 12 && allBullets + currBullets < 12) {
      player.weapon.currentBullet += player.weapon.totalBullet;
      player.weapon.totalBullet = 0;
    }
    else if (allBullets < 12 && allBullets + currBullets >= 12) {
      player.weapon.totalBullet -= 12 - player.weapon.currentBullet;
      player.weapon.currentBullet = 12;
    }

    player.weapon.needReload = false;
  }
}

function enemyLogic() {
  return function () {
    // if(self.distanceFromPlayer < 2){
    //   if (this.floorOffset){
    //     this.texture = new Bitmap('img/ogre.png', 600, 500);
    //     this.floorOffset--;
    //   }
    //   else {
    //     this.texture = new Bitmap('img/cowboy.png', 639, 1500);
    //     this.floorOffset++;
    //   }
    //   this.x += this.speed * Math.cos(this.render.angleToPlayer);
    //   this.y += this.speed * Math.sin(this.render.angleToPlayer);

    // }
  };
}





const menuButton = document.getElementsByClassName('game__button_menu');
const restartButton = document.getElementsByClassName('game__button_restart');
const nextLevelButton = document.getElementsByClassName('game__button_next');
const helpWindows = document.getElementsByClassName('help-window');

const startButton = document.getElementById('start_button');
startButton.addEventListener('click', gameEvent.bind(null, 'start'), false);

const closeButton = document.getElementById('close_button');
closeButton.addEventListener('click', showWindow.bind(null, document.getElementById('settings_window')), false);
closeButton.addEventListener('click', showWindow.bind(null, document.getElementById('pause_window')), false);
closeButton.addEventListener('click', unlockPointer, false);

_.forEach(restartButton, button => button.addEventListener('click', gameEvent.bind(null, 'restart'), false));
_.forEach(menuButton, button => button.addEventListener('click', showMenu, false));
_.forEach(nextLevelButton, button => button.addEventListener('click', gameEvent.bind(null, 'next'), false));
document.getElementById('die_window').addEventListener('click', showWindow.bind(null, document.getElementById('die_window')));
document.getElementById('win_window').addEventListener('click', showWindow.bind(null, document.getElementById('win_window')));
document.getElementById('pause_list').addEventListener('click', selectEvent, false);
document.getElementById('resolution').addEventListener('click', changeResolution, false);

function showMenu() {
  document.getElementById('main__game').classList.toggle('show');
  document.getElementById('display').classList.toggle('show');
  document.getElementById('main__info').classList.toggle('hide');
  ambientSound.pause();
}

function showGame() {
  if (display.classList.contains('show')) {
    return;
  }

  document.getElementById('main__game').classList.toggle('show');
  display.classList.toggle('show');
  document.getElementById('main__info').classList.toggle('hide');
}

function gameEvent(event) {
  switch (event) {
    case 'start': startGame(0);
      break;
    case 'restart': startGame(levelNum);
      break;
    case 'next': startGame(++levelNum);
      break;
    default:
      startGame(0);
  }
}

function selectEvent(event) {
  switch (event.target) {
    case document.getElementById('settings'):
      showSettings();
      break;
    case document.getElementById('return'):
      controls.states.F9 = true;
      break;
    case document.getElementById('main-menu'):
      showWindow(document.getElementById('pause_window'));
      showMenu();
      break;
    default: break;
  }
}

function showSettings() {
  showWindow(document.getElementById('pause_window'));
  showWindow(document.getElementById('settings_window'));
  showSelected('resolution');
  unlockPointer();
}

function showSelected(id) {
  const { children: elements } = document.getElementById(id);

  _.forEach(elements, element => ((+element.id.match(/\d+/) === camera.resolution && !element.classList.contains('selected-item'))
    || (+element.id.match(/\d+/) !== camera.resolution && element.classList.contains('selected-item')))
    ? element.classList.toggle('selected-item')
    : element);
}

function changeResolution(event) {
  resolution = +event.target.id.match(/\d+/);
  camera.resolution = resolution;
  camera.spacing = camera.width / resolution;
  showSelected('resolution');
}
