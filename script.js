const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');

menuButton.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
});

document.querySelectorAll('.desktop-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    header.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const counters = document.querySelectorAll('.counter');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = Number(el.dataset.target);
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.6 });
counters.forEach((counter) => counterObserver.observe(counter));

const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', (event) => {
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-message');
const chatBody = document.querySelector('.chat-body');

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  const userMessage = document.createElement('div');
  userMessage.className = 'message user';
  const userText = document.createElement('p');
  userText.textContent = text;
  userMessage.appendChild(userText);
  chatBody.appendChild(userMessage);
  chatInput.value = '';

  window.setTimeout(() => {
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot';
    const avatar = document.createElement('span');
    avatar.className = 'mini-avatar';
    avatar.textContent = 'c';
    const reply = document.createElement('p');
    reply.textContent = '좋은 질문이에요. colie라면 맥락을 살펴 가장 필요한 답과 다음 행동을 함께 제안해 드려요.';
    botMessage.append(avatar, reply);
    chatBody.appendChild(botMessage);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
  }, 650);

  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
});
