console.log("MAIN LOADED");

const config = {
    parent: "phaser-game",
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#000000",
    scene: [TitleScene, MovementScene]
};

new Phaser.Game(config);