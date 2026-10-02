/* Dos juegos originales sin dependencias, con controles de teclado y pantalla táctil. */
(() => {
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function record(key) {
    try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; }
  }
  function saveRecord(key, value) {
    try { localStorage.setItem(key, String(value)); } catch { /* El juego también funciona sin almacenamiento. */ }
  }
  function canvasGame(host, width, height, label, hintText) {
    const wrap = create('div', 'wide-arcade');
    const canvas = create('canvas', 'arcade-canvas wide-arcade-canvas');
    canvas.width = width; canvas.height = height;
    canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', label);
    const side = create('div', 'wide-arcade-footer');
    const stats = create('p', 'arcade-stats'); stats.setAttribute('role', 'status');
    const hint = create('p', 'arcade-hint', hintText);
    const buttons = create('div', 'arcade-controls wide-controls');
    side.append(stats, hint, buttons); wrap.append(canvas, side); host.append(wrap);
    return { canvas, ctx: canvas.getContext('2d'), stats, buttons };
  }
  function action(label, onClick) {
    const button = create('button', 'secondary arcade-action', label);
    button.type = 'button'; button.addEventListener('click', onClick);
    return button;
  }
  function hold(label, aria, onDown, onUp) {
    const button = create('button', 'game-control hold-control', label);
    button.type = 'button'; button.setAttribute('aria-label', aria);
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault(); button.setPointerCapture(event.pointerId); onDown();
    });
    button.addEventListener('pointerup', onUp);
    button.addEventListener('pointercancel', onUp);
    button.addEventListener('lostpointercapture', onUp);
    return button;
  }
  function heart(ctx, x, y, size, color = '#d85878') {
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 22, size / 22);
    ctx.beginPath(); ctx.moveTo(0, 9);
    ctx.bezierCurveTo(-25, -7, -9, -17, 0, -7);
    ctx.bezierCurveTo(9, -17, 25, -7, 0, 9);
    ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }

  function mountRoses(host, onResult) {
    const { canvas, ctx, stats, buttons } = canvasGame(host, 720, 400,
      'Rosas cayendo hacia una cesta; evita las espinas',
      'Mueve la cesta con el dedo o el ratón. También puedes mantener pulsados ← y →. Recoge rosas y esquiva espinas.');
    const bestKey = 'invitacion-rosas-record';
    const input = { left: false, right: false };
    let basket = 360, objects = [], score = 0, lives = 3, time = 45, spawn = 0;
    let mode = 'ready', best = record(bestKey), last = 0, frameId, disposed = false;
    const begin = action('Empezar partida', start);
    buttons.append(
      hold('←', 'Mover cesta a la izquierda', () => { input.left = true; }, () => { input.left = false; }),
      hold('→', 'Mover cesta a la derecha', () => { input.right = true; }, () => { input.right = false; }),
      begin
    );
    function refresh() {
      const line = `Rosas: ${score} · Vidas: ${lives} · Tiempo: ${Math.ceil(time)} s · Récord: ${best}`;
      if (stats.textContent !== line) stats.textContent = line;
    }
    function start() {
      basket = 360; objects = []; score = 0; lives = 3; time = 45; spawn = 0;
      input.left = false; input.right = false; mode = 'playing'; begin.textContent = 'Reiniciar';
      refresh();
    }
    function finish() {
      if (mode !== 'playing') return;
      mode = 'over'; best = Math.max(best, score); saveRecord(bestKey, best);
      begin.textContent = 'Jugar otra vez'; onResult(score); refresh();
    }
    function aim(event) {
      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      basket = clamp((event.clientX - bounds.left) * canvas.width / bounds.width, 38, 682);
    }
    function keyDown(event) {
      if (!['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) return;
      event.preventDefault(); input[['ArrowLeft', 'a', 'A'].includes(event.key) ? 'left' : 'right'] = true;
    }
    function keyUp(event) {
      if (['ArrowLeft', 'a', 'A'].includes(event.key)) input.left = false;
      if (['ArrowRight', 'd', 'D'].includes(event.key)) input.right = false;
    }
    function update(dt) {
      if (mode !== 'playing' || document.hidden) return;
      time = Math.max(0, time - dt);
      basket = clamp(basket + (Number(input.right) - Number(input.left)) * 440 * dt, 38, 682);
      const difficulty = 1 + (45 - time) / 22;
      spawn += dt;
      if (spawn >= Math.max(.27, .78 - (45 - time) * .011)) {
        spawn = 0;
        objects.push({ x: 35 + Math.random() * 650, y: -22,
          speed: (125 + Math.random() * 75) * difficulty, thorn: Math.random() < .26, angle: Math.random() * 6 });
      }
      for (const item of objects) {
        item.y += item.speed * dt; item.angle += dt * 1.8;
        if (item.y > 333 && item.y < 375 && Math.abs(item.x - basket) < 45) {
          item.y = 500;
          if (item.thorn) lives--; else score++;
        }
      }
      objects = objects.filter((item) => item.y < 425);
      if (lives <= 0 || time <= 0) finish();
      refresh();
    }
    function draw() {
      const sky = ctx.createLinearGradient(0, 0, 0, 400);
      sky.addColorStop(0, '#f4dce4'); sky.addColorStop(1, '#fff7e7');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 720, 400);
      for (let i = 0; i < 7; i++) {
        const x = 65 + i * 106;
        ctx.fillStyle = '#ffffff9e'; ctx.beginPath(); ctx.ellipse(x, 70 + (i % 3) * 44, 35, 10, 0, 0, 7); ctx.fill();
      }
      ctx.fillStyle = '#9dbb9b'; ctx.fillRect(0, 377, 720, 23);
      ctx.fillStyle = '#7ca483'; ctx.fillRect(0, 377, 720, 5);
      for (const item of objects) {
        ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(item.angle);
        if (item.thorn) {
          ctx.fillStyle = '#514455';
          for (let i = 0; i < 5; i++) {
            ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.moveTo(0, -19);
            ctx.lineTo(6, -5); ctx.lineTo(-6, -5); ctx.fill();
          }
          ctx.fillStyle = '#8a6470'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill();
        } else {
          ctx.fillStyle = '#81aa80'; ctx.fillRect(-2, 4, 4, 16);
          ctx.beginPath(); ctx.ellipse(6, 12, 8, 4, -.5, 0, 7); ctx.fill();
          heart(ctx, 0, -3, 23, '#cb5372');
          ctx.fillStyle = '#e995a6'; ctx.beginPath(); ctx.arc(-3, -7, 5, 0, 7); ctx.fill();
        }
        ctx.restore();
      }
      ctx.fillStyle = '#705060'; ctx.fillRect(basket - 42, 352, 84, 26);
      ctx.fillStyle = '#b87882'; ctx.fillRect(basket - 45, 347, 90, 10);
      ctx.strokeStyle = '#ead2bb'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(basket, 350, 33, Math.PI, 0); ctx.stroke();
      if (mode !== 'playing') {
        ctx.fillStyle = '#fffaf2ec'; ctx.fillRect(170, 125, 380, 140);
        ctx.textAlign = 'center'; ctx.fillStyle = '#684453';
        ctx.font = 'bold 28px Georgia,serif';
        ctx.fillText(mode === 'ready' ? 'Atrapa las rosas' : '¡Buen intento!', 360, 179);
        ctx.font = '17px sans-serif';
        ctx.fillText(mode === 'ready' ? 'Pulsa Empezar partida' : `${score} rosas · récord ${best}`, 360, 217);
      }
    }
    function tick(timestamp) {
      if (disposed) return;
      if (!last) last = timestamp;
      update(Math.min((timestamp - last) / 1000, .04)); last = timestamp;
      draw(); frameId = requestAnimationFrame(tick);
    }
    canvas.addEventListener('pointerdown', aim); canvas.addEventListener('pointermove', (event) => { if (event.pointerType === 'mouse' || event.buttons) aim(event); });
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp);
    refresh(); draw(); frameId = requestAnimationFrame(tick);
    return () => {
      disposed = true; cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp);
    };
  }

  const worlds = [
    { name: 'Jardín de las flores', sky: '#dbedf0', hill: '#b4d8c1', grass: '#88ad8c' },
    { name: 'Tarde de paseo', sky: '#f3e5dc', hill: '#d8bcb1', grass: '#a2b790' },
    { name: 'Bosque de luciérnagas', sky: '#e3dfec', hill: '#b2b1ce', grass: '#829e8c' },
    { name: 'Atardecer rosado', sky: '#f3d9d8', hill: '#d6aeb2', grass: '#aeac83' },
    { name: 'Camino a la sorpresa', sky: '#dbd6e9', hill: '#b6a9ce', grass: '#89a0a5' }
  ];
  const GROUND = 337;
  function buildWorld(level) {
    const ground = [{ x: 0, end: 490 }];
    for (let i = 1; i < 3 + level; i++) {
      const x = ground.at(-1).end + 68 + level * 5 + (i % 2) * 8;
      ground.push({ x, end: x + 380 + (i % 2) * 42 });
    }
    const width = ground.at(-1).end;
    const platforms = [], hearts = [], hazards = [], enemies = [];
    ground.forEach((part, i) => {
      if (i === 0) return;
      const px = part.x + 140, py = GROUND - 86 - level * 4;
      platforms.push({ x: px, y: py, w: 105 });
      hearts.push({ x: part.x + 70, y: GROUND - 48, hidden: false, taken: false });
      hearts.push({ x: px + 53, y: py - 41, hidden: true, revealed: false, taken: false });
      if (part.end - part.x > 310) {
        hazards.push({ x: part.x + 280, y: GROUND - 20, w: 27, h: 20 });
        if (level >= 3 && i % 2 === 0) enemies.push({ x: part.x + 320, base: part.x + 320, range: 32, phase: i });
      }
    });
    return { width, ground, platforms, hearts, hazards, enemies, goal: width - 78 };
  }
  function mountPlatform(host, onResult) {
    const { canvas, ctx, stats, buttons } = canvasGame(host, 720, 400,
      'Juego de plataformas de cinco niveles con corazones ocultos',
      '← → o A/D para moverte; espacio, ↑ o W para saltar. En teléfono mantén los botones. Busca corazones cerca de las flores.');
    const input = { left: false, right: false };
    let level = 1, lives = 3, total = 0, levelStartHearts = 0, world = buildWorld(1);
    let player = { x: 60, y: GROUND - 36, w: 27, h: 36, vx: 0, vy: 0, grounded: true, coyote: 0, jump: 0, shield: 0 };
    let camera = 0, checkpoint = 60, mode = 'ready', last = 0, frameId, disposed = false;
    const mainButton = action('Empezar aventura', () => {
      if (mode === 'clear') next(); else if (mode === 'over') retry(); else start();
    });
    buttons.append(
      hold('←', 'Caminar a la izquierda', () => { input.left = true; }, () => { input.left = false; }),
      hold('↑', 'Saltar', () => { player.jump = .16; }, () => {}),
      hold('→', 'Caminar a la derecha', () => { input.right = true; }, () => { input.right = false; }),
      mainButton
    );
    function refresh() {
      const line = `Nivel ${level}/5 · ${worlds[level - 1].name} · Vidas ${lives} · Corazones ${total}`;
      if (stats.textContent !== line) stats.textContent = line;
    }
    function resetPlayer() {
      player = { x: checkpoint, y: GROUND - 36, w: 27, h: 36, vx: 0, vy: 0,
        grounded: true, coyote: .1, jump: 0, shield: 1.1 };
      input.left = false; input.right = false;
    }
    function start() {
      level = 1; lives = 3; total = 0; levelStartHearts = 0; world = buildWorld(level); checkpoint = 60; camera = 0;
      resetPlayer(); mode = 'playing'; mainButton.textContent = 'Reiniciar aventura'; refresh();
    }
    function next() {
      if (mode !== 'clear') return;
      level++; lives = Math.min(3, lives + 1); levelStartHearts = total; world = buildWorld(level);
      checkpoint = 60; camera = 0; resetPlayer(); mode = 'playing';
      mainButton.textContent = 'Reiniciar aventura'; refresh();
    }
    function retry() {
      total = levelStartHearts; lives = 3; world = buildWorld(level);
      checkpoint = 60; camera = 0; resetPlayer(); mode = 'playing';
      mainButton.textContent = 'Reiniciar aventura'; onResult(level, total, false); refresh();
    }
    function keyDown(event) {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'a', 'A', 'd', 'D', 'w', 'W'].includes(event.key)) return;
      event.preventDefault();
      if (['ArrowLeft', 'a', 'A'].includes(event.key)) input.left = true;
      if (['ArrowRight', 'd', 'D'].includes(event.key)) input.right = true;
      if (['ArrowUp', ' ', 'w', 'W'].includes(event.key) && !event.repeat) player.jump = .16;
    }
    function keyUp(event) {
      if (['ArrowLeft', 'a', 'A'].includes(event.key)) input.left = false;
      if (['ArrowRight', 'd', 'D'].includes(event.key)) input.right = false;
    }
    function loseLife() {
      if (player.shield > 0 || mode !== 'playing') return;
      lives--;
      if (lives <= 0) {
        mode = 'over'; mainButton.textContent = 'Reintentar nivel'; onResult(level, total, false);
      } else resetPlayer();
      refresh();
    }
    function update(dt, now) {
      if (mode !== 'playing' || document.hidden) return;
      player.shield = Math.max(0, player.shield - dt);
      player.coyote = Math.max(0, player.coyote - dt);
      player.jump = Math.max(0, player.jump - dt);
      if (player.jump > 0 && (player.grounded || player.coyote > 0)) {
        player.vy = -500; player.grounded = false; player.coyote = 0; player.jump = 0;
      }
      player.vx = (Number(input.right) - Number(input.left)) * (250 + level * 9);
      player.x = clamp(player.x + player.vx * dt, 0, world.width - player.w);
      const oldFoot = player.y + player.h;
      player.vy = Math.min(760, player.vy + 1150 * dt);
      player.y += player.vy * dt;
      let landing = Infinity;
      if (player.vy >= 0) {
        for (const surface of [...world.ground.map((part) => ({ x: part.x, w: part.end - part.x, y: GROUND })), ...world.platforms]) {
          if (oldFoot <= surface.y + 5 && player.y + player.h >= surface.y &&
              player.x + player.w > surface.x + 3 && player.x < surface.x + surface.w - 3) {
            landing = Math.min(landing, surface.y);
          }
        }
      }
      const wasGrounded = player.grounded;
      player.grounded = landing !== Infinity;
      if (player.grounded) { player.y = landing - player.h; player.vy = 0; }
      if (wasGrounded && !player.grounded) player.coyote = .09;
      for (const part of world.ground) if (player.grounded && player.x >= part.x + 30 && player.x < part.end - 40) {
        checkpoint = Math.max(checkpoint, part.x + 26);
      }
      for (const item of world.hearts) {
        if (item.taken) continue;
        if (item.hidden && Math.abs(player.x + player.w / 2 - item.x) < 95) item.revealed = true;
        if ((!item.hidden || item.revealed) && Math.abs(player.x + player.w / 2 - item.x) < 25 &&
            Math.abs(player.y + player.h / 2 - item.y) < 29) {
          item.taken = true; total++; onResult(level, total, false); refresh();
        }
      }
      if (player.shield <= 0) {
        for (const spike of world.hazards) if (player.x + player.w > spike.x + 3 && player.x < spike.x + spike.w - 3 &&
            player.y + player.h > spike.y + 4 && player.y < spike.y + spike.h) loseLife();
        for (const enemy of world.enemies) {
          const ex = enemy.base + Math.sin(now / 550 + enemy.phase) * enemy.range;
          if (player.x + player.w > ex - 13 && player.x < ex + 13 && player.y + player.h > GROUND - 26 && player.y < GROUND) loseLife();
        }
      }
      if (player.y > 420) { player.shield = 0; loseLife(); }
      if (mode === 'playing' && player.x + player.w >= world.goal) {
        if (level === 5) {
          mode = 'won'; mainButton.textContent = 'Jugar otra vez'; onResult(5, total, true);
        } else {
          mode = 'clear'; mainButton.textContent = 'Siguiente nivel →'; onResult(level, total, false);
        }
      }
      camera = clamp(player.x - 215, 0, world.width - canvas.width);
      refresh();
    }
    function draw(now) {
      const theme = worlds[level - 1];
      ctx.fillStyle = theme.sky; ctx.fillRect(0, 0, 720, 400);
      ctx.fillStyle = '#ffffff85';
      for (let i = 0; i < 10; i++) {
        const x = ((i * 171 - camera * .22) % 900 + 900) % 900 - 70;
        ctx.beginPath(); ctx.ellipse(x, 55 + i % 3 * 36, 33, 11, 0, 0, 7); ctx.fill();
      }
      ctx.fillStyle = theme.hill;
      for (let i = -1; i < 7; i++) {
        const x = i * 165 - (camera * .35 % 165);
        ctx.beginPath(); ctx.arc(x, 370, 125, Math.PI, 0); ctx.fill();
      }
      ctx.save(); ctx.translate(-camera, 0);
      for (const part of world.ground) {
        ctx.fillStyle = '#8a6a6b'; ctx.fillRect(part.x, GROUND, part.end - part.x, 63);
        ctx.fillStyle = theme.grass; ctx.fillRect(part.x, GROUND, part.end - part.x, 11);
        ctx.fillStyle = '#ffffff22';
        for (let x = part.x + 40; x < part.end; x += 65) ctx.fillRect(x, GROUND + 29, 20, 4);
      }
      for (const platform of world.platforms) {
        ctx.fillStyle = '#9e7985'; ctx.fillRect(platform.x, platform.y, platform.w, 15);
        ctx.fillStyle = theme.grass; ctx.fillRect(platform.x, platform.y, platform.w, 6);
      }
      for (const spike of world.hazards) {
        ctx.fillStyle = '#58485b'; ctx.beginPath(); ctx.moveTo(spike.x, GROUND);
        ctx.lineTo(spike.x + spike.w / 2, spike.y); ctx.lineTo(spike.x + spike.w, GROUND); ctx.fill();
      }
      for (const enemy of world.enemies) {
        const x = enemy.base + Math.sin(now / 550 + enemy.phase) * enemy.range;
        ctx.fillStyle = '#6b5367'; ctx.beginPath(); ctx.arc(x, GROUND - 13, 13, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, GROUND - 21, 3, 4); ctx.fillRect(x + 3, GROUND - 21, 3, 4);
      }
      for (const item of world.hearts) {
        if (item.taken) continue;
        if (item.hidden && !item.revealed) {
          ctx.fillStyle = '#709b83'; ctx.beginPath(); ctx.ellipse(item.x, item.y + 12, 13, 7, -.4, 0, 7); ctx.fill();
        } else heart(ctx, item.x, item.y + Math.sin(now / 250 + item.x) * 3, 24, item.hidden ? '#e6a153' : '#d85878');
      }
      const goal = world.goal;
      ctx.fillStyle = '#775b70'; ctx.fillRect(goal, GROUND - 104, 6, 104);
      heart(ctx, goal + 21, GROUND - 95, 30, '#e7a369');
      ctx.fillStyle = '#fff7e7'; ctx.fillRect(goal + 5, GROUND - 92, 39, 29);
      ctx.fillStyle = '#946275'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('META', goal + 7, GROUND - 72);
      if (!(player.shield > 0 && Math.floor(now / 100) % 2 === 0)) {
        ctx.fillStyle = '#614959'; ctx.fillRect(player.x + 3, player.y + 24, 21, 12);
        ctx.fillStyle = '#c96c82'; ctx.fillRect(player.x, player.y + 10, 27, 18);
        ctx.fillStyle = '#f4c9ad'; ctx.fillRect(player.x + 4, player.y + 2, 20, 17);
        ctx.fillStyle = '#704e61'; ctx.fillRect(player.x + 1, player.y, 25, 7);
        ctx.fillStyle = '#44333c'; ctx.fillRect(player.x + 17, player.y + 10, 3, 3);
        ctx.fillStyle = '#edacb5'; ctx.fillRect(player.x + 23, player.y + 16, 7, 9);
      }
      ctx.restore();
      if (mode !== 'playing') {
        ctx.fillStyle = '#fff9f1ed'; ctx.fillRect(154, 105, 412, 168);
        ctx.fillStyle = '#684453'; ctx.textAlign = 'center'; ctx.font = 'bold 27px Georgia,serif';
        const title = mode === 'ready' ? 'Un paseo especial' : mode === 'clear' ? '¡Nivel completado!' :
          mode === 'won' ? '¡Llegaste a la sorpresa! ♡' : 'Inténtalo otra vez';
        ctx.fillText(title, 360, 161);
        ctx.font = '16px sans-serif';
        ctx.fillText(mode === 'ready' ? 'Cinco caminos para explorar' :
          mode === 'won' ? `Encontraste ${total} corazones. Gracias por jugar.` :
          mode === 'clear' ? `Te esperan más secretos en el nivel ${level + 1}.` :
          `Llegaste al nivel ${level} con ${total} corazones.`, 360, 199);
        ctx.font = '14px sans-serif';
        ctx.fillText(mode === 'clear' ? 'Pulsa Siguiente nivel' : mode === 'over' ? 'Reintenta este nivel' : 'Usa el botón para comenzar', 360, 236);
      }
    }
    function tick(timestamp) {
      if (disposed) return;
      if (!last) last = timestamp;
      update(Math.min((timestamp - last) / 1000, .032), timestamp); last = timestamp;
      draw(timestamp); frameId = requestAnimationFrame(tick);
    }
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp);
    refresh(); draw(0); frameId = requestAnimationFrame(tick);
    return () => {
      disposed = true; cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp);
    };
  }
  Object.assign(window.MiniGames, { mountRoses, mountPlatform });
})();
