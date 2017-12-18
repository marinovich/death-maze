let menuButton = document.getElementsByClassName('game__button_menu');
let restartButton = document.getElementsByClassName('game__button_restart');
let nextLeveltButton = document.getElementsByClassName('game__button_next');
let helpWindows = document.getElementsByClassName('help-window');
let level = 0;

let startButton = document.getElementById('start_button');
startButton.addEventListener('click', startGame.bind(null, 0), false);

menuButton.map = [].map;
restartButton.map = [].map;
helpWindows.map = [].map;
nextLeveltButton.map = [].map;

restartButton.map(button => button.addEventListener('click', startGame.bind(null, 0), false));
menuButton.map(button => button.addEventListener('click', showMenu, false));
nextLeveltButton.map(button => button.addEventListener('click', startGame.bind(null, 1), false));
document.getElementById('die_window').addEventListener('click', showWindow.bind(null, document.getElementById('die_window')));
document.getElementById('win_window').addEventListener('click', showWindow.bind(null, document.getElementById('win_window')));
//helpWindows.map(helpWindow => helpWindow.addEventListener('click', showWindow.bind(null, helpWindow), false));

//Array.prototype.map.apply(menuButton, button => button.addEventListener('click', showMenu, false));

function showMenu() {
	document.getElementById('main__game').classList.toggle('show');
	document.getElementById('display').classList.toggle('show');
	document.getElementById('main__info').classList.toggle('hide');
	//isGameOver = true;
}

function showGame() {
	isGameOver = false;
	if (display.classList.contains('show')) return;
	document.getElementById('main__game').classList.toggle('show');
	display.classList.toggle('show');
	document.getElementById('main__info').classList.toggle('hide');
}