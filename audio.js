/**
 * Процедурный аудио-движок на Web Audio API
 * Работает полностью автономно без внешних MP3-файлов!
 * Включает: микрофонный детектор дуновения, генератор звуковых эффектов (SFX),
 * милый синтезатор музыкальной шкатулки (BGM) и виброотклик (Haptic Feedback).
 */
class BirthdayAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.micStream = null;
    this.analyser = null;
    this.isListening = false;
    this.bgmAudio = null;
    this.bgmPlaying = false;
    this.bgmInterval = null;
    this.bgmStep = 0;
  }

  // Инициализация AudioContext и фонового плеера по первому клику/тапу (требование браузеров)
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.bgmAudio) {
      this.bgmAudio = document.getElementById('bgm-audio');
      if (!this.bgmAudio) {
        this.bgmAudio = new Audio('assets/happy_birthday_music_box.mp3');
        this.bgmAudio.id = 'bgm-audio';
        this.bgmAudio.loop = true;
      }
      this.bgmAudio.volume = 0.4;
    }
  }

  // Тактильная отдача для мобильных устройств
  vibrate(pattern = [30]) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Игнорируем в браузерах без поддержки
      }
    }
  }

  // 1. Звук хлопка/тапа (подарок, свайп, кнопки)
  playPop() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    this.vibrate([25]);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // 2. Звук колокольчиков / волшебства (открытие подарка, переходы)
  playChime() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    this.vibrate([40, 30, 40]);
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
      }, i * 65);
    });
  }

  // 3. Звук задувания свечи (легкий шум ветра + затухание)
  playExtinguish() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    this.vibrate([60, 40, 80]);
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();
    whiteNoise.stop(this.ctx.currentTime + 0.4);
  }

  // 4. Праздничная победная фанфара (Happy Birthday джингл)
  playFanfare() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    this.vibrate([80, 50, 100, 50, 150]);
    // Мелодия C4, C4, D4, C4, F4, E4
    const notes = [
      { f: 261.63, d: 0.2 },
      { f: 261.63, d: 0.2 },
      { f: 293.66, d: 0.4 },
      { f: 261.63, d: 0.4 },
      { f: 349.23, d: 0.4 },
      { f: 329.63, d: 0.7 }
    ];

    let delay = 0;
    notes.forEach((note) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(note.f, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + note.d + 0.05);
      }, delay);
      delay += note.d * 1000 + 40;
    });
  }

  // 4b. Милый звук «Мяу / Пик» при поглаживании котика
  playMeowSqueak() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    this.vibrate([30, 20, 40]);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.33);
  }

  // 4c. Желейный пружинящий звук при касании торта
  playSquish() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    this.vibrate([40]);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.22);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  // 4d. Звук поцелуйчика и волшебных колокольчиков (Обнимашки и целовашки)
  playKissChime() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    this.vibrate([60, 40, 80]);

    const now = this.ctx.currentTime;

    // Синтез звука поцелуя ("чмок")
    const kissOsc = this.ctx.createOscillator();
    const kissGain = this.ctx.createGain();
    const kissFilter = this.ctx.createBiquadFilter();

    kissOsc.type = 'triangle';
    kissFilter.type = 'bandpass';
    kissFilter.Q.value = 3.5;

    kissOsc.frequency.setValueAtTime(350, now);
    kissOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
    kissOsc.frequency.exponentialRampToValueAtTime(600, now + 0.12);

    kissFilter.frequency.setValueAtTime(800, now);
    kissFilter.frequency.exponentialRampToValueAtTime(2200, now + 0.08);

    kissGain.gain.setValueAtTime(0.35, now);
    kissGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    kissOsc.connect(kissFilter);
    kissFilter.connect(kissGain);
    kissGain.connect(this.ctx.destination);

    kissOsc.start(now);
    kissOsc.stop(now + 0.15);

    // Восходящие сияющие колокольчики счастья
    const bells = [659.25, 783.99, 1046.50, 1318.51]; // E5, G5, C6, E6
    bells.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sine';
        const t = this.ctx.currentTime;
        bOsc.frequency.setValueAtTime(freq, t);

        bGain.gain.setValueAtTime(0.2, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);

        bOsc.start(t);
        bOsc.stop(t + 0.55);
      }, 70 + idx * 80);
    });
  }

  // 5. Детектор дуновения в микрофон для задувания свечей
  async startMicBlowDetector(onBlowCallback) {
    if (this.isListening) return;

    try {
      this.initContext();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      this.micStream = stream;

      const source = this.ctx.createMediaStreamSource(stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;

      // Полосовой фильтр для частот дуновения (80 - 450 Гц)
      const biquad = this.ctx.createBiquadFilter();
      biquad.type = 'bandpass';
      biquad.frequency.value = 220;
      biquad.Q.value = 1.0;

      source.connect(biquad);
      biquad.connect(this.analyser);

      this.isListening = true;
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      let blowCount = 0;

      const checkBlow = () => {
        if (!this.isListening) return;

        this.analyser.getByteFrequencyData(dataArray);

        // Считаем энергию низких частот
        let sum = 0;
        const lowBins = Math.min(25, dataArray.length);
        for (let i = 2; i < lowBins; i++) {
          sum += dataArray[i];
        }
        const avg = sum / (lowBins - 2);

        // Порог дуновения
        if (avg > 48) {
          blowCount++;
          if (blowCount >= 3) {
            onBlowCallback();
            blowCount = 0;
          }
        } else {
          blowCount = Math.max(0, blowCount - 1);
        }

        requestAnimationFrame(checkBlow);
      };

      checkBlow();
      return true;
    } catch (err) {
      console.warn("Микрофон недоступен или отклонен (будет доступен ручной тап):", err);
      return false;
    }
  }

  // Остановка микрофона
  stopMic() {
    this.isListening = false;
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
  }

  // 6. Нежная праздничная фоновая мелодия (Happy Birthday Music Box)
  startBgm() {
    if (this.isMuted) return;
    this.initContext();
    this.bgmPlaying = true;

    if (this.bgmAudio) {
      this.bgmAudio.volume = 0.4;
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Фоновое аудио ожидает жеста пользователя:", err);
          // Фолбэк на синтезатор, если аудиофайлу что-то помешало
          this.startFallbackProceduralBgm();
        });
      }
    } else {
      this.startFallbackProceduralBgm();
    }
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.isMuted;
  }

  // Резервный синтезатор на случай блокировки загрузки mp3 файла
  startFallbackProceduralBgm() {
    if (this.bgmInterval || !this.ctx) return;
    // Ноты Happy Birthday to You:
    const melody = [
      261.63, 261.63, 293.66, 261.63, 349.23, 329.63,
      261.63, 261.63, 293.66, 261.63, 392.00, 349.23,
      261.63, 261.63, 523.25, 440.00, 349.23, 329.63, 293.66,
      466.16, 466.16, 440.00, 349.23, 392.00, 349.23
    ];
    this.bgmInterval = setInterval(() => {
      if (!this.bgmPlaying || this.isMuted || !this.ctx) return;
      const freq = melody[this.bgmStep % melody.length];
      this.bgmStep++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.48);
    }, 440);
  }
}

window.birthdayAudio = new BirthdayAudioEngine();
