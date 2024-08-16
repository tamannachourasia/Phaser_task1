import Phaser from 'phaser';
import React, { useRef, useState, useEffect } from 'react';
import ballImage from './assets/image/ball.png';
import backgroundImage from './assets/image/background.jpg';
import tickSound from './assets/js/audio/tick.mp3';

const PhaserGame = ({ sessionId, counter, onGameEnd }) => {
  const gameRef = useRef(null);
  const [currentCounter, setCurrentCounter] = useState(counter);
  const [sessionActive, setSessionActive] = useState(false);
  const [audioContextResumed, setAudioContextResumed] = useState(false);
  const [gameEndTime, setGameEndTime] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (currentCounter <= 0) {
      gameRef.current?.scene?.tickSound?.stop();
    }

    if (currentCounter <= 0 && !gameEndTime) {
      const endTime = new Date();
      setGameEndTime(endTime);
      onGameEnd(sessionId, endTime);
      setSessionActive(false);

      setSessions(prevSessions => {
        const sessionExists = prevSessions.some(session => session.sessionId === sessionId);
        if (!sessionExists) {
          return [...prevSessions, { sessionId, startTime, endTime }];
        }
        return prevSessions;
      });

      // Show the restart button
      document.getElementById('restart-button').style.display = 'block';
    }
  }, [currentCounter, gameEndTime, onGameEnd, sessionId, startTime]);

  useEffect(() => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('mainScene');
      if (scene && scene.counterText) {
        scene.counterText.setText(`Counter: ${currentCounter}`);
      }
    }
  }, [currentCounter]);

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

        this.time.addEvent({
          delay: 1000,
          callback: onTick,
          callbackScope: this,
          loop: true
        });

        this.counterText = this.add.text(16, 16, `Counter: ${currentCounter}`, {
          fontSize: '32px',
          fill: '#fff'
        });

        this.gameOverText = this.add.text(400, 300, '', {
          fontSize: '64px',
          fill: '#ff0000'
        });
        this.gameOverText.setOrigin(0.5);

        // Hide the restart button when the game starts
        document.getElementById('restart-button').style.display = 'none';

        setSessionActive(true);
        setStartTime(new Date());
      }

      function onTick() {
        setCurrentCounter(prevCounter => {
          if (prevCounter > 0) {
            this.tickSound.play();
            return prevCounter - 1;
          } else {
            if (prevCounter === 0) {
              this.tickSound.stop();
              if (this.ball) {
                this.ball.setVelocity(0, 0);
              }
              this.gameOverText.setText('Game Over');
            }
            return 0;
          }
        });
      }

      function update() {
      }
    } else {
      const scene = gameRef.current.scene.getScene('mainScene');
      if (scene) {
        scene.ball.setPosition(400, 300);
        scene.ball.setVelocity(400, 500);
        setCurrentCounter(counter);
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
