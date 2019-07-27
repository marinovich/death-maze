const menuButton = document.getElementsByClassName('game__button_menu');
const restartButton = document.getElementsByClassName('game__button_restart');
const nextLevelButton = document.getElementsByClassName('game__button_next');
const helpWindows = document.getElementsByClassName('help-window');

let startButton = document.getElementById('start_button');
startButton.addEventListener('click', gameEvent.bind(null, 'start'), false);

let closeButton = document.getElementById('close_button');
closeButton.addEventListener('click', showWindow.bind(null, document.getElementById('settings_window')), false);
closeButton.addEventListener('click', showWindow.bind(null, document.getElementById('pause_window')), false);
closeButton.addEventListener('click', unlockPointer, false);

menuButton.map = [].map;
restartButton.map = [].map;
helpWindows.map = [].map;
nextLevelButton.map = [].map;

restartButton.map(button => button.addEventListener('click', gameEvent.bind(null, 'restart'), false));
menuButton.map(button => button.addEventListener('click', showMenu, false));
nextLevelButton.map(button => button.addEventListener('click', gameEvent.bind(null, 'next'), false));
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
    case 'start': startGame(0); break;
    case 'restart': startGame(levelNum); break;
    case 'next': startGame(++levelNum); break;
    default: startGame(0);
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
  }
}

function showSettings(event) {
  showWindow(document.getElementById('pause_window'));
  showWindow(document.getElementById('settings_window'));
  showSelected('resolution');
  unlockPointer();
}

function showSelected(id) {
  let elements = document.getElementById(id).children;
  elements.map = [].map;
  elements.map(e => ((+e.id.match(/\d+/) === camera.resolution && !e.classList.contains('selected-item'))
    || (+e.id.match(/\d+/) !== camera.resolution && e.classList.contains('selected-item')))
    ? e.classList.toggle('selected-item')
    : e);
}

function changeResolution(event) {
  resolution = +event.target.id.match(/\d+/);
  camera.resolution = resolution;
  camera.spacing = camera.width / resolution;
  showSelected('resolution');
}
