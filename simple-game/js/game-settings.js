const initGold = 100;
const initGoldMulti = 1.0;   // multiply gold by initGoldMulti per ~1/3 sec
const totalTime = 300;     // total time in seconds
const initUpgrades = [
    [50, 'bulletFrequency', 150],    // [time before upgrade, upgrade var, new upgrade data] 
    [120, 'isRockets', true],      
    [200, 'rocketFrequency', 800],
    [240, 'playerSpeed', 500],
    [280, 'rocketDamage', 50]
];
const initPlayerHP = 120;  // initial main players HP (your enemy)
