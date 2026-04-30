class TitleScene extends Phaser.Scene {
    constructor() {
        super("titleScene");
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("player", "monkey_round.png");
        this.load.image("question", "question.png");
        this.load.image("exclamation", "exclamation.png");
        this.load.image("banana", "banana.png");
    }

    create() {
        this.add.text(400, 120, "I Have Nothing but Questions", {
            fontSize: "36px",
            color: "#ffffff",
            align: "center"
        }).setOrigin(0.5);

        this.add.text(400, 175, "A monkey fighting too many problems", {
            fontSize: "20px",
            color: "#cccccc",
            align: "center"
        }).setOrigin(0.5);

        this.player = this.add.sprite(400, 285, "player");
        this.player.setScale(0.35);

        this.question = this.add.sprite(260, 275, "question");
        this.question.setScale(0.25);

        this.exclamation = this.add.sprite(540, 275, "exclamation");
        this.exclamation.setScale(0.25);

        let highScore = localStorage.getItem("questionGameHighScore");
        if (highScore === null) {
            highScore = 0;
        }

        this.add.text(400, 370, "High Score: " + highScore, {
            fontSize: "22px",
            color: "#ffffff",
            align: "center"
        }).setOrigin(0.5);

        this.add.text(400, 450, "A / D or Arrow Keys: Move\nSPACE: Throw bananas\nPress SPACE to Start", {
            fontSize: "22px",
            color: "#ffffff",
            align: "center"
        }).setOrigin(0.5);

        this.spaceKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
    }

    update(time, delta) {
        this.question.y = 275 + Math.sin(time * 0.004) * 25;
        this.exclamation.y = 275 + Math.cos(time * 0.004) * 25;
        this.player.angle = Math.sin(time * 0.003) * 5;

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.start("movementScene");
        }
    }
}

window.TitleScene = TitleScene;