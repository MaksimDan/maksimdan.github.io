const circleDiameter = 20;
const radiusRotation = 200;
const acceleration = 0.008;
const rainbowColors = [0xFF0000, 0xFFA500, 0xFFFF00, 0x008000, 0x0000FF, 0x4B0082, 0x8A2BE2];
const rainbowColorsDarker = [0x7F0000, 0x7F5200, 0x7F7f00, 0x004000, 0x00007F, 0x250041, 0x451571]

let circle;
let arc;
let nextArc;
let score;
let scoreText;
let level;
let levelText;
let currentVelocity;
let arcStartAngle, arcEndAngle;
let nextArcStartAngle, nextArcEndAngle;
let currentRotationRadians;
let currentRotationRadiansPenalty;
let lastTapTime;
let totalRevolution;
let indexRainbowColors;
let lastLog10Score;
let successfulTaps;
let centerX;
let centerY;

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: {
        preload: preload,
        create: create,
        update: update,
        key: 'tappyball'
    },
    audio: {
        disableWebAudio: false
    }
};
const game = new Phaser.Game(config);

function preload() {
    this.load.spritesheet('mind-blown', 'mind-blown-sprite.png', {frameWidth: 220, frameHeight: 146});
    this.load.audio('tap', 'tap.mp3');
}

function create() {
    circle = null;
    arc = null;
    nextArc = null;
    score = 0;
    scoreText = null;
    level = 1;
    levelText = null;
    currentVelocity = 0.07;
    arcStartAngle = undefined;
    arcEndAngle = undefined;
    nextArcStartAngle = undefined;
    nextArcEndAngle = undefined;
    currentRotationRadians = 0;
    currentRotationRadiansPenalty = 0;
    lastTapTime = Date.now();
    totalRevolution = 0;
    indexRainbowColors = 0;
    lastLog10Score = 2;
    successfulTaps = 0;
    centerX = this.cameras.main.centerX;
    centerY = this.cameras.main.centerY;

    // Create circle
    circle = this.add.circle(centerX, centerY - radiusRotation, circleDiameter, 0xffffff);
    circle.setDepth(Number.MAX_SAFE_INTEGER);

    // Create arc
    createNewArc(this);

    // Score text
    scoreText = this.add.text(16, 16, 'Score: 0', { font: '40px Helvetica', fill: '#fff' });
    levelText = this.add.text(16, 60, 'Level: 0', { font: '40px Helvetica', fill: '#fff' });

    // Input handlers for both pointer and keyboard
    this.input.on('pointerdown', () => {
        handleInput(this);
    });

    this.input.keyboard.on('keydown-SPACE', () => {
        handleInput(this);
    });
}

function handleInput(this_) {
    const currentTime = Date.now();
    const intervalInSeconds = (currentTime - lastTapTime) / 1000;
    lastTapTime = currentTime;

    if (currentVelocity === 0) {
        this_.scene.restart();
    } else if (isOverlap(circle, arcStartAngle, arcEndAngle)) {
        // Game logic for successful overlap
        successfulTaps++;
        currentRotationRadiansPenalty= 0;
        let reward = Math.ceil(25 * Math.pow(0.06, intervalInSeconds));
        score += reward;
        scoreText.setText('Score: ' + score);
        animateScoredPoint(this_, centerX, centerY, reward);
        createNewArc(this_);
        this_.sound.play('tap', {
            loop: false,
            volume: 1
        });
        if (successfulTaps % 10 === 0) {
            levelText.setText('Level: ' + ++level);
            currentVelocity += acceleration;
            indexRainbowColors++;
        }
    } else {
        // Also game logic for failure
        currentVelocity = 0;
        createSimpleTriangle(this_, centerX, centerY, .6);
    }
}


function update() {
    // Rotate circle around the center
    Phaser.Actions.RotateAroundDistance([circle], {x: centerX, y: centerY}, currentVelocity, radiusRotation);

    // Update the total rotation
    currentRotationRadians += Math.abs(currentVelocity);
    currentRotationRadiansPenalty += Math.abs(currentVelocity);

    // Check for a full rotation
    if (currentRotationRadians >= 2 * Math.PI) {
        // Reset total rotation
        currentRotationRadians = 0;
        totalRevolution++;
    }

    if (currentRotationRadiansPenalty >= 2 * Math.PI) {
        currentRotationRadiansPenalty = 0;
        animateScoredPoint(this, centerX, centerY, -1);
        score--;
        scoreText.setText('Score: ' + score);
    }

    // Calculate the current log score
    let currentLogScore = Math.floor(Math.log10(score));

    // Check if the log score has increased by 1 (indicating a multiple of 10)
    if (currentLogScore > lastLog10Score) {
        lastLog10Score = currentLogScore;
        playMindBlownGif(this);
    }
}

function animateScoredPoint(this_, x, y, value) {
    let scoredText = this_.add.text(x, y, value >= 0 ? `+${value}` : `${value}`, {
        fontSize: '40px Helvetica',
        fill: value >= 0 ? '#00ff00' : '#ff0000',
        align: 'center'
    });
    scoredText.setOrigin(0.5, 0.5);

    let waveAmplitude = 20;
    let waveFrequency = 2;

    this_.tweens.add({
        targets: scoredText,
        y: y - 80,
        alpha: 0,
        ease: 'Linear',
        duration: 1000,
        onUpdate: function (tween) {
            // This function will be called repeatedly during the tween
            const progress = tween.elapsed / tween.duration; // progress: 0 to 1
            scoredText.x = x + waveAmplitude * Math.sin(progress * 2 * Math.PI / waveFrequency);
        },
        onComplete: function () {
            scoredText.destroy();
        }
    });
}

function createNewArc(this_) {
    if (!nextArcEndAngle && !nextArcStartAngle) {
        arcStartAngle = Phaser.Math.Between(0, 360);
        arcEndAngle = arcStartAngle + Phaser.Math.Between(20, 60);
    } else {
        arcStartAngle = nextArcStartAngle;
        arcEndAngle = nextArcEndAngle;
    }

    let overlap;
    do {
        nextArcStartAngle = Phaser.Math.Between(0, 360);
        nextArcEndAngle = nextArcStartAngle + Phaser.Math.Between(20, 60);
        overlap = arcAnglesOverlap(arcStartAngle, arcEndAngle, nextArcStartAngle, nextArcEndAngle);
    } while (overlap);

    if (arc) {
        arc.destroy();
    }
    if (nextArc) {
        nextArc.destroy();
    }
    arc = drawArc(this_, arcStartAngle, arcEndAngle, 1, rainbowColors[indexRainbowColors % rainbowColors.length]);
    nextArc = drawArc(this_, nextArcStartAngle, nextArcEndAngle, 1, rainbowColorsDarker[indexRainbowColors % rainbowColors.length]);
}

function drawArc(this_, startAngle, endAngle, alpha, color) {
    let lineWidth = circleDiameter * 2;

    // Graphics for the arc
    let arcGraphics = this_.add.graphics({lineStyle: {width: lineWidth, color: color, alpha: alpha}});
    arcGraphics.beginPath();
    arcGraphics.arc(centerX, centerY, radiusRotation, Phaser.Math.DegToRad(startAngle), Phaser.Math.DegToRad(endAngle), false);
    arcGraphics.strokePath();

    // Calculate start and end points of the arc
    let startX = centerX + radiusRotation * Math.cos(Phaser.Math.DegToRad(startAngle));
    let startY = centerY + radiusRotation * Math.sin(Phaser.Math.DegToRad(startAngle));
    let endX = centerX + radiusRotation * Math.cos(Phaser.Math.DegToRad(endAngle));
    let endY = centerY + radiusRotation * Math.sin(Phaser.Math.DegToRad(endAngle));

    // Draw circles at the start and end points to create rounded corners
    arcGraphics.fillStyle(color, alpha);
    arcGraphics.fillCircle(startX, startY, lineWidth / 2);
    arcGraphics.fillCircle(endX, endY, lineWidth / 2);
    return arcGraphics;
}

function isOverlap(circle, arcStartAngle, arcEndAngle, leniency = 10) { // leniency in degrees
    // Get the angle of the circle relative to the center
    let angle = Phaser.Math.Angle.Between(centerX, centerY, circle.x, circle.y);

    // Normalize the angle to be within 0 and 2*PI
    if (angle < 0) {
        angle += 2 * Math.PI;
    }

    // Convert arc angles and leniency from degrees to radians for consistency
    let startRad = Phaser.Math.DegToRad(arcStartAngle) - Phaser.Math.DegToRad(leniency);
    let endRad = Phaser.Math.DegToRad(arcEndAngle) + Phaser.Math.DegToRad(leniency);

    // Normalize start and end angles
    startRad = (startRad + 2 * Math.PI) % (2 * Math.PI);
    endRad = (endRad + 2 * Math.PI) % (2 * Math.PI);

    // Check if the circle's angle is within the arc's range, considering wraparound
    if (startRad > endRad) { // The arc crosses the 0/360 degree point
        return angle >= startRad || angle <= endRad;
    } else {
        return angle >= startRad && angle <= endRad;
    }
}

function playMindBlownGif(this_) {
    let frameCount = 65
    this_.anims.create({
        key: 'animate',
        frames: this_.anims.generateFrameNumbers('mind-blown', {start: 0, end: frameCount - 1}),
        frameRate: 10,
        repeat: -1
    });
    let sprite = this_.add.sprite(centerX, centerY + 220, 'mind-blown').play('animate');
    // Tween to fade out the sprite
    this_.tweens.add({
        targets: sprite,
        alpha: {from: 1, to: 0}, // Fade from fully visible (1) to invisible (0)
        duration: 6000,  // Duration of the fade effect in milliseconds
        ease: 'Linear', // Type of easing; 'Linear' for a steady change
        repeat: 0,      // Number of times to repeat; 0 is no repeat
        yoyo: false     // If true, the tween will go back to its start value after completing
    });
}

function arcAnglesOverlap(start1, end1, start2, end2) {
    // Normalize angles to 0-360 range
    start1 = start1 % 360;
    end1 = (end1 % 360 + 360) % 360;
    start2 = start2 % 360;
    end2 = (end2 % 360 + 360) % 360;

    // Adjust end angles if they are less than start angles (wrap-around case)
    if (end1 < start1) end1 += 360;
    if (end2 < start2) end2 += 360;

    // Check if arc2 starts or ends inside arc1
    if ((start2 >= start1 && start2 <= end1) || (end2 >= start1 && end2 <= end1)) {
        return true;
    }

    // Check if arc1 starts or ends inside arc2
    return (start1 >= start2 && start1 <= end2) || (end1 >= start2 && end1 <= end2);
}

function createSimpleTriangle(this_, originX, originY, scale=1) {
    // Define the points of the triangle
    let p1 = { x: 200 * scale, y: 150 * scale }; // Left bottom
    let p2 = { x: 300 * scale, y: 100 * scale }; // Right tip
    let p3 = { x: 200 * scale, y: 50 * scale };  // Left top

    // Create a graphics object
    let graphics = this_.add.graphics();

    // Set line style
    graphics.lineStyle(5 * scale, 0xFFFFFF, 1);

    // Start drawing the triangle
    graphics.beginPath();
    graphics.moveTo(p1.x, p1.y);
    graphics.lineTo(p2.x, p2.y);
    graphics.lineTo(p3.x, p3.y);
    graphics.closePath();
    graphics.strokePath();

    // Fill the triangle
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillPath();

    // Positioning the triangle
    graphics.x = originX - 250 * scale;
    graphics.y = originY - 100 * scale;
}
function resizeGame() {
    var canvas = game.canvas, width = window.innerWidth, height = window.innerHeight;
    var wratio = width / height, ratio = canvas.width / canvas.height;

    if (wratio < ratio) {
        canvas.style.width = width + 'px';
        canvas.style.height = (width / ratio) + 'px';
    } else {
        canvas.style.height = height + 'px';
        canvas.style.width = (height * ratio) + 'px';
    }
}

window.addEventListener('resize', resizeGame);
