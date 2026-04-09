import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEYS = {
  game: 'quietMagic.game.assets.v5',
  metrics: 'quietMagic.metrics.assets.v5',
  contacts: 'quietMagic.contacts.assets.v5',
  session: 'quietMagic.session.assets.v5',
  admin: 'quietMagic.isAdmin.assets.v5',
};

const PUBLIC_BASE = import.meta.env.BASE_URL;
const ASSETS = {
  screen1: `${PUBLIC_BASE}assets/screen1-hero.png`,
  screen2: `${PUBLIC_BASE}assets/screen2-choice.png`,
  screen4: `${PUBLIC_BASE}assets/screen4-final.png`,
  spark: `${PUBLIC_BASE}assets/artifact-spark.png`,
  key: `${PUBLIC_BASE}assets/artifact-key.png`,
  heart: `${PUBLIC_BASE}assets/artifact-heart.png`,
  star: `${PUBLIC_BASE}assets/artifact-star.png`,
  moon: `${PUBLIC_BASE}assets/artifact-moon.png`,
};

const ADMIN_SECRET_HINT = 'Ваш личный код доступа';
const ADMIN_SECRET_SHA256 = 'a11dd2abefc01f262bfe1fcf07f5339029d398ad220ccb6189de615bcf2b4c77';
// Текущий код доступа к дашборду: SilentMagic-OnlyMe-2026!
// [не проверено] Это только клиентская защита на статическом сайте, не полноценная серверная авторизация.

const SYMBOLS = {
  spark: {
    id: 'spark',
    name: 'Искра',
    short: 'Хочу проявиться',
    artifact: 'Огниво проявления',
    color: '#E0B15F',
    asset: ASSETS.spark,
    prompt: [
      'Написать имена трёх людей, которым я уже помогла',
      'Закончить фразу: «Во мне ценят…»',
      'Закончить фразу: «Я помогаю людям…»',
    ],
  },
  key: {
    id: 'key',
    name: 'Ключ',
    short: 'Хочу ясности',
    artifact: 'Ключ названной силы',
    color: '#D6A567',
    asset: ASSETS.key,
    prompt: [
      'Закончить фразу: «Ко мне приходят, когда…»',
      'Выбрать, что помогаете получить: ясность / решение / структуру / поддержку',
      'Закончить фразу: «Мне говорили спасибо за…»',
    ],
  },
  heart: {
    id: 'heart',
    name: 'Сердце',
    short: 'Хочу делать по-своему',
    artifact: 'Алая нить верности себе',
    color: '#C16C79',
    asset: ASSETS.heart,
    prompt: [
      'Выбрать наиболее органичный формат работы',
      'Написать, что хотите делать «не как все»',
      'Вспомнить, когда находили решения без насилия над собой',
    ],
  },
  star: {
    id: 'star',
    name: 'Звезда',
    short: 'Хочу увидеть путь',
    artifact: 'Звёздный компас пути',
    color: '#F0E1A2',
    asset: ASSETS.star,
    prompt: [
      'Какой ты видишь себя, когда выбрала верный путь?',
      'Ты добилась того, о чём мечтала. Напиши три подсказки себе из будущего',
      'Выбрать формат работы: подписка / наставничество / мини-группы / консультации / онлайн-курсы / очные курсы',
    ],
  },
  moon: {
    id: 'moon',
    name: 'Луна',
    short: 'Хочу безопасности',
    artifact: 'Лунный оберег тишины',
    color: '#C9D3E7',
    asset: ASSETS.moon,
    prompt: [
      'Мой комфортный первый шаг: пост / личное сообщение / личная встреча',
      'Напиши только для себя в заметки, что ты считаешь своим самым сильным продуктом',
      'Создай (но не публикуй, если нет желания) пост, раскрывающий твою экспертизу',
    ],
  },
};

const SCROLL_SECTIONS = {
  spark: 'Моя ценность',
  star: 'Для кого я полезна',
  key: 'Как я называю свой результат',
  heart: 'Как я говорю о деньгах',
  moon: 'Какой мой следующий шаг',
};

const COVENS = [
  'Волшебница камерной магии',
  'Хранительница внутреннего огня',
  'Заклинательница смыслов',
  'Лоцман звездных дорог',
  'Хранительница пути',
];

const PROPHECIES = [
  'Тихая сила раскрывается там, где вы называете ценность спокойно и точно.',
  'Ваш следующий шаг не обязан быть громким. Достаточно, чтобы он был вашим.',
  'Когда путь не ясен целиком, выбирайте то, что даёт внутреннее расширение, а не сжатие.',
  'Ваш опыт уже оставил следы света. Осталось только проявить их.',
  'Сначала назовите результат, потом форму. Так путь становится видимым.',
  'Безопасный шаг — тоже магия, если он сделан вовремя.',
];

const HOTSPOTS = {
  key: { top: '37.5%', left: '28.5%' },
  heart: { top: '31.5%', left: '50%' },
  star: { top: '34%', left: '68%' },
  spark: { top: '54.5%', left: '34%' },
  moon: { top: '49%', left: '78%' },
};

const PANEL_VARIANTS = {
  initial: { opacity: 0, y: 18, scale: 0.985, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -10, scale: 0.99, transition: { duration: 0.24 } },
};

function safeParse(json, fallback) {
  try { return json ? JSON.parse(json) : fallback; } catch { return fallback; }
}
function loadLocal(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
}
function saveLocal(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
function sanitizeText(input) {
  return String(input ?? '').replace(/[<>`"'\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 220);
}
function validateContact(raw) {
  const value = sanitizeText(raw).slice(0, 120);
  const email = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(value) || false;
  const social = /^@?[A-Za-zА-Яа-я0-9._-]{3,50}$/.test(value) || /^https?:\/\/[^\s]{5,120}$/.test(value) || false;
  return { ok: email || social, value, type: email ? 'email' : social ? 'social' : 'unknown' };
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function uniqueCount(arr) {
  return new Set(arr).size;
}
function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function getInitialGame() {
  return {
    screen: 1,
    selectedSymbol: null,
    progress: [],
    artifacts: [],
    scroll: { spark: '', key: '', heart: '', star: '', moon: '' },
    selectedOptions: [],
    lastPlayedDate: todayISO(),
    prophecy: '',
    contactSubmitted: false,
    ratingSubmitted: false,
  };
}
function getInitialMetrics() {
  return {
    uniqueSessions: 0,
    reachedScreen3Sessions: [],
    keyActionSessions: [],
    returnsSessions: [],
    ratings: [],
    contacts: [],
  };
}
function getSessionId() {
  const existing = sessionStorage.getItem(STORAGE_KEYS.session);
  if (existing) return existing;
  const sid = 'sess_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
  sessionStorage.setItem(STORAGE_KEYS.session, sid);
  return sid;
}
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function App() {
  const [game, setGame] = useState(() => loadLocal(STORAGE_KEYS.game, getInitialGame()));
  const [metrics, setMetrics] = useState(() => loadLocal(STORAGE_KEYS.metrics, getInitialMetrics()));
  const [isAdmin, setIsAdmin] = useState(() => !!loadLocal(STORAGE_KEYS.admin, false));
  const [hoveredSymbol, setHoveredSymbol] = useState(null);
  const [contactInput, setContactInput] = useState('');
  const [contactError, setContactError] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [secretClicks, setSecretClicks] = useState(0);
  const [flashColor, setFlashColor] = useState('');
  const [revealingSymbol, setRevealingSymbol] = useState(null);
  const [adminError, setAdminError] = useState('');
  const longPressRef = useRef(null);
  const sessionId = useMemo(() => getSessionId(), []);

  useEffect(() => { injectStyles(); }, []);
  useEffect(() => saveLocal(STORAGE_KEYS.game, game), [game]);
  useEffect(() => saveLocal(STORAGE_KEYS.metrics, metrics), [metrics]);
  useEffect(() => saveLocal(STORAGE_KEYS.admin, isAdmin), [isAdmin]);

  useEffect(() => {
    const seenKey = `quietMagic.seen.${sessionId}`;
    if (!sessionStorage.getItem(seenKey)) {
      setMetrics((prev) => ({ ...prev, uniqueSessions: prev.uniqueSessions + 1 }));
      sessionStorage.setItem(seenKey, '1');
    }
    const prevGame = loadLocal(STORAGE_KEYS.game, getInitialGame());
    const today = todayISO();
    if (prevGame.lastPlayedDate && prevGame.lastPlayedDate !== today) {
      setMetrics((prev) => prev.returnsSessions.includes(sessionId) ? prev : { ...prev, returnsSessions: [...prev.returnsSessions, sessionId] });
    }
    setGame((prev) => ({ ...prev, lastPlayedDate: today }));
  }, [sessionId]);

  useEffect(() => {
    const onKey = async (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        const code = window.prompt(`${ADMIN_SECRET_HINT}:`);
        if (!code) return;
        const digest = await sha256(code);
        if (digest === ADMIN_SECRET_SHA256) {
          setIsAdmin(true);
          setAdminError('');
          window.location.hash = '#/admin';
        } else {
          setAdminError('Неверный код доступа.');
          window.setTimeout(() => setAdminError(''), 2600);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const progressCount = uniqueCount(game.progress);
  const allComplete = progressCount === 5;
  const currentSymbol = game.selectedSymbol ? SYMBOLS[game.selectedSymbol] : null;
  const covenName = progressCount ? COVENS[progressCount - 1] : COVENS[0];
  const routeAdmin = window.location.hash.includes('/admin') && isAdmin;
  const avgRating = metrics.ratings.length ? (metrics.ratings.reduce((a, b) => a + b, 0) / metrics.ratings.length).toFixed(1) : '0.0';

  const setScreen = (screen) => setGame((prev) => ({ ...prev, screen }));

  const onEnter = () => setScreen(2);

  const handleSymbolPick = (id) => {
    const alreadyDone = game.progress.includes(id);
    setGame((prev) => ({
      ...prev,
      selectedSymbol: id,
      progress: alreadyDone ? prev.progress : [...prev.progress, id],
      artifacts: alreadyDone ? prev.artifacts : [...prev.artifacts, SYMBOLS[id].artifact],
      prophecy: '',
    }));
    setRevealingSymbol(id);
    setFlashColor(SYMBOLS[id].color);
    window.setTimeout(() => setFlashColor(''), 2000);
    window.setTimeout(() => setRevealingSymbol(null), 1800);
  };

  const goScreen3 = () => {
    setMetrics((prev) => prev.reachedScreen3Sessions.includes(sessionId) ? prev : { ...prev, reachedScreen3Sessions: [...prev.reachedScreen3Sessions, sessionId] });
    setScreen(3);
  };

  const handleOptionSelect = (optionText, index) => {
    const symbolId = game.selectedSymbol;
    const clean = sanitizeText(optionText);
    setGame((prev) => ({
      ...prev,
      selectedOptions: [...prev.selectedOptions.filter((x) => x.symbol !== symbolId), { symbol: symbolId, optionIndex: index, text: clean }],
      scroll: { ...prev.scroll, [symbolId]: clean },
      screen: 4,
    }));
  };

  const handleAnotherStep = () => {
    setGame((prev) => ({ ...prev, selectedSymbol: null, screen: 2, prophecy: '' }));
    setShowContactForm(false);
    setShowRating(false);
    setContactInput('');
    setContactError('');
  };

  const handleContinuePath = () => {
    setMetrics((prev) => prev.keyActionSessions.includes(sessionId) ? prev : { ...prev, keyActionSessions: [...prev.keyActionSessions, sessionId] });
    setShowContactForm(true);
    setShowRating(false);
    setGame((prev) => ({ ...prev, prophecy: '' }));
  };

  const handleSubmitContact = () => {
    const result = validateContact(contactInput);
    if (!result.ok) {
      setContactError('Введите корректную почту, @ник или ссылку.');
      return;
    }
    const item = { contact: result.value, type: result.type, date: new Date().toISOString() };
    const contacts = loadLocal(STORAGE_KEYS.contacts, []);
    const nextContacts = [item, ...contacts].slice(0, 500);
    saveLocal(STORAGE_KEYS.contacts, nextContacts);
    setMetrics((prev) => ({ ...prev, contacts: [item, ...prev.contacts].slice(0, 500) }));
    downloadJSON(`quiet-magic-contact-${todayISO()}.json`, item);
    setGame((prev) => ({ ...prev, contactSubmitted: true }));
    setContactInput('');
    setContactError('');
    setShowContactForm(false);
    setShowRating(true);
  };

  const submitRating = (value) => {
    if (game.ratingSubmitted) return;
    setMetrics((prev) => ({ ...prev, ratings: [...prev.ratings, Number(value)] }));
    setGame((prev) => ({ ...prev, ratingSubmitted: true }));
  };

  const handleProphecy = () => {
    const item = PROPHECIES[Math.floor(Math.random() * PROPHECIES.length)];
    setGame((prev) => ({ ...prev, prophecy: item }));
    setShowContactForm(false);
    setShowRating(false);
  };

  const resetAll = () => {
    const ok = window.confirm('Сбросить прогресс, контакты и метрики?');
    if (!ok) return;
    saveLocal(STORAGE_KEYS.game, getInitialGame());
    saveLocal(STORAGE_KEYS.metrics, getInitialMetrics());
    saveLocal(STORAGE_KEYS.contacts, []);
    setGame(getInitialGame());
    setMetrics(getInitialMetrics());
    setShowContactForm(false);
    setShowRating(false);
  };

  const exportMetrics = () => {
    downloadJSON('quiet-magic-metrics.json', {
      exportedAt: new Date().toISOString(),
      metrics,
      contacts: loadLocal(STORAGE_KEYS.contacts, []),
    });
  };

  const secretTitleTap = async () => {
    const next = secretClicks + 1;
    setSecretClicks(next);
    if (next >= 5) {
      const code = window.prompt(`${ADMIN_SECRET_HINT}:`);
      setSecretClicks(0);
      if (!code) return;
      const digest = await sha256(code);
      if (digest === ADMIN_SECRET_SHA256) {
        setIsAdmin(true);
        window.location.hash = '#/admin';
      } else {
        setAdminError('Неверный код доступа.');
        window.setTimeout(() => setAdminError(''), 2600);
      }
    }
  };

  if (routeAdmin) {
    return (
      <div className="qm-app qm-admin">
        <div className="qm-admin-bg" />
        <header className="qm-admin-header glass-panel">
          <div>
            <div className="qm-kicker">Защищённый раздел</div>
            <h1 className="qm-heading">Админ-дашборд</h1>
          </div>
          <div className="qm-admin-actions">
            <button className="ghost-btn magical" onClick={exportMetrics}>Экспорт JSON</button>
            <button className="danger-btn" onClick={resetAll}>Сбросить всё</button>
            <button className="ghost-btn magical" onClick={() => (window.location.hash = '#/')}>В игру</button>
          </div>
        </header>

        <main className="qm-admin-grid">
          <Metric title="Посетители" value={metrics.uniqueSessions} />
          <Metric title="Пользователи" value={metrics.reachedScreen3Sessions.length} />
          <Metric title="Ключевое действие" value={metrics.keyActionSessions.length} />
          <Metric title="Возвраты" value={metrics.returnsSessions.length} />
          <Metric title="Средняя оценка" value={avgRating} />
          <section className="glass-panel qm-admin-wide">
            <div className="metric-title">Последние 5 контактов</div>
            <div className="qm-contact-list">
              {(loadLocal(STORAGE_KEYS.contacts, []) || []).slice(0, 5).map((item, i) => (
                <div className="qm-contact-item" key={item.contact + i}>
                  <div className="qm-contact-main">{item.contact}</div>
                  <div className="qm-contact-meta">{item.type} · {new Date(item.date).toLocaleString()}</div>
                </div>
              ))}
              {(loadLocal(STORAGE_KEYS.contacts, []) || []).length === 0 && <div className="qm-muted">Контактов пока нет.</div>}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="qm-app">
      <BackgroundFX flashColor={flashColor} />
      <header className="qm-topbar">
        <button className="qm-brand" onClick={secretTitleTap}>
          <span className="qm-brand-mark">✦</span>
          <span>Ларец волшебницы</span>
        </button>
        <div className="qm-topbar-right">
          <div className="glass-chip">Артефакты: <b>{progressCount}/5</b></div>
          <div className={`glass-chip ${allComplete ? 'gold' : ''}`}>{allComplete ? 'Путь открыт' : 'Печать пути'}</div>
        </div>
      </header>
      {adminError && <div className="admin-error-banner">{adminError}</div>}

      <main className="qm-stage">
        <AnimatePresence mode="wait">
          {game.screen === 1 && (
            <motion.section key="screen1" className="screen" variants={PANEL_VARIANTS} initial="initial" animate="animate" exit="exit">
              <HeroScreen onEnter={onEnter} />
            </motion.section>
          )}

          {game.screen === 2 && (
            <motion.section key="screen2" className="screen" variants={PANEL_VARIANTS} initial="initial" animate="animate" exit="exit">
              <ChoiceScreen
                hoveredSymbol={hoveredSymbol}
                selectedSymbol={game.selectedSymbol}
                progressCount={progressCount}
                revealingSymbol={revealingSymbol}
                onPick={handleSymbolPick}
                onContinue={goScreen3}
                onHover={setHoveredSymbol}
                longPressRef={longPressRef}
              />
            </motion.section>
          )}

          {game.screen === 3 && currentSymbol && (
            <motion.section key="screen3" className="screen" variants={PANEL_VARIANTS} initial="initial" animate="animate" exit="exit">
              <ArtifactStepScreen symbol={currentSymbol} onPickOption={handleOptionSelect} />
            </motion.section>
          )}

          {game.screen === 4 && (
            <motion.section key="screen4" className="screen" variants={PANEL_VARIANTS} initial="initial" animate="animate" exit="exit">
              <FinalScreen
                game={game}
                covenName={covenName}
                allComplete={allComplete}
                onAnotherStep={handleAnotherStep}
                onContinuePath={handleContinuePath}
                onProphecy={handleProphecy}
                showContactForm={showContactForm}
                showRating={showRating}
                contactInput={contactInput}
                contactError={contactError}
                setContactInput={(v) => setContactInput(sanitizeText(v))}
                onSubmitContact={handleSubmitContact}
                onRate={submitRating}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function HeroScreen({ onEnter }) {
  return (
    <div className="hero-composition frame">
      <div className="stage-blur" style={{ backgroundImage: `url(${ASSETS.screen1})` }} />
      <div className="stage-dim" style={{ background: 'linear-gradient(180deg, rgba(6,8,18,.20), rgba(6,8,18,.66))' }} />
      <FloatingDust />
      <div className="hero-art-wrap">
        <img src={ASSETS.screen1} alt="Волшебница с ларцом" className="hero-art" />
      </div>
      <motion.div className="hero-bottom premium-panel" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.15 }}>
        <h1 className="hero-title">Путь тихой магии</h1>
        <button className="gold-btn magical" onClick={onEnter}>Прояви то, что уже есть в тебе</button>
      </motion.div>
    </div>
  );
}

function ChoiceScreen({ hoveredSymbol, selectedSymbol, progressCount, revealingSymbol, onPick, onContinue, onHover, longPressRef }) {
  return (
    <div className="choice-composition frame">
      <div className="stage-blur" style={{ backgroundImage: `url(${ASSETS.screen2})` }} />
      <div className="stage-dim" style={{ background: 'linear-gradient(180deg, rgba(6,8,18,.24), rgba(6,8,18,.60))' }} />
      <FloatingDust />

      <div className="choice-title-wrap"><h2 className="screen-title">Что зовет тебя сейчас сильнее всего?</h2></div>

      <div className="choice-art-wrap">
        <img src={ASSETS.screen2} alt="Ларец с парящими символами" className="choice-art" />
        <div className="choice-hotspots image-bound">
          {Object.entries(HOTSPOTS).map(([id, pos]) => (
            <Hotspot
              key={id}
              top={pos.top}
              left={pos.left}
              label={SYMBOLS[id].name}
              active={hoveredSymbol === id || selectedSymbol === id}
              onEnter={() => onHover(id)}
              onLeave={() => onHover(null)}
              onTouchStart={() => { longPressRef.current = setTimeout(() => onHover(id), 350); }}
              onTouchEnd={() => { clearTimeout(longPressRef.current); onHover(null); }}
              onClick={() => onPick(id)}
            />
          ))}

          <AnimatePresence>
            {revealingSymbol && (
              <motion.div
                className="symbol-reveal"
                key={revealingSymbol}
                initial={{ opacity: 0, scale: 0.7, rotate: -18 }}
                animate={{ opacity: 1, scale: [0.7, 1.15, 1], rotate: [ -18, 8, 0 ] }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 1.1, ease: [0.22,1,0.36,1] }}
              >
                <img src={SYMBOLS[revealingSymbol].asset} alt={SYMBOLS[revealingSymbol].artifact} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="tooltip-band">
        <AnimatePresence mode="wait">
          {!selectedSymbol && hoveredSymbol && (
            <motion.div key={`tip-${hoveredSymbol}`} className="glass-tooltip premium-panel" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }}>
              <div className="tooltip-name">{SYMBOLS[hoveredSymbol].name}</div>
              <div className="tooltip-text">{SYMBOLS[hoveredSymbol].short}</div>
            </motion.div>
          )}
          {selectedSymbol && (
            <motion.div key={`selected-${selectedSymbol}`} className="reveal-card premium-panel" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}>
              <div className="reveal-line">Вы выбрали не случайно.</div>
              <div className="reveal-artifact">{SYMBOLS[selectedSymbol].artifact}</div>
              <div className="reveal-count">{progressCount}-ый артефакт силы пробужден: {progressCount}/5</div>
              <button className="gold-btn magical" onClick={onContinue}>Сделать еще шаг на моем пути</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ArtifactStepScreen({ symbol, onPickOption }) {
  return (
    <div className="artifact-step-grid">
      <div className="artifact-visual frame">
        <div className="stage-blur" style={{ backgroundImage: `url(${symbol.asset})`, filter: 'blur(24px)' }} />
        <div className="stage-dim" style={{ background: 'linear-gradient(180deg, rgba(6,8,18,.30), rgba(6,8,18,.55))' }} />
        <motion.img src={symbol.asset} alt={symbol.artifact} className="artifact-main" initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: [0.92,1.04,1], y: 0 }} transition={{ duration: 0.7 }} />
        <motion.div className="artifact-glow-ring" animate={{ rotate: 360, scale: [1, 1.04, 1] }} transition={{ rotate: { repeat: Infinity, duration: 18, ease: 'linear' }, scale: { repeat: Infinity, duration: 4, ease: 'easeInOut' } }} />
        <motion.div className="artifact-badge premium-panel" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}><span className="artifact-badge-name">{symbol.artifact}</span></motion.div>
      </div>

      <div className="step-visual frame">
        <div className="stage-blur" style={{ backgroundImage: `url(${ASSETS.screen2})`, filter: 'blur(22px)' }} />
        <div className="stage-dim" style={{ background: 'linear-gradient(180deg, rgba(6,8,18,.42), rgba(6,8,18,.68))' }} />
        <div className="step-content better">
          <h2 className="screen-title left">{symbol.name}</h2>
          <div className="step-subtitle">Выберите одну мягкую формулировку для этого шага.</div>
          <div className="step-options">
            {symbol.prompt.map((text, index) => (
              <motion.button className="ornate-option premium-panel" key={index} onClick={() => onPickOption(text, index)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 * index }}>
                <div className="ornate-icon"><SymbolGlyph id={symbol.id} size={28} active /></div>
                <span>{text}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinalScreen({ game, covenName, allComplete, onAnotherStep, onContinuePath, onProphecy, showContactForm, showRating, contactInput, contactError, setContactInput, onSubmitContact, onRate }) {
  return (
    <div className="final-composition frame">
      <div className="stage-blur" style={{ backgroundImage: `url(${ASSETS.screen4})`, filter: 'blur(24px)' }} />
      <div className="stage-dim" style={{ background: 'linear-gradient(180deg, rgba(6,8,18,.26), rgba(6,8,18,.52))' }} />
      <FloatingDust />
      <div className="final-body">
        <div className="final-art-wrap">
          <img src={ASSETS.screen4} alt="Ваш путь открыт" aria-hidden="true" className="final-art" />
          <motion.div className="coven-bubble floating premium-panel" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}>Мой ковен – {covenName}</motion.div>
        </div>
        <motion.div className="final-right scroll-card" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}>
          <div className="scroll-card-title">Мой свиток проявления</div>
          <div className="scroll-list">
            {['spark', 'star', 'key', 'heart', 'moon'].map((id) => {
              const done = !!game.scroll[id];
              return (
                <div className={`scroll-row ${done ? 'done' : ''}`} key={id}>
                  <div className="scroll-row-label">{SCROLL_SECTIONS[id]}</div>
                  <div className="scroll-row-value">{done ? game.scroll[id] : 'Этот фрагмент откроется позже.'}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
      <div className="bottom-dock">
        {!allComplete && <button className="gold-btn magical" onClick={onAnotherStep}>Сделать еще шаг</button>}
        {allComplete && (
          <>
            <button className="gold-btn magical" onClick={onContinuePath}>Хочу продолжить путь</button>
            <button className="ghost-btn magical" onClick={onProphecy}>Хочу прорицание</button>
          </>
        )}
      </div>
      <AnimatePresence>
        {showContactForm && (
          <motion.div className="overlay-card modal-card premium-panel" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}>
            <div className="overlay-title">Оставьте почту или контакт в соцсетях</div>
            <input className="overlay-input" value={contactInput} onChange={(e) => setContactInput(e.target.value)} placeholder="name@example.com / @username / https://..." maxLength={120} autoComplete="off" />
            {contactError && <div className="overlay-error">{contactError}</div>}
            <button className="gold-btn magical" onClick={onSubmitContact}>Отправить</button>
          </motion.div>
        )}
        {showRating && (
          <motion.div className="overlay-card modal-card rating-overlay premium-panel" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}>
            <div className="overlay-title">Оцените игру</div>
            <div className="overlay-sub">1 — «ерунда, не зацепило», 5 — «отлично, напишите, где взять продолжение»</div>
            <div className="rating-row">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" className="rating-btn magical" key={n} onClick={() => onRate(n)} aria-label={`Оценка ${n}`}>{n}</button>
              ))}
            </div>
          </motion.div>
        )}
        {game.prophecy && (
          <motion.div className="overlay-card modal-card prophecy premium-panel" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}>
            <div className="overlay-title">Прорицание</div>
            <div className="prophecy-text">{game.prophecy}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Hotspot({ top, left, label, active, onClick, onEnter, onLeave, onTouchStart, onTouchEnd }) {
  return (
    <motion.button
      className={`hotspot ${active ? 'active' : ''}`}
      style={{ top, left }}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      type="button"
      animate={active ? { scale: [1, 1.06, 1], boxShadow: ['0 10px 22px rgba(0,0,0,.26)', '0 0 18px rgba(224,177,95,.35),0 12px 26px rgba(0,0,0,.3)', '0 10px 22px rgba(0,0,0,.26)'] } : { scale: 1 }}
      transition={{ duration: 1.6, repeat: active ? Infinity : 0 }}
    >
      <span>{label}</span>
    </motion.button>
  );
}

function Metric({ title, value }) {
  return <section className="glass-panel metric-card"><div className="metric-title">{title}</div><div className="metric-value">{value}</div></section>;
}

function FloatingDust() {
  return (
    <div className="dust-layer" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.span
          key={i}
          className={`dust dust-${i % 6}`}
          animate={{ y: [-4, -16, -4], opacity: [0.12, 0.72, 0.12], x: [0, i % 2 === 0 ? 4 : -4, 0] }}
          transition={{ duration: 4 + (i % 4), repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
        />
      ))}
    </div>
  );
}

function BackgroundFX({ flashColor }) {
  return (
    <div className="qm-bg-wrap" aria-hidden="true">
      <div className="qm-bg" />
      <AnimatePresence>
        {flashColor && (
          <motion.div className="flash-layer" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} transition={{ duration: 1.9 }} style={{ background: `radial-gradient(circle at 50% 50%, ${flashColor}55 0%, transparent 45%)` }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SymbolGlyph({ id, size = 54, active = false }) {
  const color = SYMBOLS[id].color;
  const glow = active ? `drop-shadow(0 0 14px ${color})` : 'none';
  const common = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ filter: glow, overflow: 'visible' }}>
      {id === 'spark' && <><circle cx="50" cy="50" r="32" {...common} opacity="0.35" /><path d="M50 24 L57 42 L74 50 L57 58 L50 76 L43 58 L26 50 L43 42 Z" {...common} /></>}
      {id === 'moon' && <><circle cx="50" cy="50" r="34" {...common} opacity="0.25" /><path d="M61 21C49 25 40 36 40 50s9 25 21 29c-5 2-10 3-15 3-18 0-32-14-32-32s14-32 32-32c5 0 10 1 15 3Z" {...common} /></>}
      {id === 'key' && <><path d="M50 18a12 12 0 1 1 0 24a12 12 0 0 1 0-24Z" {...common} /><path d="M50 42v34m0 0h10m-10 0v8m0-8h18v-8" {...common} /></>}
      {id === 'heart' && <><circle cx="50" cy="50" r="33" {...common} opacity="0.18" /><path d="M50 76c-1-1-2-1-3-2C29 61 20 53 20 39c0-10 8-17 18-17 6 0 10 2 12 7 2-5 6-7 12-7 10 0 18 7 18 17 0 14-9 22-27 35-1 1-2 1-3 2Z" {...common} /></>}
      {id === 'star' && <><circle cx="50" cy="50" r="33" {...common} opacity="0.2" /><path d="M50 16L56 44L84 50L56 56L50 84L44 56L16 50L44 44Z" {...common} /></>}
    </svg>
  );
}

function injectStyles() {
  if (document.getElementById('quiet-magic-v5-style')) return;
  const style = document.createElement('style');
  style.id = 'quiet-magic-v5-style';
  style.textContent = `
  :root{--qm-night:#0b1020;--qm-night2:#12192d;--qm-gold:#d7b26d;--qm-gold2:#f0d8a2;--qm-milk:#f6f1e8;--qm-border:rgba(255,255,255,.12);--qm-glass:rgba(7,10,20,.46);--qm-shadow:rgba(0,0,0,.42);--qm-font:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;--qm-serif:Georgia,'Times New Roman',serif}
  *{box-sizing:border-box} html,body,#root{margin:0;width:100%;height:100%;overflow:hidden;background:linear-gradient(180deg,#0a1020,#111a30);color:var(--qm-milk);font-family:var(--qm-font)} button,input{font:inherit}
  .qm-app{position:relative;width:100%;height:100%;overflow:hidden;background:radial-gradient(circle at 20% 15%,rgba(201,211,231,.06),transparent 18%),radial-gradient(circle at 80% 20%,rgba(224,177,95,.08),transparent 16%),linear-gradient(180deg,#09101d 0%,#12192c 55%,#0c1222 100%)}
  .qm-bg-wrap,.qm-bg,.qm-admin-bg,.flash-layer{position:absolute;inset:0;pointer-events:none}.qm-bg,.qm-admin-bg{background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.04),transparent 22%),radial-gradient(circle at 50% 100%,rgba(224,177,95,.04),transparent 18%)}
  .qm-topbar{position:relative;z-index:10;height:7.2vh;min-height:48px;display:flex;align-items:center;justify-content:space-between;padding:8px 14px}.qm-brand{display:flex;align-items:center;gap:10px;border:none;background:transparent;color:var(--qm-milk);cursor:pointer;padding:6px 8px;border-radius:14px;font-weight:700}.qm-brand-mark{color:var(--qm-gold);text-shadow:0 0 12px rgba(215,178,109,.4)}.qm-topbar-right{display:flex;gap:10px;align-items:center}
  .glass-chip,.glass-panel,.premium-panel{border:1px solid var(--qm-border);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));backdrop-filter:blur(10px);box-shadow:0 12px 30px var(--qm-shadow)}.glass-chip{padding:8px 12px;border-radius:999px;font-size:13px}.glass-chip b,.glass-chip.gold{color:var(--qm-gold2)}
  .qm-stage{position:relative;z-index:2;height:92.8vh;padding:0 8px 8px}.screen{width:100%;height:100%;overflow:hidden}
  .frame{position:relative;width:100%;height:100%;overflow:hidden;border-radius:28px;border:1px solid rgba(215,178,109,0.18);box-shadow:0 18px 40px rgba(0,0,0,.45),inset 0 0 0 1px rgba(255,255,255,.04);background:#0d1220}
  .stage-blur{position:absolute;inset:-2%;background-size:cover;background-position:center;filter:blur(18px);transform:scale(1.08);opacity:.9}.stage-dim{position:absolute;inset:0;pointer-events:none}.dust-layer,.symbol-reveal{pointer-events:none}
  .hero-art-wrap,.choice-art-wrap,.final-art-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:12px 14px 84px}.hero-art,.choice-art,.final-art{max-width:100%;max-height:100%;object-fit:contain;display:block;filter:drop-shadow(0 20px 40px rgba(0,0,0,.35))}
  .hero-bottom{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:16px;padding:18px 20px;width:min(92%,760px);z-index:3;border-radius:24px}
  .hero-title,.screen-title,.qm-heading,.scroll-card-title{margin:0;font-family:var(--qm-serif);text-shadow:0 2px 12px rgba(0,0,0,.55),0 8px 28px rgba(0,0,0,.38);color:var(--qm-milk);text-wrap:balance}.hero-title{font-size:clamp(34px,5vw,60px);text-align:center}.screen-title{font-size:clamp(26px,3.2vw,40px);text-align:center}.screen-title.left{text-align:left}
  .gold-btn,.ghost-btn,.danger-btn,.rating-btn{min-height:48px;padding:12px 18px;border-radius:18px;cursor:pointer;font-weight:700;transition:transform .18s ease,opacity .18s ease,box-shadow .18s ease;position:relative;overflow:hidden}
  .gold-btn:hover,.ghost-btn:hover,.danger-btn:hover,.rating-btn:hover,.ornate-option:hover,.hotspot:hover{transform:translateY(-1px)}
  .gold-btn{border:1px solid rgba(255,236,184,.34);color:#22170b;background:linear-gradient(180deg,rgba(244,220,161,1) 0%,rgba(215,178,109,1) 100%);box-shadow:0 10px 24px rgba(215,178,109,.24),inset 0 1px 0 rgba(255,255,255,.5)}
  .ghost-btn{border:1px solid rgba(255,255,255,.14);color:var(--qm-milk);background:rgba(12,17,30,.58);backdrop-filter:blur(8px)}
  .danger-btn{border:1px solid rgba(255,180,180,.16);color:#fff;background:linear-gradient(180deg,#8b3340,#662632)}
  .magical::after{content:'';position:absolute;top:-30%;left:-120%;width:58%;height:180%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.44),transparent);transform:rotate(18deg);animation:shimmer 3.2s infinite}.gold-btn.magical{box-shadow:0 0 0 rgba(215,178,109,0),0 10px 24px rgba(215,178,109,.24),inset 0 1px 0 rgba(255,255,255,.5);animation:goldGlow 2.8s infinite ease-in-out}.ghost-btn.magical,.premium-panel{box-shadow:0 12px 30px var(--qm-shadow),0 0 24px rgba(215,178,109,.08)}
  @keyframes shimmer{0%{left:-120%}55%{left:160%}100%{left:160%}} @keyframes goldGlow{0%,100%{box-shadow:0 0 0 rgba(215,178,109,0),0 10px 24px rgba(215,178,109,.24),inset 0 1px 0 rgba(255,255,255,.5)}50%{box-shadow:0 0 22px rgba(240,216,162,.22),0 10px 24px rgba(215,178,109,.30),inset 0 1px 0 rgba(255,255,255,.6)}}
  .choice-title-wrap{position:absolute;top:20px;left:50%;transform:translateX(-50%);width:min(90%,900px);z-index:4}.choice-art-wrap{padding-top:78px;padding-bottom:172px}.choice-hotspots.image-bound{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(100%,1040px);height:min(100%,760px);max-width:78vw;max-height:68vh;z-index:4}
  .hotspot{position:absolute;transform:translate(-50%,-50%);border:1px solid rgba(255,235,185,.28);border-radius:16px;background:rgba(16,18,28,.48);backdrop-filter:blur(5px);color:var(--qm-milk);padding:10px 14px;box-shadow:0 10px 22px rgba(0,0,0,.26);min-width:92px}.hotspot.active{box-shadow:0 0 18px rgba(224,177,95,.28),0 10px 22px rgba(0,0,0,.26);border-color:rgba(255,226,150,.44)}
  .symbol-reveal{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(28vw,180px);z-index:5;filter:drop-shadow(0 0 34px rgba(240,216,162,.35))}.symbol-reveal img{width:100%;height:auto;display:block}
  .tooltip-band{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);width:min(92%,760px);display:flex;justify-content:center;z-index:6}.glass-tooltip,.reveal-card,.overlay-card{width:100%;max-width:760px;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:linear-gradient(180deg,rgba(9,12,22,.76),rgba(9,12,22,.58));backdrop-filter:blur(12px);box-shadow:0 18px 36px rgba(0,0,0,.34);padding:16px;text-align:center}
  .tooltip-name,.reveal-line,.overlay-title{font-family:var(--qm-serif);font-size:clamp(20px,2.2vw,28px);color:var(--qm-gold2);margin-bottom:6px}.tooltip-text,.reveal-count,.overlay-sub{font-size:14px;opacity:.92}.reveal-artifact{font-size:18px;font-weight:700;margin:6px 0 10px}
  .artifact-step-grid{width:100%;height:100%;display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:12px}.artifact-visual,.step-visual{height:100%}.artifact-main{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:88%;max-height:78%;object-fit:contain;z-index:3;filter:drop-shadow(0 20px 40px rgba(0,0,0,.4))}.artifact-glow-ring{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(42vw,360px);aspect-ratio:1;border-radius:50%;border:1px solid rgba(240,216,162,.22);box-shadow:0 0 60px rgba(240,216,162,.12),inset 0 0 40px rgba(255,255,255,.04);z-index:2}.artifact-badge{position:absolute;left:50%;bottom:4%;transform:translateX(-50%);width:min(88%,420px);padding:14px 16px;border-radius:20px;text-align:center;z-index:3}.artifact-badge-name{font-family:var(--qm-serif);font-size:clamp(22px,2.2vw,30px)}
  .step-content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:18px;gap:14px;z-index:3}.step-content.better{padding-bottom:28px}.step-subtitle{font-size:14px;opacity:.9;max-width:42ch}.step-options{display:grid;gap:10px}.ornate-option{display:grid;grid-template-columns:46px 1fr;gap:12px;align-items:center;min-height:68px;text-align:left;padding:12px 14px;border-radius:18px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(15,20,36,.72),rgba(15,20,36,.54));color:var(--qm-milk);backdrop-filter:blur(8px);box-shadow:0 10px 20px rgba(0,0,0,.24)}.ornate-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:rgba(255,255,255,.04)}
  .final-body{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr);gap:12px;padding:12px 12px 100px;z-index:3}.final-art-wrap{position:relative;display:flex;align-items:center;justify-content:center;padding:18px}.final-art{max-width:100%;max-height:100%;object-fit:contain;display:block;filter:drop-shadow(0 18px 38px rgba(0,0,0,.36))}.coven-bubble{position:absolute;left:6%;top:8%;max-width:340px;padding:16px 18px;border-radius:22px;font-family:var(--qm-serif);font-size:clamp(20px,2.2vw,30px);text-align:center;color:var(--qm-milk);z-index:4}.scroll-card{align-self:center;background:linear-gradient(180deg,rgba(235,223,201,.97),rgba(226,212,184,.92));color:#3d2c1b;border:1px solid rgba(129,95,48,.24);box-shadow:0 18px 32px rgba(0,0,0,.26);border-radius:26px;padding:16px;overflow:auto;max-height:100%}.scroll-card-title{font-size:clamp(24px,2.2vw,30px);text-align:center;margin-bottom:10px;color:#4a3822}.scroll-list{display:grid;gap:10px}.scroll-row{border-radius:14px;padding:10px 12px;background:rgba(255,255,255,.34);border:1px solid rgba(82,60,31,.12)}.scroll-row.done{background:rgba(255,255,255,.52)}.scroll-row-label{font-weight:700;margin-bottom:4px}.scroll-row-value{font-size:13px;line-height:1.32}
  .bottom-dock{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);width:min(94%,760px);display:flex;justify-content:center;gap:10px;flex-wrap:wrap;z-index:5;padding:12px;border-radius:24px;background:linear-gradient(180deg,rgba(9,12,22,.54),rgba(9,12,22,.34));backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.08)}
  .overlay-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92%,720px);z-index:20;pointer-events:auto}.modal-card{box-shadow:0 20px 40px rgba(0,0,0,.42),0 0 40px rgba(215,178,109,.10)}.overlay-input{width:100%;min-height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:var(--qm-milk);padding:12px 14px;margin:10px 0}.overlay-input::placeholder{color:rgba(246,241,232,.56)}.overlay-error{color:#ffd4da;font-size:13px;margin-bottom:8px}
  .rating-overlay{z-index:30;pointer-events:auto}.rating-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px;position:relative;z-index:31;pointer-events:auto}.rating-btn{width:52px;height:52px;border:none;border-radius:50%;cursor:pointer;font-weight:700;font-size:18px;color:#211508;background:linear-gradient(180deg,rgba(244,220,161,1) 0%,rgba(215,178,109,1) 100%);box-shadow:0 8px 18px rgba(215,178,109,.24);position:relative;z-index:32;pointer-events:auto}.rating-btn:active{transform:scale(.97)}
  .prophecy-text{font-family:var(--qm-serif);font-size:clamp(18px,2vw,26px);color:var(--qm-gold2);line-height:1.35}
  .admin-error-banner{position:absolute;left:50%;top:56px;transform:translateX(-50%);z-index:12;padding:10px 14px;border-radius:14px;background:rgba(120,25,40,.88);border:1px solid rgba(255,180,180,.18)}
  .qm-admin{padding:12px}.qm-admin-header{position:relative;z-index:2;display:flex;justify-content:space-between;gap:12px;padding:16px;border-radius:24px}.qm-kicker{font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.74;margin-bottom:4px}.qm-heading{font-size:clamp(26px,3vw,40px)}.qm-admin-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;justify-content:flex-end}.qm-admin-grid{position:relative;z-index:2;margin-top:12px;height:calc(100% - 110px);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.metric-card{padding:18px 14px;border-radius:22px;text-align:center}.metric-title{font-size:14px;opacity:.86}.metric-value{font-family:var(--qm-serif);font-size:clamp(28px,3vw,38px);color:var(--qm-gold2);margin-top:8px}.qm-admin-wide{grid-column:1 / -1;border-radius:24px;padding:16px;overflow:auto}.qm-contact-list{display:grid;gap:10px;margin-top:12px}.qm-contact-item{padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}.qm-contact-main{font-weight:700;word-break:break-word}.qm-contact-meta{opacity:.76;font-size:13px;margin-top:4px}.qm-muted{opacity:.7}
  @media (max-width: 1080px){.choice-hotspots.image-bound{max-width:86vw;max-height:60vh}.final-body{grid-template-columns:1fr;grid-template-rows:minmax(0,.92fr) minmax(0,1.08fr)}.coven-bubble{left:50%;transform:translateX(-50%);top:3%;max-width:420px}.scroll-card{width:min(100%,760px);justify-self:center;max-height:100%}}
  @media (max-width: 820px){.artifact-step-grid{grid-template-columns:1fr;grid-template-rows:minmax(0,.84fr) minmax(0,1.16fr)}.choice-art-wrap{padding-bottom:194px}.choice-hotspots.image-bound{max-width:92vw;max-height:54vh}.symbol-reveal{width:min(38vw,160px)}.final-body{padding-bottom:118px}.coven-bubble{font-size:clamp(18px,4.6vw,26px)}}
  @media (max-width: 640px){.qm-topbar{padding:8px 10px;min-height:52px}.qm-stage{padding:0 8px 8px}.qm-brand{font-size:13px;padding:6px 8px}.glass-chip{font-size:11px;padding:7px 10px}.hero-title{font-size:clamp(28px,8.4vw,42px)}.screen-title{font-size:clamp(22px,6vw,30px)}.hero-bottom{gap:12px;padding:16px 14px 18px}.choice-art-wrap{padding:72px 8px 196px}.choice-hotspots.image-bound{width:100%;height:52vh;max-width:100%;max-height:52vh}.hotspot{min-width:78px;padding:8px 10px;font-size:13px}.step-content{padding:12px;gap:10px}.ornate-option{min-height:60px;padding:10px 12px;grid-template-columns:40px 1fr;font-size:13px}.bottom-dock{width:96%;display:grid;grid-template-columns:1fr}.overlay-card{width:94%}.scroll-card{width:100%;max-height:100%;padding:12px}.qm-admin-header{flex-direction:column;align-items:stretch}.qm-admin-actions{justify-content:stretch}.qm-admin-actions>button{width:100%}.qm-admin-grid{grid-template-columns:1fr;height:calc(100% - 182px)}}
  @media (max-height: 760px){.gold-btn,.ghost-btn,.danger-btn,.rating-btn{min-height:42px;padding:10px 14px}.hero-bottom{bottom:12px;gap:10px}.tooltip-band{bottom:12px}.artifact-badge{bottom:3%;padding:10px 12px}.bottom-dock{bottom:10px}.choice-hotspots.image-bound{max-height:50vh}}
  `;
  document.head.appendChild(style);
}
