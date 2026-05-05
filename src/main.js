console.log("MAIN LOADED");

const config = {
    parent: "phaser-game",
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#000000",

    input: {
        keyboard: {
            capture: [
                Phaser.Input.Keyboard.KeyCodes.SPACE,
                Phaser.Input.Keyboard.KeyCodes.UP,
                Phaser.Input.Keyboard.KeyCodes.DOWN,
                Phaser.Input.Keyboard.KeyCodes.LEFT,
                Phaser.Input.Keyboard.KeyCodes.RIGHT
            ]
        }
    },

    scene: [TitleScene, MovementScene]
};

new Phaser.Game(config);