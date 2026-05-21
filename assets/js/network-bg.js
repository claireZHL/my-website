(function() {
  const canvas = document.getElementById('network-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], mouse = {x:-999,y:-999}, activated = false;
  const N = 70, LINK_DIST = 120, MOUSE_LINK_DIST = 150, REPEL_DIST = 85;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkNode(x, y) {
    return {
      x: x ?? Math.random() * W,
      y: y ?? Math.random() * H,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      baseR: 3 + Math.random() * 2,
      displayAlpha: 0.6, targetAlpha: 0.6,
      displayR: 3, targetR: 3,
      party: Math.random() < 0.5 ? 'red' : 'blue',
      connections: 0,
    };
  }

  function getNeighbors(i) {
    const n = nodes[i], nb = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      if (Math.hypot(n.x - nodes[j].x, n.y - nodes[j].y) < LINK_DIST) nb.push(j);
    }
    return nb;
  }

  function updateNodeStates() {
    const connCounts = nodes.map((_, i) => getNeighbors(i).length);
    const maxConn = Math.max(1, ...connCounts);
    for (let i = 0; i < nodes.length; i++) {
      const nb = getNeighbors(i);
      nodes[i].connections = nb.length;
      const ratio = nb.length / maxConn;
      if (activated) {
        nodes[i].targetAlpha = 0.15 + ratio * 0.85;
        nodes[i].targetR = nodes[i].baseR + ratio * 6;
        const redCount = nb.filter(j => nodes[j].party === 'red').length;
        const blueCount = nb.filter(j => nodes[j].party === 'blue').length;
        if (nb.length > 0) {
          nodes[i].party = redCount >= blueCount ? 'red' : 'blue';
        }
      } else {
        nodes[i].targetAlpha = 0.6;
        nodes[i].targetR = nodes[i].baseR;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * 0.45;
          if (activated) {
            const ci = nodes[i].party, cj = nodes[j].party;
            ctx.strokeStyle = ci === cj
              ? (ci === 'red' ? `rgba(200,50,50,${alpha})` : `rgba(50,80,200,${alpha})`)
              : `rgba(150,150,150,${alpha * 0.4})`;
          } else {
            ctx.strokeStyle = `rgba(80,80,100,${alpha})`;
          }
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    if (mouse.x !== -999) {
      for (let i = 0; i < nodes.length; i++) {
        const dm = Math.hypot(nodes[i].x - mouse.x, nodes[i].y - mouse.y);
        if (dm < MOUSE_LINK_DIST) {
          const alpha = (1 - dm / MOUSE_LINK_DIST) * 0.65;
          ctx.strokeStyle = activated
            ? (nodes[i].party === 'red' ? `rgba(120,50,255,${alpha})` : `rgba(50,160,255,${alpha})`)
            : `rgba(50,90,210,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      n.displayAlpha += (n.targetAlpha - n.displayAlpha) * 0.06;
      n.displayR += (n.targetR - n.displayR) * 0.06;
      ctx.beginPath();
      ctx.arc(n.x, n.y, Math.max(1, n.displayR), 0, Math.PI * 2);
      ctx.fillStyle = activated
        ? (n.party === 'red' ? `rgba(210,50,50,${n.displayAlpha})` : `rgba(40,80,210,${n.displayAlpha})`)
        : `rgba(60,60,75,${n.displayAlpha})`;
      ctx.fill();
    }
  }

  let stateTimer = 0;
  function update() {
    stateTimer++;
    if (stateTimer % 18 === 0) updateNodeStates();
    for (const n of nodes) {
      const dm = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      if (dm < REPEL_DIST && dm > 0.1) {
        const force = (REPEL_DIST - dm) / REPEL_DIST * 1.2;
        n.vx += (n.x - mouse.x) / dm * force;
        n.vy += (n.y - mouse.y) / dm * force;
      }
      n.vx *= 0.985; n.vy *= 0.985;
      const speed = Math.hypot(n.vx, n.vy);
      if (speed > 4) { n.vx = n.vx / speed * 4; n.vy = n.vy / speed * 4; }
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx); }
      if (n.x > W) { n.x = W; n.vx = -Math.abs(n.vx); }
      if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy); }
      if (n.y > H) { n.y = H; n.vy = -Math.abs(n.vy); }
    }
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!activated) {
      activated = true;
      nodes.forEach(n => { n.party = Math.random() < 0.5 ? 'red' : 'blue'; });
      updateNodeStates();
    }
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = -999; mouse.y = -999;
    activated = false;
    updateNodeStates();
  });

  window.addEventListener('resize', () => { resize(); });

  resize();
  nodes = Array.from({length: N}, () => mkNode());
  updateNodeStates();
  loop();
})();
