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

        this.player = this.add.sprite(400, 515, "player");
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
        this.playerIcon = this.add.sprite(45, 545, "playerIcon");
        this.playerIcon.setScale(0.28);

        // hearts beside avatar
        for (let i = 0; i < this.maxHealth; i++) {
            let heart = this.add.sprite(95 + i * 42, 545, "heart");
            heart.setScale(0.92);
            this.heartIcons.push(heart);
        }

        // score bottom right
        this.scoreText = this.add.text(760, 540, "Score: 0", {
            fontSize: "30px",
            color: "#ffffff"
        });
        this.scoreText.setOrigin(1, 0.5);

        // level top center, smaller
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
            this.enemySpawnLimit = 14;
            this.setMessage("Wave 3\nMore pressure.");
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
            if (this.enemySpawnTimer > 650 && this.enemySpawned < this.enemySpawnLimit) {
                this.enemySpawnTimer = 0;
                this.enemySpawned++;

                if (Phaser.Math.Between(0, 1) === 0) {
                    this.createQuestionEnemy();
                } else {
                    this.createExclamationEnemy();
                }

                if (Phaser.Math.Between(1, 4) === 1 && this.health < this.maxHealth) {
                    this.createHeartPickup();
                }
            }
        }

        if (this.level === 4) {
            if (!this.bossSpawned) {
                this.bossSpawned = true;
                this.createBossEnemy();
            }

            if (this.enemySpawnTimer > 1700) {
                this.enemySpawnTimer = 0;

                if (Phaser.Math.Between(0, 1) === 0) {
                    this.createQuestionEnemy();
                } else {
                    this.createExclamationEnemy();
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
        let x = Phaser.Math.Between(60, 740);

        let enemy = this.add.sprite(x, -70, "exclamation");
        enemy.setScale(0.5);

        enemy.type = "exclamation";
        enemy.moveType = "fast";
        enemy.speed = Phaser.Math.Between(170, 230);
        enemy.health = 1;
        enemy.points = 20;
        enemy.shootTimer = Phaser.Math.Between(1100, 1800);

        this.enemies.push(enemy);
    }

    createBossEnemy() {
        let enemy = this.add.sprite(400, 90, "question");
        enemy.setScale(0.8);

        enemy.type = "boss";
        enemy.moveType = "boss";
        enemy.health = 18;
        enemy.maxHealth = 18;
        enemy.points = 150;
        enemy.shootTimer = 700;
        enemy.baseX = 400;

        this.enemies.push(enemy);
    }

    updateEnemies(dt, time) {
        for (let enemy of this.enemies) {
            if (enemy.moveType === "question") {
                enemy.y += enemy.speed * dt;
                enemy.x += Math.sin(time * 0.002 + enemy.waveOffset) * 0.5;
            }

            if (enemy.moveType === "fast") {
                enemy.y += enemy.speed * dt;
            }

            if (enemy.moveType === "boss") {
                if (enemy.health > enemy.maxHealth / 2) {
                    enemy.x = enemy.baseX + Math.sin(time * 0.002) * 160;
                    enemy.y = 95 + Math.sin(time * 0.0015) * 20;
                } else {
                    enemy.x = enemy.baseX + Math.sin(time * 0.005) * 250;
                    enemy.y = 115 + Math.sin(time * 0.004) * 35;
                }
            }

            enemy.shootTimer -= dt * 1000;

            if (enemy.shootTimer <= 0) {
                if (enemy.type === "question") {
                    enemy.shootTimer = Phaser.Math.Between(2200, 3200);
                }

                if (enemy.type === "exclamation") {
                    enemy.shootTimer = Phaser.Math.Between(1200, 1900);
                    this.createEnemyBullet(enemy.x, enemy.y + 25, 210);
                }

                if (enemy.type === "boss") {
                    if (enemy.health > enemy.maxHealth / 2) {
                        enemy.shootTimer = 800;
                        this.createEnemyBullet(enemy.x, enemy.y + 45, 230);
                    } else {
                        enemy.shootTimer = 430;
                        this.createEnemyBullet(enemy.x - 35, enemy.y + 45, 270);
                        this.createEnemyBullet(enemy.x + 35, enemy.y + 45, 270);
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

    createEnemyBullet(x, y, speed) {
        let bullet = this.add.sprite(x, y, "exclamation");
        bullet.setScale(0.4);
        bullet.speed = speed;

        this.enemyBullets.push(bullet);
    }

    updateEnemyBullets(dt) {
        for (let bullet of this.enemyBullets) {
            bullet.y += bullet.speed * dt;
        }

        this.enemyBullets = this.enemyBullets.filter(bullet => {
            if (bullet.dead || bullet.y > 650) {
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