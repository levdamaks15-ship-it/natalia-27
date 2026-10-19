/**
 * Главный скрипт интерактивного приложения
 * С Днём Рождения, Наталия (27 лет)
 */

document.addEventListener('DOMContentLoaded', () => {
  const cfg = window.BIRTHDAY_CONFIG;
  if (!cfg) {
    console.error("Конфиг BIRTHDAY_CONFIG не найден!");
    return;
  }

  // Состояние приложения
  let currentStep = 1;
  let tapCount = 0;
  let activeCardIndex = 0;
  let flame2Lit = true;
  let flame7Lit = true;
  let complimentIdx = 0;

  // Элементы навигации
  const dots = document.querySelectorAll('.dot');
  const screens = {
    1: document.getElementById('screen-1'),
    2: document.getElementById('screen-2'),
    3: document.getElementById('screen-3'),
    4: document.getElementById('screen-4')
  };

  // Кнопка звука
  const btnSound = document.getElementById('btn-sound');
  btnSound.addEventListener('click', () => {
    const isMuted = window.birthdayAudio.toggleMute();
    btnSound.textContent = isMuted ? '🔇' : '🎵';
    btnSound.style.opacity = isMuted ? '0.6' : '1';
  });

  // Функция переключения шагов
  function goToStep(step) {
    if (step < 1 || step > 4) return;
    currentStep = step;

    // Обновляем точки
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx + 1 === step);
    });

    // Переключаем экраны
    Object.keys(screens).forEach(key => {
      screens[key].classList.toggle('active', parseInt(key, 10) === step);
    });

    window.birthdayAudio.playChime();

    // Особые действия при входе на шаг
    if (step === 3) {
      initStep3Mic();
    }
  }

  // =========================================================================
  // ЭКРАН 1: Подарок
  // =========================================================================
  const giftBox = document.getElementById('gift-box-btn');
  const giftImg = document.getElementById('gift-img');
  const giftHint = document.getElementById('gift-hint');
  const hearts = [
    document.getElementById('heart-1'),
    document.getElementById('heart-2'),
    document.getElementById('heart-3')
  ];

  giftBox.addEventListener('click', () => {
    // Разблокируем аудио-контекст браузера при первом тапе
    window.birthdayAudio.initContext();

    if (tapCount < cfg.screen1.tapsNeeded) {
      tapCount++;
      window.birthdayAudio.playPop();

      // Тряска коробки
      giftImg.classList.remove('tap-shake');
      void giftImg.offsetWidth; // Триггер reflow
      giftImg.classList.add('tap-shake');

      // Обновляем сердечки
      for (let i = 0; i < tapCount; i++) {
        if (hearts[i]) hearts[i].classList.add('filled');
      }

      // Текст подсказки
      if (cfg.screen1.tapHints[tapCount - 1]) {
        giftHint.textContent = cfg.screen1.tapHints[tapCount - 1];
      }

      // Если 3-й тап — взрыв подарка и выпрыгивание Китти!
      if (tapCount >= cfg.screen1.tapsNeeded) {
        giftHint.textContent = "🎉 С ДНЁМ РОЖДЕНИЯ!";
        
        // Срыв крышки и выпрыгивание котика из коробки
        giftImg.classList.add('lid-fly-off');
        const poppingKitty = document.getElementById('gift-popping-kitty');
        if (poppingKitty) {
          poppingKitty.classList.add('pop-active');
        }

        // Салют конфетти
        if (window.confetti) {
          window.confetti({
            particleCount: 140,
            spread: 85,
            origin: { y: 0.55 },
            colors: ['#ff69b4', '#ffd1dc', '#ffd700', '#ffffff', '#ff1493']
          });
        }

        window.birthdayAudio.playChime();
        window.birthdayAudio.startBgm();

        setTimeout(() => {
          goToStep(2);
        }, 1300);
      }
    }
  });

  // =========================================================================
  // ЭКРАН 2: Полароидная колода
  // =========================================================================
  const polaroidDeck = document.getElementById('polaroid-deck');
  const deckCounter = document.getElementById('deck-counter');
  const btnToCake = document.getElementById('btn-to-cake');

  function renderPolaroids() {
    polaroidDeck.innerHTML = '';
    const cards = cfg.screen2.cards;

    const s2Title = document.getElementById('s2-title');
    const s2Sub = document.getElementById('s2-subtitle');
    if (s2Title && cfg.screen2?.title) s2Title.textContent = cfg.screen2.title;
    if (s2Sub && cfg.screen2?.subtitle) s2Sub.textContent = cfg.screen2.subtitle;

    cards.forEach((card, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'polaroid-card';
      cardEl.dataset.index = idx;
      cardEl.style.zIndex = cards.length - idx;
      const stackOffset = Math.min(idx, 4) * 3;
      cardEl.style.transform = `rotate(${card.rotation}deg) translateY(${stackOffset}px)`;

      cardEl.innerHTML = `
        <div class="polaroid-img-wrapper">
          <img src="${card.image}" alt="Moment ${idx + 1}" draggable="false">
        </div>
        <div class="polaroid-caption">${card.caption}</div>
        <span class="polaroid-tag">${card.tag}</span>
      `;

      // Добавляем поддержку свайпа
      setupSwipeGesture(cardEl, idx, cards.length);
      polaroidDeck.appendChild(cardEl);
    });

    updateDeckCounter();
  }

  function updateDeckCounter() {
    const total = cfg.screen2.cards.length;
    deckCounter.textContent = `Карточка ${Math.min(activeCardIndex + 1, total)} из ${total}`;
    // Показываем кнопку перехода к торту уже после просмотра первых 2 карточек (или на последней)
    if (activeCardIndex >= 2 || activeCardIndex >= total - 1) {
      btnToCake.style.display = 'inline-flex';
    }
  }

  function setupSwipeGesture(el, index, total) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const startDrag = (x) => {
      if (index !== activeCardIndex) return;
      startX = x;
      isDragging = true;
      el.style.transition = 'none';
    };

    const moveDrag = (x) => {
      if (!isDragging) return;
      currentX = x - startX;
      // Если это крайняя карточка, даём упругое сопротивление (rubber-band)
      const damp = (index === total - 1) ? 0.35 : 1;
      const effectiveX = currentX * damp;
      const rot = effectiveX * 0.08;
      el.style.transform = `translate3d(${effectiveX}px, 0, 0) rotate(${rot}deg)`;
    };

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      el.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s';

      if (Math.abs(currentX) > 85) {
        if (index === total - 1) {
          // Крайняя 9-я карточка намертво зафиксирована — не даем экрану опустеть!
          const origRot = cfg.screen2.cards[index].rotation;
          el.style.transform = `rotate(${origRot}deg) translateY(${index * 4}px) scale(1.04)`;
          setTimeout(() => {
            el.style.transform = `rotate(${origRot}deg) translateY(${index * 4}px) scale(1)`;
          }, 220);
          window.birthdayAudio.playSquish();

          // Подсвечиваем кнопку перехода к торту, чтобы пользователь перешел дальше
          if (btnToCake) {
            btnToCake.classList.remove('pulse-highlight');
            void btnToCake.offsetWidth;
            btnToCake.classList.add('pulse-highlight');
          }
        } else {
          // Смахнули обычную карточку!
          const flyDir = currentX > 0 ? 450 : -450;
          el.style.transform = `translate3d(${flyDir}px, -40px, 0) rotate(${flyDir * 0.1}deg)`;
          el.style.opacity = '0';
          window.birthdayAudio.playPop();

          activeCardIndex++;
          updateDeckCounter();

          // Мини-конфетти
          if (window.confetti) {
            window.confetti({
              particleCount: 20,
              spread: 45,
              origin: { x: currentX > 0 ? 0.8 : 0.2, y: 0.5 },
              colors: ['#ff85a2', '#ffd700']
            });
          }
        }
      } else {
        // Возврат на место
        const origRot = cfg.screen2.cards[index].rotation;
        el.style.transform = `rotate(${origRot}deg) translateY(${index * 4}px)`;
      }
    };

    // Touch события
    el.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX), { passive: true });
    el.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientX), { passive: true });
    el.addEventListener('touchend', endDrag);

    // Mouse события
    el.addEventListener('mousedown', (e) => startDrag(e.clientX));
    window.addEventListener('mousemove', (e) => { if (isDragging) moveDrag(e.clientX); });
    window.addEventListener('mouseup', () => { if (isDragging) endDrag(); });
  }

  btnToCake.addEventListener('click', () => {
    goToStep(3);
  });

  renderPolaroids();

  // =========================================================================
  // ЭКРАН 3: Торт со свечами «27»
  // =========================================================================
  const flame2 = document.getElementById('flame-2');
  const flame7 = document.getElementById('flame-7');
  const candle2 = document.getElementById('candle-2');
  const candle7 = document.getElementById('candle-7');
  const micStatus = document.getElementById('mic-status');
  const btnToQuestion = document.getElementById('btn-to-question');

  function extinguishCandle(which) {
    if (which === 2 && flame2Lit) {
      flame2Lit = false;
      flame2.classList.add('extinguished');
      spawnSmoke(candle2);
      window.birthdayAudio.playExtinguish();
    } else if (which === 7 && flame7Lit) {
      flame7Lit = false;
      flame7.classList.add('extinguished');
      spawnSmoke(candle7);
      window.birthdayAudio.playExtinguish();
    }

    checkAllCandlesBlown();
  }

  function spawnSmoke(parentEl) {
    const smoke = document.createElement('div');
    smoke.className = 'smoke-puff';
    smoke.textContent = '💨';
    parentEl.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1200);
  }

  function checkAllCandlesBlown() {
    if (!flame2Lit && !flame7Lit) {
      window.birthdayAudio.stopMic();
      micStatus.textContent = "✨ Желание загадано! Свечи задуты! ✨";
      micStatus.style.background = "#e8fdf0";
      micStatus.style.color = "#15803d";
      micStatus.style.borderColor = "#86efac";

      btnToQuestion.style.display = 'inline-flex';

      // Праздничный салют
      if (window.confetti) {
        window.confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.55 },
          colors: ['#ffd700', '#ff69b4', '#ffffff']
        });
      }
      window.birthdayAudio.playChime();
    }
  }

  // Вспомогательная функция для фонтанчика вылетающих сердечек/клубничек
  function spawnFlyingParticles(x, y, emojis = ['💖', '✨', '🌸', '🍓']) {
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      p.className = 'flying-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      const dx = (Math.random() - 0.5) * 140;
      const rot = (Math.random() - 0.5) * 70;
      p.style.setProperty('--dx', `${dx}px`);
      p.style.setProperty('--rot', `${rot}deg`);
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }
  }

  // Интерактивный клик/тап по торту: желейный отскок + клубнички
  const cakeImg = document.getElementById('cake-img');
  cakeImg.addEventListener('click', (e) => {
    cakeImg.classList.remove('jelly-wobble');
    void cakeImg.offsetWidth;
    cakeImg.classList.add('jelly-wobble');
    window.birthdayAudio.playSquish();
    const rect = cakeImg.getBoundingClientRect();
    const x = e.clientX || (rect.left + rect.width / 2);
    const y = e.clientY || (rect.top + rect.height / 2);
    spawnFlyingParticles(x, y, ['🍓', '✨', '🍰', '🍓']);
  });

  // Ручной тап по свечам
  candle2.addEventListener('click', () => extinguishCandle(2));
  candle7.addEventListener('click', () => extinguishCandle(7));

  // Инициализация микрофона
  function initStep3Mic() {
    window.birthdayAudio.startMicBlowDetector(() => {
      // При обнаружении дуновения гасим обе свечи
      if (flame2Lit) extinguishCandle(2);
      setTimeout(() => {
        if (flame7Lit) extinguishCandle(7);
      }, 150);
    }).then((started) => {
      if (started) {
        micStatus.textContent = "💨 Микрофон активен! Подуй в телефон!";
      } else {
        micStatus.textContent = "👆 Нажми на пламя свечек, чтобы задуть их!";
      }
    });
  }

  btnToQuestion.addEventListener('click', () => {
    goToStep(4);
  });

  // =========================================================================
  // ЭКРАН 4: Убегающая кнопка «Нет» и Праздничный финал
  // =========================================================================
  const btnYes = document.getElementById('btn-yes');
  const btnNo = document.getElementById('btn-no');
  const decisionBox = document.getElementById('decision-box');
  const questionWrapper = document.getElementById('question-wrapper');
  const celebrationView = document.getElementById('celebration-view');

  // Интерактивное поглаживание котиков (звук «Мяу», прыжок и сердечки)
  const kittyQuestion = document.getElementById('kitty-question-avatar');
  const kittyHeartImg = document.getElementById('kitty-heart-img');
  if (kittyQuestion && kittyHeartImg) {
    kittyQuestion.addEventListener('click', (e) => {
      kittyHeartImg.classList.remove('kitty-jump');
      void kittyHeartImg.offsetWidth;
      kittyHeartImg.classList.add('kitty-jump');
      window.birthdayAudio.playMeowSqueak();
      const rect = kittyQuestion.getBoundingClientRect();
      const x = e.clientX || (rect.left + rect.width / 2);
      const y = e.clientY || (rect.top + rect.height / 2);
      spawnFlyingParticles(x, y, ['💖', '🎀', '✨', '🌸', '💕']);
    });
  }

  const kittyCelebration = document.getElementById('kitty-celebration-avatar');
  if (kittyCelebration) {
    kittyCelebration.addEventListener('click', (e) => {
      const img = kittyCelebration.querySelector('.celebration-kitty-img');
      if (img) {
        img.classList.remove('kitty-jump');
        void img.offsetWidth;
        img.classList.add('kitty-jump');
      }
      window.birthdayAudio.playMeowSqueak();
      const rect = kittyCelebration.getBoundingClientRect();
      const x = e.clientX || (rect.left + rect.width / 2);
      const y = e.clientY || (rect.top + rect.height / 2);
      spawnFlyingParticles(x, y, ['👑', '💖', '✨', '🎀', '🍓']);
    });
  }

  // Физика убегающей кнопки «Нет»
  function runawayNoButton() {
    window.birthdayAudio.playPop();
    const boxRect = decisionBox.getBoundingClientRect();
    const btnRect = btnNo.getBoundingClientRect();

    // Безопасная область перемещения внутри контейнера
    const maxLeft = Math.max(10, boxRect.width - btnRect.width - 20);
    const maxTop = Math.max(10, boxRect.height - btnRect.height - 20);

    const randomLeft = Math.floor(Math.random() * maxLeft);
    const randomTop = Math.floor(Math.random() * maxTop);

    btnNo.style.position = 'absolute';
    btnNo.style.left = `${randomLeft}px`;
    btnNo.style.top = `${randomTop}px`;
  }

  btnNo.addEventListener('mouseenter', runawayNoButton);
  btnNo.addEventListener('touchstart', (e) => {
    e.preventDefault();
    runawayNoButton();
  }, { passive: false });

  // Клик по кнопке «Да, конечно!»
  btnYes.addEventListener('click', () => {
    questionWrapper.style.display = 'none';
    celebrationView.classList.add('active');

    window.birthdayAudio.playFanfare();

    // Бесконечный грандиозный салют (5 секунд)
    if (window.confetti) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 120 };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 45 * (timeLeft / duration);
        window.confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors: ['#ff69b4', '#ffd1dc', '#ffd700', '#ffffff', '#ff1493', '#ff85a2']
        }));
      }, 250);
    }
  });

  // =========================================================================
  // ВИДЖЕТ «27 причин восхищаться Наталией»
  // =========================================================================
  const complimentBox = document.getElementById('compliment-box');
  const complimentNum = document.getElementById('compliment-num');
  const complimentText = document.getElementById('compliment-text');

  complimentBox.addEventListener('click', () => {
    window.birthdayAudio.playPop();
    complimentIdx = (complimentIdx + 1) % cfg.compliments.length;

    // Анимация смены
    complimentText.style.opacity = '0';
    complimentText.style.transform = 'scale(0.95)';

    setTimeout(() => {
      complimentNum.textContent = `Причина восхищаться #${complimentIdx + 1} из 27 🍓`;
      complimentText.textContent = cfg.compliments[complimentIdx];
      complimentText.style.opacity = '1';
      complimentText.style.transform = 'scale(1)';

      if (window.confetti) {
        window.confetti({
          particleCount: 15,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#ff69b4', '#ffd700']
        });
      }
    }, 150);
  });

  // =========================================================================
  // КУЛЬМИНАЦИЯ: КНОПКА «ОБНИМАШКИ И ЦЕЛОВАШКИ» И ФИНАЛЬНЫЙ ОВЕРЛЕЙ (STITCH)
  // =========================================================================
  const btnHugsKisses = document.getElementById('btn-hugs-kisses');
  const hugsOverlay = document.getElementById('hugs-overlay');
  const btnCloseHugs = document.getElementById('btn-close-hugs');
  const btnMoreHugs = document.getElementById('btn-more-hugs');
  const hugsBackdrop = document.getElementById('hugs-backdrop');
  const hugsCounterNum = document.getElementById('hugs-counter-num');
  let hugsCount = 1000;

  function triggerHugsParticles(symbols = ['💖', '💋', '💕', '🍓', '✨', '🎀'], count = 14) {
    const originY = window.innerHeight * 0.55;
    const originX = window.innerWidth * 0.5;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'flying-particle-item';
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];

      const startX = originX + (Math.random() - 0.5) * 160;
      const startY = originY + (Math.random() - 0.5) * 80;

      p.style.left = `${startX}px`;
      p.style.top = `${startY}px`;
      p.style.opacity = '1';
      p.style.transform = `scale(0.5) rotate(${Math.random() * 40 - 20}deg)`;
      p.style.transition = 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)';

      document.body.appendChild(p);

      requestAnimationFrame(() => {
        const deltaX = (Math.random() - 0.5) * 280;
        const deltaY = -(Math.random() * 260 + 100);
        const rot = Math.random() * 120 - 60;
        const scale = 1.1 + Math.random() * 0.7;
        p.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale}) rotate(${rot}deg)`;
        p.style.opacity = '0';
      });

      setTimeout(() => {
        p.remove();
      }, 1500);
    }
  }

  function fireHugsConfetti() {
    if (!window.confetti) return;
    window.confetti({
      particleCount: 70,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#ff1493', '#ff69b4', '#ffd1dc', '#ff2a7a', '#ffd700']
    });
    setTimeout(() => {
      window.confetti({
        particleCount: 50,
        angle: 60,
        spread: 70,
        origin: { x: 0.1, y: 0.7 },
        colors: ['#ff3385', '#ffd1dc', '#ffd700']
      });
      window.confetti({
        particleCount: 50,
        angle: 120,
        spread: 70,
        origin: { x: 0.9, y: 0.7 },
        colors: ['#ff3385', '#ffd1dc', '#ffd700']
      });
    }, 250);
  }

  if (btnHugsKisses) {
    btnHugsKisses.addEventListener('click', () => {
      window.birthdayAudio.playKissChime();
      fireHugsConfetti();
      triggerHugsParticles(['💖', '💋', '💕', '🍓', '✨', '🎀'], 18);

      const hugsMsgEl = document.getElementById('hugs-message');
      if (hugsMsgEl && cfg.screen4?.hugsKissesModal?.message) {
        hugsMsgEl.textContent = cfg.screen4.hugsKissesModal.message;
      }

      setTimeout(() => {
        if (hugsOverlay) {
          hugsOverlay.classList.add('active');
          hugsOverlay.setAttribute('aria-hidden', 'false');
        }
      }, 350);
    });
  }

  if (btnMoreHugs) {
    btnMoreHugs.addEventListener('click', () => {
      hugsCount += 1;
      if (hugsCounterNum) {
        hugsCounterNum.textContent = hugsCount;
        hugsCounterNum.style.transform = 'scale(1.4)';
        setTimeout(() => {
          hugsCounterNum.style.transform = 'scale(1)';
        }, 160);
      }
      window.birthdayAudio.playKissChime();
      fireHugsConfetti();
      triggerHugsParticles(['💋', '💖', '💕', '🍓', '✨'], 15);
    });
  }

  if (btnCloseHugs) {
    btnCloseHugs.addEventListener('click', () => {
      window.birthdayAudio.playPop();
      if (hugsOverlay) {
        hugsOverlay.classList.remove('active');
        hugsOverlay.setAttribute('aria-hidden', 'true');
      }
    });
  }

  if (hugsBackdrop) {
    hugsBackdrop.addEventListener('click', () => {
      window.birthdayAudio.playPop();
      if (hugsOverlay) {
        hugsOverlay.classList.remove('active');
        hugsOverlay.setAttribute('aria-hidden', 'true');
      }
    });
  }

});
