let avoidEnemy = function avoidEnemy(target, unitType) {
	let moveAI = {};
		moveAI.down = false;
		moveAI.up = false;
		moveAI.right = false;
		moveAI.left = false;
		moveAI.target = [];

	let isAvoid = false;

	let jStart = Math.floor(player.pos[0] / cellWidth);
	let jEnd = Math.floor((player.pos[0] + player.sprite.size[0]) / cellWidth);

	let iStart = Math.floor(player.pos[1] / cellHeight);
	let iEnd = Math.floor((player.pos[1] + player.sprite.size[1]) / cellHeight);

	if (jStart < 0) { jStart = 0; }
	if (jEnd > matrixWidth - 1) { jEnd = matrixWidth -1; }

	if (iStart < 0) { iStart = 0; }
	if (iEnd > matrixHeight - 1) { iEnd = matrixHeight -1; }

	if (!!target) 
		if (target.target.length !== 0) {
			if (target.target[1] === jStart && target.target[1] + 3 === jEnd) {
				target.left = false;
				target.right = false;
			}
			if (target.target[0] === iStart && target.target[0] + 3 === iEnd) {
				target.up = false;
				target.down = false;
			}
			if (target.left || target.right || target.up || target.down)
				return target;
		}

	for (let i = iStart; i <= iEnd; i++)  {
		for (let j = jStart; j <= jEnd; j++) {
			if (matrix[i][j].freeTime !== maxFreeTime) isAvoid = true;
			if (isAvoid) break;
		}
		if (isAvoid) break;
	}

	if (isAvoid) {
		let targetCell = [];
		if (unitType !== 0) {
			for (let k = 0; k < matrixWidth - 3; k++) {
				let isBreaked = false;
				for (let i = iStart; i < iStart + 4; i++) {
					for (let j = k; j < k + 4; j++) {
						if (matrix[i][j].freeTime !== maxFreeTime) {
							isBreaked = true;
							break;
						}	
					}
					if (isBreaked) break;
				}
				if (isBreaked) continue;
				else if (targetCell.length == 0 || Math.abs(jStart - k) < Math.abs(targetCell[1] - jStart)) {
					if (iStart > 5) targetCell = [2, k];
					else targetCell = [iStart, k];
				}
			}
			if (targetCell.length != 0) {
				moveAI.down = false;
				moveAI.up = iStart > targetCell[0];
				moveAI.right = targetCell[1] > jStart;
				moveAI.left = targetCell[1] < jStart;
				moveAI.target = targetCell;
				return /*avoidEnemy(*/moveAI/*)*/;
			} 
		}

		if (unitType === 0) {
			for (let l = 2; l < matrixHeight/2 + 3; l++) {
				for (let k = 0; k < matrixWidth - 3; k++) {
					let isBreaked = false;
					for (let i = l; i < l + 4; i++) {
						for (let j = k; j < k + 4; j++) {
							if (matrix[i][j].freeTime !== maxFreeTime) {
								isBreaked = true;
								break;
							}	
						}
						if (isBreaked) break;
					}
					if (isBreaked) continue;
					else if (targetCell.length == 0 || 
							Math.pow(jStart - k, 2) + Math.pow(iStart - l, 2) <  
							Math.pow(targetCell[1] - jStart, 2) + Math.pow(targetCell[0] - iStart, 2)) {
						targetCell = [l, k];
					}
				}	
			}
			if (targetCell.length != 0) {
				moveAI.down = targetCell[0] > iStart;
				moveAI.up = targetCell[0] < iStart;
				moveAI.right = targetCell[1] > jStart;
				moveAI.left = targetCell[1] < jStart;
				moveAI.target = targetCell;
				return /*avoidEnemy(*/moveAI/*)*/;
			} 
		}
	}
	return moveAI;
}


let isCleanWay = function isCleanWay() {

}

let createPath = function createPath() {
	for(let k = 0; k < enemies.length; k++) {

		if (enemies[k].moveType == 'non-linear') {
			createPathNLinear(enemies[k]);
			continue;
		}

		let jStart = Math.floor(enemies[k].pos[0] / cellWidth);
		let jEnd = Math.floor((enemies[k].pos[0] + enemies[k].sprite.size[0]) / cellWidth);

		let iStart = Math.floor(enemies[k].pos[1] / cellHeight);
		let iEnd = Math.floor((enemies[k].pos[1] + enemies[k].sprite.size[1]) / cellHeight);

		if (jStart < 0) { jStart = 0; }
		if (jEnd > matrixWidth - 1) { jEnd = matrixWidth - 1; }
		if (iEnd > matrixHeight - 1) { iEnd = matrixHeight - 1; }
		if (iStart < 0) { iStart = 0; }

		if (jStart >= 0 && jEnd < matrixWidth)
			for(let j = jStart; j <= jEnd ; j++) {
				for(let i = iStart; i >= -1 ; i--) {
					if (i == iStart) {
						if (i >= 0 && i < matrixHeight-1) { 
							if (!matrix[i][j]) console.log(i,j);
							matrix[i][j].freeTime = 0;
							matrix[i+1][j].freeTime = 0;
						}
					}
					else if (i >= 0) { 
						if (matrix[i][j].freeTime == 0) break;
						let dPos = enemies[k].pos[1] - matrix[i][j].endPos[1];
						matrix[i][j].freeTime = Math.round(dPos / enemies[k].speed * 1000); 
					}
				}
				for(let i = iEnd + 1; i < matrixHeight; i++) {
					if (iStart == -1) matrix[i-1][j].freeTime = maxFreeTime;
					if (matrix[i][j].freeTime == 0) matrix[i][j].freeTime = maxFreeTime;
				}
			}	
	}
}

let createPathNLinear = function createPathNLinear(enemy, isDelete) {

	let jStart = Math.floor(enemy.pos[0] / cellWidth);
	let jEnd = Math.floor((enemy.pos[0] + enemy.sprite.size[0]) / cellWidth);

	let iStart = Math.floor(enemy.pos[1] / cellHeight);
	let iEnd = Math.floor((enemy.pos[1] + enemy.sprite.size[1]) / cellHeight);

	if (jStart < 0) { jStart = 0; }
	if (jEnd > matrixWidth - 1) { jEnd = matrixWidth - 1; }
	if (iEnd > matrixHeight - 1) { iEnd = matrixHeight - 1; }
	if (iStart < 0) { iStart = 0; }

   	for (let y = -enemy.sprite.size[1]; y < enemy.pos[1] + enemy.sprite.size[1]; y += 5) {
   		let x = 0;

   		let iPosStart = Math.floor(y / cellHeight);
   		let iPosEnd = Math.floor((y + enemy.sprite.size[1]) / cellHeight);

   		if (enemy.startPos[0] >= canvas.width / 2)
   			x = enemy.startPos[0] - (canvas.width - enemy.startPos[0] - 40) * 
       			(Math.sin((enemy.startPos[1] - y) / 50)); 
       	else
       		x = enemy.startPos[0] - enemy.startPos[0] * 
       			(Math.sin((enemy.startPos[1] - y) / 50)); 

       	let jPosStart = Math.floor(x / cellWidth);
       	let jPosEnd = Math.floor((x + enemy.sprite.size[1]) / cellWidth);

       	if (jPosStart < 0) { jPosStart = 0; }
		if (jPosEnd > matrixWidth - 1) { jPosEnd = matrixWidth - 1; }
		if (iPosEnd > matrixHeight - 1) { iPosEnd = matrixHeight - 1; }
		if (iPosStart < 0) { iPosStart = 0; }

       	let newFreeTime = Math.floor((enemy.pos[1] + 40 - y) / enemy.speed * 1000);  
       	if (!!isDelete || newFreeTime < 0)
       		newFreeTime = maxFreeTime;

       	for (let i = iPosStart; i <= iPosEnd; i++)
       		for (let j = jPosStart; j <= jPosEnd; j++)
       			matrix[i][j].freeTime = newFreeTime;
   	}

	for(let j = jStart; j <= jEnd ; j++) 
		for(let i = iStart; i <= iEnd ; i++) 
				matrix[i][j].freeTime = 0;
}

let findPosition = function findPosition() {
	for (let j = 0; j < matrixWidth; j++)
		for (let i = matrixHeight - 1; i >= 0; i--) 
		 {
			if (((matrix[i][j].startPos[1] <= player.pos[1] && player.pos[1] <= matrix[i][j].endPos[1]) &&
				(matrix[i][j].startPos[0] <= player.pos[0] && player.pos[0] <= matrix[i][j].endPos[0])) ||
				((matrix[i][j].startPos[1] <= player.pos[1] + player.sprite.size[1]  && player.pos[1] <= matrix[i][j].endPos[1]) &&
				(matrix[i][j].startPos[0] <= player.pos[0] + player.sprite.size[0] && player.pos[0] <= matrix[i][j].endPos[0]))){
				matrix[i][j].textStyle = "red";
			}
			else matrix[i][j].textStyle = "#a0a0a0";	
		}

}