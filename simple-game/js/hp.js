const hp = document.getElementById("hp");
let hpCtx = hp.getContext("2d");

// hp bar
// Black stroke
	hpCtx.beginPath();
	hpCtx.lineWidth = "4";
	hpCtx.strokeStyle = "#0f0f0f";
	hpCtx.rect(0, 0, hp.width, hp.height);  
	hpCtx.stroke();

let updateHP = function updateHP(allHP) {
	let hpPercent = allHP/initPlayerHP*100 || 100;
	
	if (hpPercent > 100) {
		hpPercent = 100;
	}
	
	if (hpPercent < 100 && hpPercent > 0) {

		// Red rectangle
	    hpCtx.beginPath();    
	    hpCtx.lineWidth = "4";
	    hpCtx.fillStyle = "red";
	    hpCtx.fillRect(hp.width * hpPercent / 100, 2, hp.width - hp.width * hpPercent / 100 - 2, hp.height - 2);

	    // Green rectangle
	    hpCtx.beginPath();
		hpCtx.lineWidth = "4";
		hpCtx.fillStyle = "green";
		hpCtx.fillRect(2, 2, hp.width * hpPercent / 100 - 2, hp.height - 2);
	}

	if (hpPercent === 100 || hpPercent === 0) {
	    // Green rectangle
	    hpCtx.beginPath();
		hpCtx.lineWidth = "4";
		if (hpPercent === 100)
			hpCtx.fillStyle = "green";
		else
			hpCtx.fillStyle = "red";
		hpCtx.fillRect(2, 2, hp.width - 4, hp.height - 2);
	}
}