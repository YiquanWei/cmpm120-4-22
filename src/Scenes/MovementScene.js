class MovementScene extends Phaser.Scene {
    constructor() {
        super("movementScene");
    }

    preload() {
        this.load.setPath("./assets/");

        this.load.image("player", "monkey_round.png");
        this.load.image("playerIcon", "monkey_square.png");

        this.load.image("banana", "banana.png");
        this.load.image("question", "question.png");
        this.load.image("exclamation", "exclamation.png");

        this.load.image("heart", "hud_heart.png");
        this.load.image("heartEmpty", "hud_heart_empty.png");
    }

    create() {
        this.keyA = this.input.keyboard.addKey("A");
        this.keyD = this.input.keyboard.addKey("D");
        this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyR = this.input.keyboard.addKey("R");
        this.keyT = this.input.keyboard.addKey("T");

        this.init_game();
    }

    init_game() {
        this.clearOldObjects();

        this.score = 0;
        this.health = 3;
        this.maxHealth = 3;
        this.level = 1;

        this.gameOver = false;
        this.gameWon = false;

        this.enemySpawnTimer = 0;
        this.enemySpawned = 0;
        this.enemySpawnLimit = 0;

        this.bossSpawned = false;
        this.levelMessageTimer = 1200;

        this.playerBullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.hearts = [];
        this.stars = [];
        this.heartIcons = [];

        this.createStarfield();

        this.player = this.add.sprite(400, 485, "player");
        this.player.setScale(0.3);

        this.createUI();

        this.messageText = this.add.text(400, 280, "Level 1\nQuestions are falling.", {
            fontSize: "34px",
            color: "#ffffff",
            align: "center"
        }).setOrigin(0.5);

        this.startLevel(1);
    }

    clearOldObjects() {
        if (this.player) {
            this.player.destroy();
        }

        let arrays = [
            this.playerBullets,
            this.enemyBullets,
            this.enemies,
            this.hearts,
            this.stars,
            this.heartIcons
        ];

        for (let arr of arrays) {
            if (arr) {
                for (let obj of arr) {
                    if (obj) {
                        obj.destroy();
                    }
                }
            }
        }

        let objects = [
            this.playerIcon,
            this.scoreText,
            this.levelText,
            this.messageText,
            this.gameOverText
        ];

        for (let obj of objects) {
            if (obj) {
                obj.destroy();
            }
        }
    }

    createStarfield() {
        for (let i = 0; i < 65; i++) {
            let x = Phaser.Math.Between(0, 800);
            let y = Phaser.Math.Between(0, 600);
            let size = Phaser.Math.Between(1, 3);

            let star = this.add.rectangle(x, y, size, size, 0xffffff);
            star.speed = Phaser.Math.Between(25, 90);
            this.stars.push(star);
        }
    }

    createUI() {
        // left bottom monkey avatar
        this.playerIcon = this.add.sprite(65, 545, "playerIcon");
        this.playerIcon.setScale(0.28);

        // hearts beside avatar
        for (let i = 0; i < this.maxHealth; i++) {
            let heart = this.add.sprite(140 + i * 42, 545, "heart");
            heart.setScale(0.92);
            this.heartIcons.push(heart);
        }

        // score
        this.scoreText = this.add.text(760, 540, "Score: 0", {
            fontSize: "30px",
            color: "#ffffff"
        });
        this.scoreText.setOrigin(1, 0.5);

        // level top center
        this.levelText = this.add.text(400, 28, "Wave 1", {
            fontSize: "26px",
            color: "#ffffff"
        });
        this.levelText.setOrigin(0.5);
    }

    startLevel(levelNumber) {
        this.level = levelNumber;
        this.enemySpawned = 0;
        this.enemySpawnTimer = 0;
        this.bossSpawned = false;
        this.levelMessageTimer = 1200;

        if (levelNumber === 1) {
            this.enemySpawnLimit = 8;
            this.setMessage("Wave 1\nSmall questions.");
        } else if (levelNumber === 2) {
            this.enemySpawnLimit = 12;
            this.setMessage("Wave 2\nExclamation marks join.");
        } else if (levelNumber === 3) {
            this.enemySpawnLimit = 20;
            this.setMessage("Wave 3\nToo many problems.");
        } else if (levelNumber === 4) {
            this.enemySpawnLimit = 0;
            this.setMessage("Final Wave\nThe giant question appears.");
        }

        this.updateUI();
    }

    setMessage(text) {
        if (this.messageText) {
            this.messageText.destroy();
        }

        this.messageText = this.add.text(400, 280, text, {
            fontSize: "34px",
            color: "#ffffff",
            align: "center"
        });
        this.messageText.setOrigin(0.5);
    }

    update(time, delta) {
        let dt = delta / 1000;

        this.updateStarfield(dt);

        if (this.gameOver || this.gameWon) {
            if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
                this.init_game();
            }

            if (Phaser.Input.Keyboard.JustDown(this.keyT)) {
                this.scene.start("titleScene");
            }

            return;
        }

        if (this.levelMessageTimer > 0) {
            this.levelMessageTimer -= delta;

            if (this.levelMessageTimer <= 0 && this.messageText) {
                this.messageText.destroy();
                this.messageText = null;
            }
        }

        this.movePlayer(dt);
        this.handlePlayerShooting();
        this.updatePlayerBullets(dt);

        this.spawnEnemies(delta);
        this.updateEnemies(dt, time);
        this.updateEnemyBullets(dt);
        this.updateHearts(dt);

        this.checkCollisions();
        this.checkLevelClear();
        this.updateUI();
    }

    updateStarfield(dt) {
        for (let star of this.stars) {
            star.y += star.speed * dt;

            if (star.y > 600) {
                star.y = 0;
                star.x = Phaser.Math.Between(0, 800);
            }
        }
    }

    movePlayer(dt) {
        let speed = 330;

        if (this.keyA.isDown || this.keyLeft.isDown) {
            this.player.x -= speed * dt;
        }

        if (this.keyD.isDown || this.keyRight.isDown) {
            this.player.x += speed * dt;
        }

        this.player.x = Phaser.Math.Clamp(this.player.x, 35, 765);
    }

    handlePlayerShooting() {
        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            let bullet = this.add.sprite(this.player.x, this.player.y - 35, "banana");
            bullet.setScale(0.015);
            bullet.speed = 500;
            bullet.damage = 1;

            this.playerBullets.push(bullet);
        }
    }

    updatePlayerBullets(dt) {
        for (let bullet of this.playerBullets) {
            bullet.y -= bullet.speed * dt;
            bullet.angle += 360 * dt;
        }

        this.playerBullets = this.playerBullets.filter(bullet => {
            if (bullet.y < -40 || bullet.dead) {
                bullet.destroy();
                return false;
            }

            return true;
        });
    }

    spawnEnemies(delta) {
        if (this.levelMessageTimer > 0) {
            return;
        }

        this.enemySpawnTimer += delta;

        if (this.level === 1) {
            if (this.enemySpawnTimer > 850 && this.enemySpawned < this.enemySpawnLimit) {
                this.enemySpawnTimer = 0;
                this.enemySpawned++;
                this.createQuestionEnemy();
            }
        }

        if (this.level === 2) {
            if (this.enemySpawnTimer > 750 && this.enemySpawned < this.enemySpawnLimit) {
                this.enemySpawnTimer = 0;
                this.enemySpawned++;

                if (Phaser.Math.Between(0, 2) === 0) {
                    this.createExclamationEnemy();
                } else {
                    this.createQuestionEnemy();
                }

                if (Phaser.Math.Between(1, 5) === 1 && this.health < this.maxHealth) {
                    this.createHeartPickup();
                }
            }
        }

        if (this.level === 3) {
            if (this.enemySpawnTimer > 480 && this.enemySpawned < this.enemySpawnLimit) {
                this.enemySpawnTimer = 0;
                this.enemySpawned++;

                if (Phaser.Math.Between(1, 4) <= 3) {
                    this.createExclamationEnemy();
                } else {
                    this.createQuestionEnemy();
                }

                if (Phaser.Math.Between(1, 3) === 1 && this.enemySpawned < this.enemySpawnLimit) {
                    this.enemySpawned++;

                    if (Phaser.Math.Between(1, 4) <= 3) {
                        this.createExclamationEnemy();
                    } else {
                        this.createQuestionEnemy();
                    }
                }

                if (Phaser.Math.Between(1, 8) === 1 && this.health < this.maxHealth) {
                    this.createHeartPickup();
                }
            }
        }

        if (this.level === 4) {
            if (!this.bossSpawned) {
                this.bossSpawned = true;
                this.createBossEnemy();
            }

            if (this.enemySpawnTimer > 900) {
                this.enemySpawnTimer = 0;

                if (Phaser.Math.Between(1, 4) <= 3) {
                    this.createExclamationEnemy();
                } else {
                    this.createQuestionEnemy();
                }
            }
        } 
    }

    createQuestionEnemy() {
        let x = Phaser.Math.Between(60, 740);

        let enemy = this.add.sprite(x, -60, "question");
        enemy.setScale(0.5);

        enemy.type = "question";
        enemy.moveType = "question";
        enemy.speed = Phaser.Math.Between(75, 125);
        enemy.waveOffset = Phaser.Math.FloatBetween(0, 6.28);
        enemy.health = 1;
        enemy.points = 10;
        enemy.shootTimer = Phaser.Math.Between(1800, 2800);

        this.enemies.push(enemy);
    }

    createExclamationEnemy() {
        let x = Phaser.Math.Between(80, 720);

        let enemy = this.add.sprite(x, -70, "exclamation");
        enemy.setScale(0.5);

        enemy.type = "exclamation";
        enemy.moveType = "diagonal";
        enemy.speedY = Phaser.Math.Between(320, 400);
        enemy.speedX = Phaser.Math.Between(70, 120);

        if (x > 400) {
            enemy.speedX *= -1;
        }

        enemy.health = 1;
        enemy.points = 20;

        this.enemies.push(enemy);
    }

    createBossEnemy() {
        let enemy = this.add.sprite(400, -90, "question");
        enemy.setScale(0.95);
        enemy.setTint(0xaa66ff);

        enemy.type = "boss";
        enemy.moveType = "boss";
        enemy.phase = 1;

        enemy.health = 24;
        enemy.maxHealth = 24;
        enemy.points = 150;

        enemy.baseX = 400;
        enemy.targetY = 120;
        enemy.shootTimer = 1000;

        this.enemies.push(enemy);
    }

    updateEnemies(dt, time) {
        for (let enemy of this.enemies) {
            if (enemy.moveType === "question") {
                enemy.y += enemy.speed * dt;
            }

            if (enemy.moveType === "diagonal") {
                enemy.y += enemy.speedY * dt;
                enemy.x += enemy.speedX * dt;
            }

            if (enemy.moveType === "boss") {
                if (enemy.y < enemy.targetY) {
                    enemy.y += 35 * dt;
                }

                if (enemy.health <= enemy.maxHealth / 2 && enemy.phase === 1) {
                    enemy.phase = 2;
                    enemy.setTint(0xffff00);
                    enemy.shootTimer = 500;
                }

                if (enemy.phase === 1) {
                    enemy.x = enemy.baseX + Math.sin(time * 0.002) * 120;

                    enemy.shootTimer -= dt * 1000;

                    if (enemy.shootTimer <= 0) {
                        enemy.shootTimer = 1200;
                        this.createQuestionRing(enemy.x, enemy.y, 7, 180);
                    }
                }

                if (enemy.phase === 2) {
                    enemy.x = enemy.baseX + Math.sin(time * 0.005) * 230;

                    enemy.shootTimer -= dt * 1000;

                    if (enemy.shootTimer <= 0) {
                        enemy.shootTimer = 450;

                        this.createExclamationBullet(enemy.x, enemy.y + 60, 360);

                        if (Phaser.Math.Between(1, 2) === 1) {
                            this.createExclamationBullet(enemy.x - 45, enemy.y + 60, 400);
                            this.createExclamationBullet(enemy.x + 45, enemy.y + 60, 400);
                        }
                    }
                }
            }
        }

        this.enemies = this.enemies.filter(enemy => {
            if (enemy.dead || enemy.y > 660 || enemy.x < -120 || enemy.x > 920) {
                enemy.destroy();
                return false;
            }

            return true;
        });
    }

    createEnemyBullet(x, y, vx, vy) {
        let bullet = this.add.sprite(x, y, "question");
        bullet.setScale(0.38);
        bullet.setTint(0xff0000);

        bullet.vx = vx;
        bullet.vy = vy;

        this.enemyBullets.push(bullet);
    }

    createExclamationBullet(x, y, speed) {
        let bullet = this.add.sprite(x, y, "exclamation");
        bullet.setScale(0.45);
        bullet.setTint(0xff3333);

        bullet.vx = 0;
        bullet.vy = speed;

        this.enemyBullets.push(bullet);
    }

    createQuestionRing(x, y, count, speed) {
        for (let i = 0; i < count; i++) {
            let angle = (Math.PI * 2 / count) * i;

            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;

            this.createEnemyBullet(x, y, vx, vy);
        }
    }

    updateEnemyBullets(dt) {
        for (let bullet of this.enemyBullets) {
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
        }

        this.enemyBullets = this.enemyBullets.filter(bullet => {
            if (
                bullet.dead ||
                bullet.y > 650 ||
                bullet.y < -80 ||
                bullet.x < -80 ||
                bullet.x > 880
            ) {
                bullet.destroy();
                return false;
            }

            return true;
        });
    }

    createHeartPickup() {
        let startX = Phaser.Math.Between(80, 720);

        let path = new Phaser.Curves.Spline([
            startX, -40,
            startX - 80, 120,
            startX + 90, 260,
            startX - 60, 420,
            startX + 40, 650
        ]);

        let heart = this.add.follower(path, startX, -40, "heart");
        heart.setScale(0.95);
        heart.speed = 1;
        heart.dead = false;

        heart.startFollow({
            from: 0,
            to: 1,
            delay: 0,
            duration: 5200,
            ease: "Sine.easeInOut",
            repeat: 0,
            yoyo: false,
            rotateToPath: false
        });

        heart.lifeTimer = 5400;

        this.hearts.push(heart);
    }

    updateHearts(dt) {
        for (let heart of this.hearts) {
            heart.lifeTimer -= dt * 1000;

            if (heart.lifeTimer <= 0) {
                heart.dead = true;
            }
        }

        this.hearts = this.hearts.filter(heart => {
            if (heart.dead || heart.y > 660) {
                heart.destroy();
                return false;
            }

            return true;
        });
    }

    checkCollisions() {
        for (let bullet of this.playerBullets) {
            for (let enemy of this.enemies) {
                if (!bullet.dead && !enemy.dead && this.isColliding(bullet, enemy)) {
                    bullet.dead = true;
                    enemy.health -= bullet.damage;

                    if (enemy.health <= 0) {
                        enemy.dead = true;
                        this.score += enemy.points;
                    }
                }
            }
        }

        for (let enemy of this.enemies) {
            if (!enemy.dead && this.isColliding(this.player, enemy)) {
                this.takeDamage();

                if (enemy.type !== "boss") {
                    enemy.dead = true;
                }
            }
        }

        for (let bullet of this.enemyBullets) {
            if (!bullet.dead && this.isColliding(this.player, bullet)) {
                bullet.dead = true;
                this.takeDamage();
            }
        }

        for (let heart of this.hearts) {
            if (!heart.dead && this.isColliding(this.player, heart)) {
                heart.dead = true;

                if (this.health < this.maxHealth) {
                    this.health += 1;
                }
            }
        }
    }

    isColliding(a, b) {
        return Phaser.Geom.Intersects.RectangleToRectangle(
            a.getBounds(),
            b.getBounds()
        );
    }

    takeDamage() {
        if (this.gameOver || this.gameWon) {
            return;
        }

        this.health -= 1;

        this.player.setTint(0xff0000);

        this.time.delayedCall(120, () => {
            if (this.player) {
                this.player.clearTint();
            }
        });

        if (this.health <= 0) {
            this.endGame(false);
        }
    }

    checkLevelClear() {
        if (this.level === 1 || this.level === 2 || this.level === 3) {
            if (this.enemySpawned >= this.enemySpawnLimit && this.enemies.length === 0) {
                this.score += 50;
                this.startLevel(this.level + 1);
            }
        }

        if (this.level === 4) {
            let bossAlive = false;

            for (let enemy of this.enemies) {
                if (enemy.type === "boss") {
                    bossAlive = true;
                }
            }

            if (this.bossSpawned && !bossAlive) {
                this.endGame(true);
            }
        }
    }

    updateUI() {
        this.scoreText.setText("Score: " + this.score);
        this.levelText.setText("Wave " + this.level);

        for (let i = 0; i < this.heartIcons.length; i++) {
            if (i < this.health) {
                this.heartIcons[i].setTexture("heart");
            } else {
                this.heartIcons[i].setTexture("heartEmpty");
            }
        }
    }

    endGame(won) {
        if (this.gameOver || this.gameWon) {
            return;
        }
        
        if (won) {
            this.gameWon = true;
        } else {
            this.gameOver = true;
        }

        let oldHighScore = localStorage.getItem("questionGameHighScore");

        if (oldHighScore === null) {
            oldHighScore = 0;
        } else {
            oldHighScore = Number(oldHighScore);
        }

        if (this.score > oldHighScore) {
            localStorage.setItem("questionGameHighScore", this.score);
        }

        let message;

        if (won) {
            message = "YOU SURVIVED THE QUESTIONS";
        } else {
            message = "GAME OVER";
        }

        this.gameOverText = this.add.text(
            400,
            285,
            message +
            "\nScore: " + this.score +
            "\nPress R to Restart\nPress T for Title",
            {
                fontSize: "32px",
                color: "#ffffff",
                align: "center"
            }
        );

        this.gameOverText.setOrigin(0.5);
    }
}

window.MovementScene = MovementScene;