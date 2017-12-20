let menuButton = document.getElementsByClassName('game__button_menu');
let restartButton = document.getElementsByClassName('game__button_restart');
let nextLeveltButton = document.getElementsByClassName('game__button_next');
let helpWindows = document.getElementsByClassName('help-window');

let startButton = document.getElementById('start_button');
startButton.addEventListener('click', gameEvent.bind(null, 'start'), false);

let closeButton = document.getElementById('close_button');
closeButton.addEventListener('click', showWindow.bind(null, document.getElementById('settings_window')), false);
closeButton.addEventListener('click', showWindow.bind(null, document.getElementById('pause_window')), false);
closeButton.addEventListener('click', unlockPointer, false);

menuButton.map = [].map;
restartButton.map = [].map;
helpWindows.map = [].map;
nextLeveltButton.map = [].map;

restartButton.map(button => button.addEventListener('click', gameEvent.bind(null, 'restart'), false));
menuButton.map(button => button.addEventListener('click', showMenu, false));
nextLeveltButton.map(button => button.addEventListener('click', gameEvent.bind(null, 'next'), false));
document.getElementById('die_window').addEventListener('click', showWindow.bind(null, document.getElementById('die_window')));
document.getElementById('win_window').addEventListener('click', showWindow.bind(null, document.getElementById('win_window')));
document.getElementById('settings').addEventListener('click', showSettings, false);
document.getElementById('resolution').addEventListener('click', changeResolution, false);

function showMenu() {
	document.getElementById('main__game').classList.toggle('show');
	document.getElementById('display').classList.toggle('show');
	document.getElementById('main__info').classList.toggle('hide');
}

function showGame() {
	//isGameOver = false;
	if (display.classList.contains('show')) return;
	document.getElementById('main__game').classList.toggle('show');
	display.classList.toggle('show');
	document.getElementById('main__info').classList.toggle('hide');
}

function gameEvent(event) {
    switch(event) {
        case 'start': startGame(0); break
        case 'restart': startGame(levelNum); break
        case 'next': startGame(++levelNum); break
        default: startGame(0)
    } 
}

function showSettings() {
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
    camera.resolution = +event.target.id.match(/\d+/);
    camera.spacing = camera.width / camera.resolution;
    showSelected('resolution');
}