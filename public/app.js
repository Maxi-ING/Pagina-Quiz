const $ = (id) => document.getElementById(id);
const state = { name: '', answers: null, games: [] };
let activeGameCleanup = null;
function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function updateDateLimit() { $('dateIdea').min = localDate(); }
updateDateLimit();
const stages = { loginView: [0, 'Un momento para ti'], welcomeView: [20, 'Bienvenida'], quizView: [45, 'Tus gustos'], gamesView: [70, 'Una pausa para jugar'], finalView: [90, 'La invitación'], thanksView: [100, 'Listo'] };
function show(id) {
  if (id !== 'gamesView') { activeGameCleanup?.(); activeGameCleanup = null; }
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === id));
  $('progressFill').style.width = `${stages[id][0]}%`;
  $('progressLabel').textContent = stages[id][1];
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function post(url, body) {
  let response;
  try { response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) }); }
  catch { throw new Error('No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ocurrió un problema. Inténtalo de nuevo.');
  return data;
}
function busy(button, value) { button.disabled = value; button.dataset.label ??= button.innerHTML; button.innerHTML = value ? 'Un momento…' : button.dataset.label; }
$('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault(); const button = event.currentTarget.querySelector('button'); $('loginError').textContent = ''; busy(button, true);
  try {
    const name = $('guestName').value.trim();
    await post('/api/login', { name, code: $('guestCode').value });
    state.name = name; $('welcomeName').textContent = name; $('guestCode').value = ''; show('welcomeView');
  } catch (error) { $('loginError').textContent = error.message; }
  finally { busy(button, false); }
});
$('startButton').addEventListener('click', () => show('quizView'));
$('quizForm').addEventListener('submit', (event) => {
  event.preventDefault(); updateDateLimit(); const form = new FormData(event.currentTarget);
  const food = String(form.get('foodOther') || '').trim() || form.get('food');
  const place = String(form.get('placeOther') || '').trim() || form.get('place');
  const time = form.get('time');
  if (!food || !place || !time) { $('quizError').textContent = 'Elige comida, lugar y momento para continuar.'; return; }
  const date = String(form.get('date') || '');
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < $('dateIdea').min || !$('dateIdea').checkValidity())) {
    $('quizError').textContent = 'Elige una fecha válida desde hoy en adelante.';
    $('dateIdea').focus(); return;
  }
  $('quizError').textContent = '';
  state.answers = { food, place, time, date, note: String(form.get('note') || '').trim() };
  show('gamesView');
});
function gameMarkup(title, content) { activeGameCleanup?.(); activeGameCleanup = null; $('gameArea').hidden = false; $('gameArea').replaceChildren(); const h = document.createElement('h2'); h.textContent = title; $('gameArea').append(h, content); $('gameArea').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
$('memoryButton').addEventListener('click', () => {
  const options = [{ label: 'Fácil', pairs: 3, columns: 3 }, { label: 'Medio', pairs: 6, columns: 4 }, { label: 'Difícil', pairs: 10, columns: 5 }];
  const symbols = ['🌹', '🍰', '☕', '🎨', '🌿', '💌', '🌙', '🎵', '🍓', '✨'];
  const area = document.createElement('div');
  const lead = document.createElement('p'); lead.textContent = '¿Cuántas parejas te animas a encontrar?';
  const levels = document.createElement('div'); levels.className = 'memory-levels';
  const stats = document.createElement('p'); stats.className = 'memory-stats'; stats.setAttribute('role', 'status');
  const board = document.createElement('div'); board.className = 'memory-grid';
  const result = document.createElement('p'); result.className = 'memory-result'; result.setAttribute('role', 'status');
  const restart = document.createElement('button'); restart.type = 'button'; restart.className = 'secondary memory-restart'; restart.textContent = 'Mezclar de nuevo'; restart.hidden = true;
  area.append(lead, levels, stats, board, result, restart); gameMarkup('Encuentra las parejas', area);
  let timer = null, flipTimer = null, elapsed = 0, attempts = 0, matches = 0, open = [], locked = false, selected = null, disposed = false;
  function stopTimers() { clearInterval(timer); clearTimeout(flipTimer); timer = null; flipTimer = null; }
  activeGameCleanup = () => { disposed = true; stopTimers(); };
  function updateStats() { if (selected) stats.textContent = `${selected.label} · ${matches}/${selected.pairs} parejas · ${attempts} intentos · ${elapsed} s`; }
  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    return items;
  }
  function start(option) {
    stopTimers(); selected = option; elapsed = 0; attempts = 0; matches = 0; open = []; locked = false; result.textContent = ''; restart.hidden = false;
    [...levels.children].forEach((button) => { button.classList.toggle('chosen', button.textContent.startsWith(option.label)); button.setAttribute('aria-pressed', String(button.textContent.startsWith(option.label))); });
    board.replaceChildren(); board.style.setProperty('--memory-columns', String(option.columns)); board.style.maxWidth = `${option.columns * 92 + (option.columns - 1) * 10}px`;
    const deck = shuffle([...symbols.slice(0, option.pairs), ...symbols.slice(0, option.pairs)]);
    deck.forEach((symbol, index) => {
      const card = document.createElement('button'); card.type = 'button'; card.className = 'memory-card'; card.setAttribute('aria-label', `Carta ${index + 1} oculta`);
      const inner = document.createElement('span'); inner.className = 'memory-card-inner';
      const back = document.createElement('span'); back.className = 'memory-face memory-back'; back.textContent = '✦';
      const front = document.createElement('span'); front.className = 'memory-face memory-front'; front.textContent = symbol;
      inner.append(back, front); card.append(inner);
      card.addEventListener('click', () => {
        if (disposed || locked || card.classList.contains('flipped') || card.classList.contains('matched') || matches === option.pairs) return;
        card.classList.add('flipped'); card.setAttribute('aria-label', `Carta ${index + 1}: ${symbol}`); open.push({ card, symbol, index });
        if (open.length !== 2) return;
        attempts++;
        if (open[0].symbol === open[1].symbol) {
          open.forEach((item) => item.card.classList.add('matched')); open = []; matches++;
          if (matches === option.pairs) {
            stopTimers(); result.textContent = `¡Completaste el nivel ${option.label.toLowerCase()} en ${attempts} intentos! ✨`;
            recordGame('Memoria:', `Memoria: ${option.label.toLowerCase()}, ${attempts} intentos, ${elapsed} s`);
          }
        } else {
          locked = true;
          flipTimer = setTimeout(() => {
            open.forEach((item) => { item.card.classList.remove('flipped'); item.card.setAttribute('aria-label', `Carta ${item.index + 1} oculta`); });
            open = []; locked = false; flipTimer = null;
          }, option.pairs === 10 ? 750 : 1000);
        }
        updateStats();
      }); board.append(card);
    });
    updateStats(); timer = setInterval(() => { if (!document.hidden && !disposed) { elapsed++; updateStats(); } }, 1000);
  }
  options.forEach((option) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary'; button.textContent = `${option.label} · ${option.pairs} parejas`;
    button.addEventListener('click', () => start(option)); levels.append(button);
  });
  restart.addEventListener('click', () => { if (selected) start(selected); });
});
$('surpriseButton').addEventListener('click', () => {
  const ideas = ['Un paseo con algo rico para compartir', 'Una tarde de café y buena conversación', 'Elegir juntos un lugar nuevo'];
  const wrap = document.createElement('div'); wrap.className = 'surprise-grid';
  ideas.forEach((idea, i) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = '✦'; button.setAttribute('aria-label', `Sorpresa ${i + 1}`); button.addEventListener('click', () => {
    $('surpriseText').textContent = idea;
    state.games = state.games.filter((game) => !game.startsWith('Sorpresa:'));
    state.games.push(`Sorpresa: ${idea}`);
    $('surpriseDialog').showModal();
  }); wrap.append(button); });
  const hint = document.createElement('p'); hint.textContent = 'Elige una carta para descubrir tu sorpresa.';
  const area = document.createElement('div'); area.append(wrap, hint); gameMarkup('Elige una sorpresa', area);
});
function closeSurprise() { $('surpriseDialog').close(); }
$('closeSurprise').addEventListener('click', closeSurprise);
$('doneSurprise').addEventListener('click', closeSurprise);
$('surpriseDialog').addEventListener('click', (event) => { if (event.target === $('surpriseDialog')) closeSurprise(); });
function recordGame(prefix, result) { state.games = state.games.filter((game) => !game.startsWith(prefix)); state.games.push(result); }
$('tetrisButton').addEventListener('click', () => {
  const area = document.createElement('div'); gameMarkup('Bloques hasta nivel 10', area);
  activeGameCleanup = window.MiniGames.mountTetris(area, (level, lines) => recordGame('Bloques:', `Bloques: nivel ${level}, ${lines} filas`));
});
$('birdButton').addEventListener('click', () => {
  const area = document.createElement('div'); gameMarkup('El pajarito', area);
  activeGameCleanup = window.MiniGames.mountBird(area, (score) => recordGame('Pajarito:', `Pajarito: ${score} obstáculos`));
});
$('skipGamesButton').addEventListener('click', () => {
  const summary = $('answerSummary'); summary.replaceChildren();
  for (const [label, value] of [['Comida', state.answers.food], ['Lugar', state.answers.place], ['Momento', state.answers.time], ['Fecha tentativa', state.answers.date]]) {
    if (!value) continue; const line = document.createElement('p'); const bold = document.createElement('strong'); bold.textContent = `${label}: `; line.append(bold, document.createTextNode(value)); summary.append(line);
  }
  if (state.answers.note) { const note = document.createElement('p'); const bold = document.createElement('strong'); bold.textContent = 'Tu idea: '; note.append(bold, document.createTextNode(state.answers.note)); summary.append(note); }
  show('finalView');
});
$('sendButton').addEventListener('click', async () => {
  $('sendError').textContent = ''; const button = $('sendButton'); busy(button, true);
  try { await post('/api/submit', { answers: state.answers, games: state.games, decision: 'Acepto la invitación', message: $('finalMessage').value.trim() }); show('thanksView'); }
  catch (error) { $('sendError').textContent = error.message; }
  finally { busy(button, false); }
});
