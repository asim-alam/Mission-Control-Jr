import {bounds, ground, routes, sites} from './region.js';

export function regionalMap(canvas, markers, onSelect) {
  const ctx = canvas.getContext('2d');
  const {width, height} = canvas;
  const inset = 24;
  const spanX = bounds.maxX - bounds.minX;
  const spanZ = bounds.maxZ - bounds.minZ;
  const project = ({x, z}) => ({
    x: inset + (x - bounds.minX) / spanX * (width - 2 * inset),
    y: inset + (z - bounds.minZ) / spanZ * (height - 2 * inset),
  });
  const background = document.createElement('canvas');
  background.width = width;
  background.height = height;
  const base = background.getContext('2d');
  const step = 4;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const east = bounds.minX + (x - inset) / (width - 2 * inset) * spanX;
      const south = bounds.minZ + (y - inset) / (height - 2 * inset) * spanZ;
      const altitude = ground(east, south);
      const shade = Math.max(-.23, Math.min(.2, (altitude - ground(east - 3, south - 3)) * .08));
      const contour = altitude % 4.6 < .55 ? -.09 : 0;
      const light = Math.floor(23 + altitude * .55 + (shade + contour) * 34);
      base.fillStyle = `hsl(${23 + altitude * .18}, 28%, ${light}%)`;
      base.fillRect(x, y, step, step);
    }
  }
  base.strokeStyle = '#f5d6ac19';
  base.lineWidth = 1;
  for (let x = 28; x < width; x += 54) {
    base.beginPath();
    base.moveTo(x, 0);
    base.lineTo(x, height);
    base.stroke();
  }
  for (let y = 24; y < height; y += 54) {
    base.beginPath();
    base.moveTo(0, y);
    base.lineTo(width, y);
    base.stroke();
  }
  function stroke(context, points, color, width, pattern = []) {
    context.beginPath();
    for (const [index, point] of points.entries()) {
      const p = project(point);
      if (index) context.lineTo(p.x, p.y);
      else context.moveTo(p.x, p.y);
    }
    context.strokeStyle = color;
    context.lineWidth = width;
    context.setLineDash(pattern);
    context.stroke();
    context.setLineDash([]);
  }
  for (const route of routes) stroke(base, route.points, '#e5bb827e', 2.25, route.name === 'Service cut' ? [4, 4] : []);
  const buttons = {};
  for (const [id, site] of Object.entries(sites)) {
    const pos = project(site);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = site.name;
    button.style.left = `${pos.x / width * 100}%`;
    button.style.top = `${pos.y / height * 100}%`;
    button.style.setProperty('--site-color', site.color);
    button.setAttribute('aria-pressed', 'false');
    button.onclick = () => onSelect(id);
    markers.append(button);
    buttons[id] = button;
    base.fillStyle = site.color;
    base.beginPath();
    base.arc(pos.x, pos.y, 5.1, 0, Math.PI * 2);
    base.fill();
  }

  return {
    select(id) {
      for (const [key, button] of Object.entries(buttons)) button.setAttribute('aria-pressed', String(id === key));
    },
    draw(state, plan, eva) {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(background, 0, 0);
      if (plan) stroke(ctx, plan.points, '#f3cd92', 4);
      const pos = project(state);
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(-state.heading + Math.PI);
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(8, 7);
      ctx.lineTo(0, 4);
      ctx.lineTo(-8, 7);
      ctx.closePath();
      ctx.strokeStyle = '#221b17';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#fff6e5';
      ctx.fill();
      ctx.restore();
      if (eva) {
        const suit = project(eva);
        ctx.beginPath();
        ctx.arc(suit.x, suit.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#8fe9ff';
        ctx.fill();
        ctx.strokeStyle = '#221b17';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    },
  };
}
