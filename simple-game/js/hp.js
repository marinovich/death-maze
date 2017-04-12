// health points bar

let hp = document.getElementById("hp");
let hpCtx = hp.getContext("2d");
let hpHeight = 30;
let hpWidth = 500;
let hpPersent = 10;

// Red rectangle
hpCtx.beginPath();
hpCtx.lineWidth = "2";
hpCtx.strokeStyle = "#000";
hpCtx.rect(5, 5, hpWidth, hpHeight);  
hpCtx.stroke();

// Green rectangle
hpCtx.beginPath();
hpCtx.lineWidth = "4";
hpCtx.fillStyle = "green";
hpCtx.fillRect(6, 6, hpWidth * hpPersent / 100 - 2, hpHeight - 2);


// Green rectangle
if (hpPersent < 100) {
    hpCtx.beginPath();    
    hpCtx.lineWidth = "4";
    hpCtx.fillStyle = "red";
    hpCtx.fillRect(hpWidth * hpPersent / 100 + 4, 6, hpWidth - hpWidth * hpPersent / 100, hpHeight - 2);
}