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
  let candlesLit = [true, true, true]; // 3 свечи на праздничном торте
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
      onEnterStep3();
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
  // ЭКРАН 3: Торт с 3 свечами и свайпом ветра (Stitch UI)
  // =========================================================================
  const candleEls = [
    document.getElementById('candle-1'),
    document.getElementById('candle-2'),
    document.getElementById('candle-3')
  ];
  const flameEls = [
    document.getElementById('flame-1'),
    document.getElementById('flame-2'),
    document.getElementById('flame-3')
  ];
  const smokeEls = [
    document.getElementById('smoke-1'),
    document.getElementById('smoke-2'),
    document.getElementById('smoke-3')
  ];
  const emberEls = [
    document.getElementById('ember-1'),
    document.getElementById('ember-2'),
    document.getElementById('ember-3')
  ];
  const windTrail = document.getElementById('wind-swipe-trail');
  const candlesBadge = document.getElementById('candles-count-badge');
  const swipeTrack = document.getElementById('swipe-wind-track');
  const swipeKnob = document.getElementById('swipe-wind-knob');
  const swipeProgress = document.getElementById('swipe-wind-progress');
  const wishStatus = document.getElementById('wish-status-text');
  const btnToQuestion = document.getElementById('btn-to-question');
  const cakeStage = document.getElementById('cake-stage');
  const cakeImg = document.getElementById('cake-img');
  const candlesOverlay = document.getElementById('candles-overlay');

  function updateCandlesBadge() {
    const litCount = candlesLit.filter(Boolean).length;
    if (!candlesBadge) return;
    if (litCount === 0) {
      candlesBadge.textContent = "✨ Все 3 задуты! ✨";
      candlesBadge.style.background = "#e8fdf0";
      candlesBadge.style.color = "#15803d";
      candlesBadge.style.borderColor = "#86efac";
    } else {
      candlesBadge.textContent = `${litCount} / 3 горят`;
      candlesBadge.style.background = "#fff0f5";
      candlesBadge.style.color = "#7a5761";
      candlesBadge.style.borderColor = "#ffd1dc";
    }
  }

  function extinguishCandle(index) {
    if (index < 0 || index >= candlesLit.length) return;
    if (!candlesLit[index]) return;

    candlesLit[index] = false;

    // Гасим пламя
    if (flameEls[index]) {
      flameEls[index].classList.add('extinguished');
    }

    // Запускаем остывающий уголёк на фитильке
    if (emberEls[index]) {
      emberEls[index].classList.remove('ember-active');
      void emberEls[index].offsetWidth;
      emberEls[index].classList.add('ember-active');
    }

    // Запускаем дымок
    if (smokeEls[index]) {
      smokeEls[index].classList.remove('puff-active');
      void smokeEls[index].offsetWidth;
      smokeEls[index].classList.add('puff-active');
    }

    // Звук и тактильный отклик
    window.birthdayAudio.playExtinguish();

    // Обновляем бейдж и проверяем завершение
    updateCandlesBadge();
    checkAllCandlesBlown();
  }

  function checkAllCandlesBlown() {
    if (candlesLit.every(lit => !lit)) {
      if (wishStatus) {
        if (cfg.screen3?.candlesBlownText) {
          wishStatus.textContent = cfg.screen3.candlesBlownText;
        }
        wishStatus.style.display = 'block';
      }

      if (btnToQuestion) {
        btnToQuestion.style.display = 'inline-flex';
        btnToQuestion.classList.remove('pulse-highlight');
        void btnToQuestion.offsetWidth;
        btnToQuestion.classList.add('pulse-highlight');
      }

      // Обновляем слайдер в победное состояние
      if (swipeKnob) {
        swipeKnob.innerHTML = '<span>✨</span>';
        swipeKnob.style.background = 'linear-gradient(135deg, #ffd700 0%, #ff85a2 100%)';
      }
      if (swipeProgress) {
        swipeProgress.style.width = '100%';
      }
      const swipeText = document.querySelector('.swipe-wind-text');
      if (swipeText) {
        swipeText.textContent = "🎉 Свечи задуты! Желание загадано!";
        swipeText.style.color = "#15803d";
      }

      // Праздничный салют конфетти
      if (window.confetti) {
        window.confetti({
          particleCount: 100,
          spread: 75,
          origin: { y: 0.52 },
          colors: ['#ffd700', '#ff69b4', '#ffffff', '#ff1493', '#7cfc00']
        });
      }

      window.birthdayAudio.playChime();
    }
  }

  // Запуск шлейфа ветра при свайпе
  function triggerWindTrail() {
    if (!windTrail) return;
    windTrail.classList.remove('wind-active');
    void windTrail.offsetWidth;
    windTrail.classList.add('wind-active');
    setTimeout(() => {
      windTrail.classList.remove('wind-active');
    }, 650);
  }

  // Плавный последовательный свайп задувания (волной: свеча 1 -> 2 -> 3)
  function blowCandlesSequence() {
    triggerWindTrail();
    let delay = 0;
    for (let i = 0; i < 3; i++) {
      if (candlesLit[i]) {
        setTimeout(() => {
          extinguishCandle(i);
        }, delay);
        delay += 140;
      }
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
  if (cakeImg) {
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
  }

  // Ручной тап по отдельным свечам
  candleEls.forEach((el, idx) => {
    if (el) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        extinguishCandle(idx);
      });
    }
  });

  // ==========================================
  // Свайп по слайдеру (Stitch wind track)
  // ==========================================
  if (swipeTrack && swipeKnob) {
    let isKnobDragging = false;
    let trackStartX = 0;

    const startKnobDrag = (clientX) => {
      if (candlesLit.every(lit => !lit)) return;
      isKnobDragging = true;
      trackStartX = clientX;
      swipeKnob.style.transition = 'none';
      if (swipeProgress) swipeProgress.style.transition = 'none';
      triggerWindTrail();
    };

    const moveKnobDrag = (clientX) => {
      if (!isKnobDragging) return;
      const trackRect = swipeTrack.getBoundingClientRect();
      const knobWidth = swipeKnob.offsetWidth || 38;
      const maxDist = trackRect.width - knobWidth - 6;
      if (maxDist <= 0) return;

      let deltaX = clientX - trackRect.left - knobWidth / 2;
      deltaX = Math.max(0, Math.min(deltaX, maxDist));

      const ratio = deltaX / maxDist; // 0.0 .. 1.0

      swipeKnob.style.left = `${3 + deltaX}px`;
      if (swipeProgress) {
        swipeProgress.style.width = `${Math.min(100, Math.max(10, ratio * 100))}%`;
      }

      // Постепенное тушение свечей по мере протяжки слайдера
      if (ratio >= 0.22 && candlesLit[0]) {
        extinguishCandle(0);
      }
      if (ratio >= 0.52 && candlesLit[1]) {
        extinguishCandle(1);
      }
      if (ratio >= 0.82 && candlesLit[2]) {
        extinguishCandle(2);
      }
    };

    const endKnobDrag = () => {
      if (!isKnobDragging) return;
      isKnobDragging = false;

      // Если все свечи задуты, фиксируем кнопку в конце
      if (candlesLit.every(lit => !lit)) {
        const trackRect = swipeTrack.getBoundingClientRect();
        const knobWidth = swipeKnob.offsetWidth || 38;
        const maxDist = Math.max(0, trackRect.width - knobWidth - 6);
        swipeKnob.style.transition = 'left 0.25s ease';
        swipeKnob.style.left = `${3 + maxDist}px`;
      } else {
        // Возвращаем ручку назад, если еще остались горящие свечи
        swipeKnob.style.transition = 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        swipeKnob.style.left = '3px';
        if (swipeProgress) {
          swipeProgress.style.transition = 'width 0.35s ease';
          swipeProgress.style.width = '10%';
        }
      }
    };

    // Touch на слайдере
    swipeTrack.addEventListener('touchstart', (e) => startKnobDrag(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchmove', (e) => { if (isKnobDragging) moveKnobDrag(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchend', endKnobDrag);

    // Mouse на слайдере
    swipeKnob.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startKnobDrag(e.clientX);
    });
    window.addEventListener('mousemove', (e) => { if (isKnobDragging) moveKnobDrag(e.clientX); });
    window.addEventListener('mouseup', endKnobDrag);
  }

  // ==========================================
  // Прямой горизонтальный свайп по торту/свечам
  // ==========================================
  const cakeTarget = candlesOverlay || cakeStage;
  if (cakeTarget) {
    let cakeTouchStartX = 0;
    let cakeTouchStartY = 0;
    let cakeSwiping = false;

    const startCakeSwipe = (x, y) => {
      cakeTouchStartX = x;
      cakeTouchStartY = y;
      cakeSwiping = true;
    };

    const moveCakeSwipe = (x, y) => {
      if (!cakeSwiping) return;
      const dx = x - cakeTouchStartX;
      const dy = Math.abs(y - cakeTouchStartY);

      // Если горизонтальный свайп вправо > 45px и наклон < 60px
      if (dx > 45 && dy < 60) {
        cakeSwiping = false;
        blowCandlesSequence();

        // Также анимируем слайдер до конца для синхронизации
        if (swipeKnob && swipeTrack) {
          const trackRect = swipeTrack.getBoundingClientRect();
          const knobWidth = swipeKnob.offsetWidth || 38;
          const maxDist = Math.max(0, trackRect.width - knobWidth - 6);
          swipeKnob.style.transition = 'left 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
          swipeKnob.style.left = `${3 + maxDist}px`;
          if (swipeProgress) {
            swipeProgress.style.transition = 'width 0.45s ease';
            swipeProgress.style.width = '100%';
          }
        }
      }
    };

    const endCakeSwipe = () => {
      cakeSwiping = false;
    };

    cakeTarget.addEventListener('touchstart', (e) => {
      startCakeSwipe(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    cakeTarget.addEventListener('touchmove', (e) => {
      moveCakeSwipe(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    cakeTarget.addEventListener('touchend', endCakeSwipe);

    // Мышиный свайп по торту
    cakeTarget.addEventListener('mousedown', (e) => {
      startCakeSwipe(e.clientX, e.clientY);
    });
    cakeTarget.addEventListener('mousemove', (e) => {
      moveCakeSwipe(e.clientX, e.clientY);
    });
    cakeTarget.addEventListener('mouseup', endCakeSwipe);
  }

  // При входе на шаг 3:
  function onEnterStep3() {
    updateCandlesBadge();
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
