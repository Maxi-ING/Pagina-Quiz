/* Juegos originales en canvas; no requieren librerías externas. */
window.MiniGames = (() => {
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function control(label, aria, action) {
    const button = el('button', 'game-control', label);
    button.type = 'button'; button.setAttribute('aria-label', aria); button.addEventListener('click', action);
    return button;
  }
  function mountTetris(host, onResult) {
    const cols = 10, rows = 20, cell = 24;
    const shapes = [
      { id: 'I', matrix: [[1, 1, 1, 1]], color: '#60b5bf' },
      { id: 'O', matrix: [[1, 1], [1, 1]], color: '#e8bd65' },
      { id: 'T', matrix: [[0, 1, 0], [1, 1, 1]], color: '#a17aa8' },
      { id: 'S', matrix: [[0, 1, 1], [1, 1, 0]], color: '#85b083' },
      { id: 'Z', matrix: [[1, 1, 0], [0, 1, 1]], color: '#d17982' },
      { id: 'J', matrix: [[1, 0, 0], [1, 1, 1]], color: '#718fb3' },
      { id: 'L', matrix: [[0, 0, 1], [1, 1, 1]], color: '#d99a6b' }
    ];
    const wrap = el('div', 'arcade-layout'), side = el('div', 'arcade-side');
    const canvas = el('canvas', 'arcade-canvas'); canvas.width = cols * cell; canvas.height = rows * cell;
    canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Tablero de bloques de diez columnas y veinte filas');
    const ctx = canvas.getContext('2d');
    const info = el('p', 'arcade-stats'); info.setAttribute('role', 'status');
    const hint = el('p', 'arcade-hint', '← → mover · ↑ girar · ↓ bajar · espacio soltar. Cada 4 filas avanzas un nivel; completa 40 para ganar.');
    const controls = el('div', 'arcade-controls');
    const restart = control('↻', 'Reiniciar bloques', reset); restart.classList.add('secondary');
    side.append(info, hint, controls, restart); wrap.append(canvas, side); host.append(wrap);
    let board, current, bag, lines, score, level, status, last, accumulator, frameId, disposed = false;
    function nextShape() {
      if (!bag.length) { bag = [...shapes]; for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } }
      const shape = bag.pop(); return { matrix: shape.matrix.map((row) => [...row]), color: shape.color, x: 0, y: 0 };
    }
    function hits(matrix, x, y) {
      return matrix.some((row, dy) => row.some((filled, dx) => {
        if (!filled) return false;
        const px = x + dx, py = y + dy;
        return px < 0 || px >= cols || py >= rows || (py >= 0 && Boolean(board[py][px]));
      }));
    }
    function spawn() {
      current = nextShape(); current.x = Math.floor((cols - current.matrix[0].length) / 2); current.y = 0;
      if (hits(current.matrix, current.x, current.y)) status = 'fin';
    }
    function refresh() { info.textContent = `Nivel ${level}/10 · Filas ${lines}/40 · Puntos ${score}${status === 'fin' ? ' · Fin del juego' : status === 'victoria' ? ' · ¡Nivel 10 superado!' : ''}`; }
    function reset() {
      board = Array.from({ length: rows }, () => Array(cols).fill(null)); bag = []; lines = 0; score = 0; level = 1; status = 'jugando'; last = 0; accumulator = 0;
      spawn(); refresh(); draw();
    }
    function lock() {
      current.matrix.forEach((row, dy) => row.forEach((filled, dx) => { if (filled && current.y + dy >= 0) board[current.y + dy][current.x + dx] = current.color; }));
      let cleared = 0;
      for (let y = rows - 1; y >= 0; y--) if (board[y].every(Boolean)) { board.splice(y, 1); board.unshift(Array(cols).fill(null)); cleared++; y++; }
      if (cleared) { lines += cleared; score += [0, 100, 300, 500, 800][cleared] * level; level = Math.min(10, Math.floor(lines / 4) + 1); }
      if (lines >= 40) status = 'victoria'; else spawn();
      onResult(level, lines); refresh();
    }
    function move(dx) { if (status !== 'jugando') return; if (!hits(current.matrix, current.x + dx, current.y)) current.x += dx; draw(); }
    function down() { if (status !== 'jugando') return; if (!hits(current.matrix, current.x, current.y + 1)) current.y++; else lock(); draw(); }
    function rotate() {
      if (status !== 'jugando') return;
      const turned = current.matrix[0].map((_, x) => current.matrix.map((row) => row[x]).reverse());
      for (const offset of [0, -1, 1, -2, 2]) if (!hits(turned, current.x + offset, current.y)) { current.matrix = turned; current.x += offset; break; }
      draw();
    }
    function drop() { if (status !== 'jugando') return; while (!hits(current.matrix, current.x, current.y + 1)) current.y++; lock(); draw(); }
    function block(x, y, color) {
      ctx.fillStyle = color; ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      ctx.fillStyle = '#ffffff55'; ctx.fillRect(x * cell + 2, y * cell + 2, cell - 4, 3);
    }
    function draw() {
      ctx.fillStyle = '#2d2834'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#ffffff12';
      for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(x * cell + .5, 0); ctx.lineTo(x * cell + .5, canvas.height); ctx.stroke(); }
      for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * cell + .5); ctx.lineTo(canvas.width, y * cell + .5); ctx.stroke(); }
      board.forEach((row, y) => row.forEach((color, x) => { if (color) block(x, y, color); }));
      if (current) current.matrix.forEach((row, y) => row.forEach((filled, x) => { if (filled) block(current.x + x, current.y + y, current.color); }));
      if (status !== 'jugando') {
        ctx.fillStyle = '#211b27d9'; ctx.fillRect(0, 185, canvas.width, 105);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 21px sans-serif'; ctx.fillText(status === 'victoria' ? '¡Ganaste!' : 'Fin del juego', 120, 226);
        ctx.font = '13px sans-serif'; ctx.fillText('Pulsa ↻ para volver a jugar', 120, 252);
      }
    }
    function tick(timestamp) {
      if (disposed) return;
      if (!last) last = timestamp;
      const delta = Math.min(timestamp - last, 100); last = timestamp;
      if (status === 'jugando' && !document.hidden) {
        accumulator += delta;
        const interval = Math.max(95, 800 - (level - 1) * 78);
        if (accumulator >= interval) { down(); accumulator = 0; }
      }
      frameId = requestAnimationFrame(tick);
    }
    function key(event) {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) return;
      event.preventDefault();
      ({ ArrowLeft: () => move(-1), ArrowRight: () => move(1), ArrowUp: rotate, ArrowDown: down, ' ': drop })[event.key]();
    }
    controls.append(control('←', 'Mover a la izquierda', () => move(-1)), control('↻', 'Girar pieza', rotate), control('→', 'Mover a la derecha', () => move(1)), control('↓', 'Bajar pieza', down), control('⤓', 'Soltar pieza', drop));
    window.addEventListener('keydown', key); reset(); frameId = requestAnimationFrame(tick);
    return () => { disposed = true; cancelAnimationFrame(frameId); window.removeEventListener('keydown', key); };
  }

  function mountBird(host, onResult) {
    const canvas = el('canvas', 'arcade-canvas bird-canvas'); canvas.width = 320; canvas.height = 440;
    canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Pajarito volando entre obstáculos');
    const ctx = canvas.getContext('2d');
    const statusLine = el('p', 'arcade-stats'); statusLine.setAttribute('role', 'status');
    const hint = el('p', 'arcade-hint', 'Toca la pantalla, pulsa espacio o usa el botón Volar. Evita los obstáculos y supera tu marca.');
    const flapButton = control('Volar ↑', 'Hacer volar al pajarito', flap);
    const wrap = el('div', 'arcade-layout'); const side = el('div', 'arcade-side');
    side.append(statusLine, hint, flapButton); wrap.append(canvas, side); host.append(wrap);
    let bird, pipes, score, mode = 'lista', spawnTimer, last = 0, frameId, disposed = false;
    function reset() { bird = { x: 72, y: 205, velocity: 0 }; pipes = []; score = 0; spawnTimer = 0; mode = 'lista'; statusLine.textContent = 'Puntos: 0 · Toca para empezar'; draw(); }
    function flap() {
      if (mode === 'fin') reset();
      mode = 'volando'; bird.velocity = -300;
      statusLine.textContent = `Puntos: ${score}`;
    }
    function addPipe() { const center = 125 + Math.random() * 165; pipes.push({ x: 320, top: center - 66, bottom: center + 66, scored: false }); }
    function finish() { if (mode === 'fin') return; mode = 'fin'; statusLine.textContent = `Puntos: ${score} · Fin del vuelo. Toca para reintentar.`; onResult(score); }
    function update(dt) {
      if (mode !== 'volando' || document.hidden) return;
      bird.velocity += 860 * dt; bird.y += bird.velocity * dt;
      spawnTimer += dt; if (spawnTimer >= 1.5) { spawnTimer = 0; addPipe(); }
      pipes.forEach((pipe) => { pipe.x -= 145 * dt;
        if (!pipe.scored && pipe.x + 54 < bird.x - 12) { pipe.scored = true; score++; statusLine.textContent = `Puntos: ${score}`; onResult(score); }
        if (bird.x + 12 > pipe.x && bird.x - 12 < pipe.x + 54 && (bird.y - 12 < pipe.top || bird.y + 12 > pipe.bottom)) finish();
      });
      pipes = pipes.filter((pipe) => pipe.x > -60);
      if (bird.y < 14 || bird.y > 402) finish();
    }
    function draw() {
      const sky = ctx.createLinearGradient(0, 0, 0, 440); sky.addColorStop(0, '#d7eaf0'); sky.addColorStop(1, '#f8e8da'); ctx.fillStyle = sky; ctx.fillRect(0, 0, 320, 440);
      ctx.fillStyle = '#ffffff9e'; for (const [x, y] of [[45, 60], [230, 100], [120, 260]]) { ctx.beginPath(); ctx.ellipse(x, y, 29, 11, 0, 0, 7); ctx.fill(); }
      for (const pipe of pipes) {
        ctx.fillStyle = '#8d637a'; ctx.fillRect(pipe.x, 0, 54, pipe.top); ctx.fillRect(pipe.x, pipe.bottom, 54, 414 - pipe.bottom);
        ctx.fillStyle = '#aa7b91'; ctx.fillRect(pipe.x - 4, pipe.top - 14, 62, 14); ctx.fillRect(pipe.x - 4, pipe.bottom, 62, 14);
        ctx.fillStyle = '#ffffff38'; ctx.fillRect(pipe.x + 8, 0, 6, pipe.top - 15); ctx.fillRect(pipe.x + 8, pipe.bottom + 14, 6, 414 - pipe.bottom);
      }
      ctx.fillStyle = '#8eb09a'; ctx.fillRect(0, 414, 320, 26); ctx.fillStyle = '#729887'; ctx.fillRect(0, 414, 320, 5);
      ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(Math.max(-.5, Math.min(.9, bird.velocity / 450)));
      ctx.fillStyle = '#d68a79'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 12, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#f0b7a2'; ctx.beginPath(); ctx.ellipse(-5, 5, 8, 5, -.3, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6, -4, 4, 0, 7); ctx.fill(); ctx.fillStyle = '#332b31'; ctx.beginPath(); ctx.arc(7, -4, 2, 0, 7); ctx.fill();
      ctx.fillStyle = '#e2a258'; ctx.beginPath(); ctx.moveTo(13, 1); ctx.lineTo(22, 4); ctx.lineTo(13, 7); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#443442'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(score), 160, 45);
      if (mode !== 'volando') {
        ctx.fillStyle = '#fffdf5df'; ctx.fillRect(31, 164, 258, 90); ctx.fillStyle = '#523c49'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(mode === 'fin' ? '¡Inténtalo de nuevo!' : '¡A volar!', 160, 199);
        ctx.font = '13px sans-serif'; ctx.fillText('Toca o pulsa espacio', 160, 225);
      }
    }
    function tick(timestamp) { if (disposed) return; if (!last) last = timestamp; update(Math.min((timestamp - last) / 1000, .04)); last = timestamp; draw(); frameId = requestAnimationFrame(tick); }
    function key(event) { if (event.key !== ' ' && event.key !== 'ArrowUp') return; event.preventDefault(); flap(); }
    canvas.addEventListener('pointerdown', flap); window.addEventListener('keydown', key);
    reset(); frameId = requestAnimationFrame(tick);
    return () => { disposed = true; cancelAnimationFrame(frameId); window.removeEventListener('keydown', key); };
  }
  return { mountTetris, mountBird };
})();
