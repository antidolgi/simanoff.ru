document.addEventListener('DOMContentLoaded', function() {
  // Инициализация
  initCursorTrail();
  initServiceCards();
  initOrderForm();
  initSecretMode();
  initContactRobot();
  initSecretHint();
  initBonusRules();
  initScrollAnimations();
  
  // Проверка, открыта ли секция правил
  if (window.location.hash === '#bonus-rules') {
    document.querySelector('.bonus-rules-section').classList.add('active');
  }
});

// 1. Градиентный след за курсором
function initCursorTrail() {
  const cursor = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    speed: 0.2
  };

  let trail = [];
  const maxTrail = 15;

  document.addEventListener('mousemove', e => {
    cursor.tx = e.clientX;
    cursor.ty = e.clientY;
  });

  function drawTrail() {
    cursor.x += (cursor.tx - cursor.x) * cursor.speed;
    cursor.y += (cursor.ty - cursor.y) * cursor.speed;
    
    trail.unshift({x: cursor.x, y: cursor.y});
    if(trail.length > maxTrail) trail.pop();
    
    const canvas = document.getElementById('cursor-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for(let i = 0; i < trail.length; i++) {
      const pos = trail[i];
      const size = i * 0.7;
      const opacity = (1 - i/maxTrail) * 0.7;
      
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(
        pos.x, pos.y, 0, 
        pos.x, pos.y, size * 10
      );
      gradient.addColorStop(0, 'rgba(74, 108, 247, ' + opacity + ')');
      gradient.addColorStop(1, 'rgba(140, 82, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.arc(pos.x, pos.y, size * 10, 0, Math.PI * 2);
      ctx.fill();
    }
    
    requestAnimationFrame(drawTrail);
  }

  // Инициализация
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '9998';
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);

  // Отключаем на мобильных
  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    canvas.remove();
  } else {
    drawTrail();
  }
}

// 2. Карточки услуг
function initServiceCards() {
  const serviceCards = document.querySelectorAll('.service-card');
  
  serviceCards.forEach(card => {
    card.addEventListener('click', () => {
      const service = card.dataset.service;
      document.getElementById('service-select').value = service;
      updateOrderTotal();
    });
  });
}

// 3. Форма заказа
function initOrderForm() {
  const serviceSelect = document.getElementById('service-select');
  
  serviceSelect.addEventListener('change', updateOrderTotal);
  document.getElementById('service-form').addEventListener('submit', validateBonus);
  
  // Маска для телефона
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 0) {
        value = '+7' + value.substring(1);
        if (value.length > 2) value = value.substring(0, 2) + ' (' + value.substring(2);
        if (value.length > 7) value = value.substring(0, 7) + ') ' + value.substring(7);
        if (value.length > 12) value = value.substring(0, 12) + '-' + value.substring(12);
        if (value.length > 15) value = value.substring(0, 15) + '-' + value.substring(15);
      }
      e.target.value = value;
    });
  }
  
  // Инициализация
  updateOrderTotal();
}

function updateOrderTotal() {
  const service = document.getElementById('service-select').value;
  let basePrice = 0;
  
  // Цены на услуги
  const prices = {
    'websites': 5000,
    'bots': 3000,
    'advertising': 5000,
    'design': 3000,
    'engraving': 1500,
    'support': 1000
  };
  
  basePrice = prices[service] || 0;
  document.getElementById('total-price').textContent = basePrice.toLocaleString() + ' ₽';
  
  // Обновляем прогресс-бар
  updateProgress(basePrice);
  
  // Проверяем, активен ли бонус
  const bonusActive = localStorage.getItem('simDigitalPassActive') === 'true';
  if(bonusActive && basePrice >= 3000) {
    const discountedPrice = Math.max(0, Math.round(basePrice * 0.7));
    const maxDiscount = 5000;
    const actualDiscount = Math.min(basePrice - discountedPrice, maxDiscount);
    
    document.getElementById('discount-info').innerHTML = `
      <strong>✓ Применена скидка 30%</strong> (макс. скидка 5 000 ₽)<br>
      Экономия: ${actualDiscount.toLocaleString()} ₽
    `;
    document.getElementById('final-price').textContent = 
      (basePrice - actualDiscount).toLocaleString() + ' ₽';
  } else {
    document.getElementById('discount-info').innerHTML = '';
    document.getElementById('final-price').textContent = 
      basePrice.toLocaleString() + ' ₽';
  }
}

function updateProgress(currentPrice) {
  const minOrder = 3000;
  const progress = Math.min(100, (currentPrice / minOrder) * 100);
  
  document.getElementById('progress-bar').style.width = progress + '%';
  document.getElementById('progress-text').textContent = 
    `До бонуса: ${Math.max(0, minOrder - currentPrice).toLocaleString()} ₽`;
  
  const availability = document.querySelector('.bonus-availability');
  if(currentPrice >= minOrder) {
    availability.style.display = 'block';
  } else {
    availability.style.display = 'none';
  }
}

function validateBonus(e) {
  const totalPrice = parseInt(document.getElementById('total-price').textContent.replace(/\D/g, ''));
  const bonusActive = localStorage.getItem('simDigitalPassActive') === 'true';
  
  if(bonusActive && totalPrice < 3000) {
    e.preventDefault();
    alert('Скидка 30% доступна только при заказе от 3 000 ₽.\nВыберите дополнительные услуги или увеличьте объем проекта.');
    return false;
  }
  
  // Здесь можно добавить отправку формы на сервер
  // e.preventDefault();
  // sendFormData();
}

// 4. Секретный режим
function initSecretMode() {
  const simbot = document.getElementById('simbot');
  if (!simbot) return;
  let clickCount = 0;
  let lastClickTime = 0;
  
  // Нажатия на робота
  simbot.addEventListener('click', () => {
    const now = Date.now();
    
    // Сброс счетчика если прошло больше 1 секунды
    if(now - lastClickTime > 1000) {
      clickCount = 0;
    }
    
    lastClickTime = now;
    clickCount++;
    
    // Показываем мигание
    winkEye();
    
    // Активация секретного режима
    if(clickCount >= 3) {
      activateSecretMode();
      clickCount = 0;
    }
  });
  
  // Подмигивание
  function winkEye() {
    const eye = document.querySelector('.simbot-eye-left');
    if(eye) {
      eye.style.transform = 'scaleY(0.2)';
      setTimeout(() => {
        eye.style.transform = 'scaleY(1)';
      }, 150);
    }
  }
}

function activateSecretMode() {
  const bonusContainer = document.getElementById('secret-bonus');
  if (!bonusContainer) return;
  bonusContainer.style.display = 'block';
  
  // Случайный выбор партнера
  const partners = [
    {
      name: 'studio 817',
      gift: '1 час аренды студии без фотографа',
      icon: '📸'
    },
    {
      name: 'Айдаюрист.рф',
      gift: 'Скидка 15% на юридические услуги',
      icon: '⚖️'
    }
  ];
  
  const partner = partners[Math.floor(Math.random() * partners.length)];
  const partnerElement = bonusContainer.querySelector('.partner-bonus');
  if (partnerElement) {
    partnerElement.querySelector('.partner-icon').textContent = partner.icon;
    partnerElement.querySelector('.partner-name').textContent = partner.name;
    partnerElement.querySelector('.partner-gift').textContent = partner.gift;
  }
  
  // Обработка кнопки
  const activateBtn = bonusContainer.querySelector('.activate-bonus');
  if (activateBtn) {
    activateBtn.onclick = function() {
      // Активируем бонус
      localStorage.setItem('simDigitalPassActive', 'true');
      
      // Показываем сообщение
      alert('Скриншот сохранен!\n\nПри заказе услуги покажите этот скриншот для получения сертификата.\n\nСертификат будет выдан после оплаты.');
      
      // Обновляем форму
      updateOrderTotal();
      
      // Меняем кнопку
      activateBtn.innerHTML = '✓ Скриншот сохранен';
      activateBtn.disabled = true;
    };
  }
  
  // Добавляем обработчик для кнопки закрыть
  const closeBtn = bonusContainer.querySelector('.close-secret-bonus');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      bonusContainer.style.display = 'none';
    });
  }
}

// 5. Контактный робот
function initContactRobot() {
  const contactToggle = document.querySelector('.contact-toggle');
  const contactRobot = document.getElementById('contact-robot');
  if (!contactToggle || !contactRobot) return;
  
  contactToggle.addEventListener('click', function() {
    const simbot = document.getElementById('simbot');
    
    // Анимация для основного робота
    if (simbot) {
      simbot.style.transform = 'scale(0.8)';
      simbot.style.opacity = '0.7';
    }
    
    // Показываем контактного робота
    contactRobot.style.display = 'block';
    
    // Анимация появления
    setTimeout(() => {
      contactRobot.style.opacity = '1';
      contactRobot.style.transform = 'scale(1)';
    }, 50);
    
    // Возвращаем основной робот в исходное состояние
    setTimeout(() => {
      if (simbot) {
        simbot.style.transform = 'scale(1)';
        simbot.style.opacity = '1';
      }
    }, 800);
    
    // Анимация приветствия
    greetWithRobot();
  });
  
  // Закрытие контактного робота
  document.querySelector('.close-contact-robot').addEventListener('click', function() {
    closeContactRobot();
  });
  
  // Закрытие кликом вне области
  document.addEventListener('click', function(e) {
    if (contactRobot.style.display === 'block' && 
        !contactRobot.contains(e.target) && 
        !contactToggle.contains(e.target)) {
      closeContactRobot();
    }
  });
}

function closeContactRobot() {
  const contactRobot = document.getElementById('contact-robot');
  const simbot = document.getElementById('simbot');
  
  contactRobot.style.opacity = '0';
  contactRobot.style.transform = 'scale(0.9)';
  
  setTimeout(() => {
    contactRobot.style.display = 'none';
    if (simbot) {
      simbot.style.transform = 'scale(1)';
      simbot.style.opacity = '1';
    }
  }, 300);
}

function greetWithRobot() {
  const robotArms = document.querySelectorAll('.contact-robot-arm-left, .contact-robot-arm-right');
  
  // Приветствие руками
  robotArms.forEach(arm => {
    arm.style.transition = 'transform 0.5s ease';
    arm.style.transform = 'rotate(20deg)';
  });
  
  // Возвращаем в исходное положение
  setTimeout(() => {
    robotArms.forEach(arm => {
      arm.style.transform = 'rotate(0deg)';
    });
  }, 500);
}

// 6. Скрытая подсказка
function initSecretHint() {
  const hint = document.querySelector('.secret-hint');
  if(hint) {
    // Редкое мигание
    setInterval(() => {
      hint.style.color = '#F8F9FF';
      setTimeout(() => {
        hint.style.color = '#8C52FF';
      }, 300);
    }, 30000);
  }
}

// 7. Правила бонуса
function initBonusRules() {
  const rulesSection = document.querySelector('.bonus-rules-section');
  const rulesLink = document.querySelector('a[href="#bonus-rules"]');
  
  if (rulesLink) {
    rulesLink.addEventListener('click', function(e) {
      e.preventDefault();
      rulesSection.classList.add('active');
      window.location.hash = 'bonus-rules';
    });
  }
  
  // Добавляем обработчик для возврата
  const returnLinks = document.querySelectorAll('.footer-links a[href="#services"], .footer-links a[href="#order"]');
  returnLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (rulesSection) {
        rulesSection.classList.remove('active');
        window.location.hash = '';
      }
    });
  });
}

// 8. Анимации при скролле
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.service-card, .process-step');
  function checkScroll() {
    animatedElements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.3;
      if (elementPosition < screenPosition) {
        element.classList.add('visible');
      }
    });
  }
  
  // Проверяем при загрузке и при скролле
  window.addEventListener('load', checkScroll);
  window.addEventListener('scroll', checkScroll);
}