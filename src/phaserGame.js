import Phaser from 'phaser';
import React, { useRef, useState, useEffect } from 'react';
import ballImage from './assets/image/ball.png';
import backgroundImage from './assets/image/background.jpg';
import tickSound from './assets/js/audio/tick.mp3';

const PhaserGame = ({ sessionId, counter, onGameEnd }) => {
  const gameRef = useRef(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [audioContextResumed, setAudioContextResumed] = useState(false);
  const [gameEndTime, setGameEndTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [pauseTime, setPauseTime] = useState(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setPauseTime(new Date());
      } else {
        if (pauseTime) {
          const now = new Date();
          const pauseDuration = Math.floor((now - pauseTime) / 1000);
          const scene = gameRef.current.scene.getScene('mainScene');
          scene.counter -= pauseDuration;
          setPauseTime(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseTime]);

  useEffect(() => {
    if (gameEndTime && sessionActive) {
      handleGameEnd();
    }
  }, [gameEndTime, sessionActive]);

  const handleGameEnd = () => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('mainScene');
      if (scene) {
        scene.tickSound.stop();
        scene.ball.setVelocity(0, 0);
        scene.gameOverText.setText('Game Over');
      }
    }

    setGameEndTime(new Date());
    onGameEnd(sessionId, new Date());
    setSessionActive(false);

    document.getElementById('restart-button').style.display = 'block';
  };

  const startGame = () => {
    if (!audioContextResumed) {
      if (Phaser.Sound.Context) {
        Phaser.Sound.Context.resume().then(() => {
          setAudioContextResumed(true);
        }).catch(error => {
          console.error("Error resuming audio context:", error);
        });
      }
    }

    if (!gameRef.current) {
      const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
          },
        },
        scene: {
          key: 'mainScene',
          preload,
          create,
          update,
        },
        parent: 'phaser-container'
      };

      gameRef.current = new Phaser.Game(config);

      function preload() {
        this.load.image('ball', ballImage);
        this.load.image('background', backgroundImage);
        this.load.audio('tick', tickSound);
      }

      function create() {
        this.add.image(400, 300, 'background');
        this.ball = this.physics.add.image(400, 300, 'ball')
          .setVelocity(400, 500)
          .setBounce(1, 1)
          .setCollideWorldBounds(true)
          .setScale(0.1);

        this.tickSound = this.sound.add('tick');

        this.counter = counter;

        this.time.addEvent({
          delay: 1000,
          callback: () => {
            if (this.counter > 0) {
              this.tickSound.play();
              this.counter--;
              this.counterText.setText(`Counter: ${this.counter}`);
            } else {
              this.tickSound.stop();
              if (this.ball) {
                this.ball.setVelocity(0, 0);
              }
              this.gameOverText.setText('Game Over');
              handleGameEnd();
            }
          },
          loop: true
        });

        this.counterText = this.add.text(16, 16, `Counter: ${this.counter}`, {
          fontSize: '32px',
          fill: '#fff'
        });

        this.gameOverText = this.add.text(400, 300, '', {
          fontSize: '64px',
          fill: '#ff0000'
        });
        this.gameOverText.setOrigin(0.5);

        document.getElementById('restart-button').style.display = 'none';

        setSessionActive(true);
        setStartTime(new Date());
      }

      function update() {
        // This is where you can add any ongoing update logic, if needed.
      }
    } else {
      const scene = gameRef.current.scene.getScene('mainScene');
      if (scene) {
        scene.ball.setPosition(400, 300);
        scene.ball.setVelocity(400, 500);
        scene.counter = counter;
        scene.counterText.setText(`Counter: ${counter}`);
        scene.gameOverText.setText('');
        setGameEndTime(null);
        setSessionActive(true);
        setStartTime(new Date());

        document.getElementById('restart-button').style.display = 'none';
      }
    }
  };

  return (
    <>
      <div>
        <button onClick={startGame} disabled={sessionActive}>Start Session</button>
      </div>
      <div>
        <p>Session ID: {sessionId}</p>
        <p>Start Time: {startTime ? startTime.toLocaleTimeString() : 'Not Started'}</p>
        <p>End Time: {gameEndTime ? gameEndTime.toLocaleTimeString() : 'Not Ended'}</p>
      </div>
      <div id="phaser-container" style={{ position: 'relative', width: '800px', height: '600px' }} />
      <button id="restart-button" onClick={startGame}
        style={{
          display: 'none',
          position: 'absolute',
          top: '528px',
          left: '26%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#a4ccf2',
          color: '#fff',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Restart Game
      </button>
    </>
  );
};

export default PhaserGame;
