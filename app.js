const $ = (id) => document.getElementById(id);
const state = { name: '', answers: null, games: [] };
const stages = { loginView: [0, 'Un momento para ti'], welcomeView: [20, 'Bienvenida'], quizView: [45, 'Tus gustos'], gamesView: [70, 'Una pausa para jugar'], finalView: [90, 'La invitación'], thanksView: [100, 'Listo'] };
function show(id) {
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
  event.preventDefault(); const form = new FormData(event.currentTarget);
  const food = String(form.get('foodOther') || '').trim() || form.get('food');
  const place = String(form.get('placeOther') || '').trim() || form.get('place');
  const time = form.get('time');
  if (!food || !place || !time) { $('quizError').textContent = 'Elige comida, lugar y momento para continuar.'; return; }
  $('quizError').textContent = '';
  state.answers = { food, place, time, date: String(form.get('date') || ''), note: String(form.get('note') || '').trim() };
  show('gamesView');
});
function gameMarkup(title, content) { $('gameArea').hidden = false; $('gameArea').replaceChildren(); const h = document.createElement('h2'); h.textContent = title; $('gameArea').append(h, content); $('gameArea').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
$('memoryButton').addEventListener('click', () => {
  const values = ['🌹', '🍰', '☕', '🌹', '🍰', '☕'].sort(() => Math.random() - .5);
  const wrap = document.createElement('div'); wrap.className = 'memory-grid';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  let open = [], matches = 0, locked = false;
  values.forEach((value, index) => {
    const card = document.createElement('button'); card.type = 'button'; card.className = 'memory-card'; card.textContent = '✦'; card.setAttribute('aria-label', `Carta ${index + 1} oculta`);
    card.addEventListener('click', () => {
      if (locked || card.classList.contains('open') || card.classList.contains('matched')) return;
      card.classList.add('open'); card.textContent = value; card.setAttribute('aria-label', value); open.push({ card, value });
      if (open.length === 2) {
        if (open[0].value === open[1].value) {
          open.forEach((item) => item.card.classList.add('matched')); open = []; matches++;
          if (matches === 3) { status.textContent = '¡Encontraste todas las parejas! ✨'; if (!state.games.includes('Memoria completada')) state.games.push('Memoria completada'); }
        } else { locked = true; setTimeout(() => { open.forEach((item) => { item.card.classList.remove('open'); item.card.textContent = '✦'; item.card.setAttribute('aria-label', 'Carta oculta'); }); open = []; locked = false; }, 850); }
      }
    }); wrap.append(card);
  });
  const area = document.createElement('div'); area.append(wrap, status); gameMarkup('Encuentra las parejas', area);
});
$('surpriseButton').addEventListener('click', () => {
  const ideas = ['Un paseo con algo rico para compartir', 'Una tarde de café y buena conversación', 'Elegir juntos un lugar nuevo'];
  const wrap = document.createElement('div'); wrap.className = 'surprise-grid'; const result = document.createElement('p'); result.setAttribute('role', 'status');
  ideas.forEach((idea, i) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = '✦'; button.setAttribute('aria-label', `Sorpresa ${i + 1}`); button.addEventListener('click', () => { result.textContent = `Tu sorpresa: ${idea}.`; state.games = state.games.filter((game) => !game.startsWith('Sorpresa:')); state.games.push(`Sorpresa: ${idea}`); [...wrap.children].forEach((child) => { child.disabled = true; }); }); wrap.append(button); });
  const area = document.createElement('div'); area.append(wrap, result); gameMarkup('Elige una sorpresa', area);
});
$('skipGamesButton').addEventListener('click', () => {
  const summary = $('answerSummary'); summary.replaceChildren();
  for (const [label, value] of [['Comida', state.answers.food], ['Lugar', state.answers.place], ['Momento', state.answers.time], ['Fecha tentativa', state.answers.date]]) {
    if (!value) continue; const line = document.createElement('p'); const bold = document.createElement('strong'); bold.textContent = `${label}: `; line.append(bold, document.createTextNode(value)); summary.append(line);
  }
  show('finalView');
});
$('sendButton').addEventListener('click', async () => {
  const decision = document.querySelector('input[name="decision"]:checked')?.value;
  if (!decision) { $('sendError').textContent = 'Elige una respuesta antes de enviarla.'; return; }
  $('sendError').textContent = ''; const button = $('sendButton'); busy(button, true);
  try { await post('/api/submit', { answers: state.answers, games: state.games, decision, message: $('finalMessage').value.trim() }); show('thanksView'); }
  catch (error) { $('sendError').textContent = error.message; }
  finally { busy(button, false); }
});
