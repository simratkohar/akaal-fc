/* =========================================================
   VISUELS À PARTAGER (image générée dans le navigateur)
   Compo du match : format story 1080×1920, noir et or.
   ========================================================= */

const VIS = { noir: '#0A0A0B', carte: '#1E1E23', or: '#C9A24A', or2: '#E6C66A', creme: '#F5F1E6', gris: '#A9A9B1' };

function chargerImage(src, crossOrigin) {
  return new Promise(ok => {
    if (!src) return ok(null);
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}
function rectArrondi(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function texteAjuste(ctx, txt, maxW, taille, police) {
  let t = taille;
  do { ctx.font = police.replace('{t}', t); t -= 2; } while (ctx.measureText(txt).width > maxW && t > 12);
  return txt;
}
function fondClub(ctx, W, H) {
  ctx.fillStyle = VIS.noir; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.05; ctx.fillStyle = '#fff';
  for (let i = -H; i < W + H; i += 140) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 70, 0); ctx.lineTo(i + 70 - H, H); ctx.lineTo(i - H, H); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  const g = ctx.createRadialGradient(W / 2, 380, 0, W / 2, 380, 760);
  g.addColorStop(0, 'rgba(201,162,74,.28)'); g.addColorStop(1, 'rgba(201,162,74,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  [[0, 12], [H - 12, 12]].forEach(([y, h]) => {
    ctx.fillStyle = '#1E4FBF'; ctx.fillRect(0, y, W / 3, h);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(W / 3, y, W / 3, h);
    ctx.fillStyle = '#ED2939'; ctx.fillRect(2 * W / 3, y, W / 3 + 1, h);
  });
}
function avatarRond(ctx, cx, cy, r, img, initiales, bordure = VIS.or) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2); ctx.fillStyle = bordure; ctx.fill();
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  if (img) {
    const c = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - c) / 2, (img.height - c) / 2, c, c, cx - r, cy - r, 2 * r, 2 * r);
  } else {
    ctx.fillStyle = '#2B2B31'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    ctx.fillStyle = VIS.or2; ctx.font = `${Math.round(r * 0.95)}px "Bebas Neue"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(initiales, cx, cy + r * 0.06);
  }
  ctx.restore();
}

/* Dessine la compo d'un match. avecPhotosGoogle = false si le navigateur refuse les photos d'un autre site. */
async function dessinerCompo(mid, avecPhotosGoogle = true) {
  const m = Store.get('matchs', mid), c = m.compo, a = adv(m), l = lieuDe(m);
  await Promise.all(['80px "Bebas Neue"', '800 40px Manrope', '700 40px Manrope'].map(f => document.fonts.load(f).catch(() => {})));
  const logo = await chargerImage('assets/logo-256.png');
  const W = 1080, H = 1920, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  fondClub(ctx, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';

  // En-tête : écusson + « COMPO DU MATCH »
  if (logo) { ctx.save(); ctx.shadowColor = 'rgba(201,162,74,.45)'; ctx.shadowBlur = 50; ctx.drawImage(logo, W / 2 - 90, 70, 180, 180); ctx.restore(); }
  ctx.fillStyle = VIS.or2; ctx.font = '800 30px Manrope';
  ctx.fillText('C O M P O   D U   M A T C H', W / 2, 300);
  ctx.fillStyle = VIS.creme;
  texteAjuste(ctx, `AKAAL FC  vs  ${a.nom.toUpperCase()}`, W - 140, 96, '{t}px "Bebas Neue"');
  ctx.fillText(`AKAAL FC  vs  ${a.nom.toUpperCase()}`, W / 2, 400);

  // Chips : type + format + formation
  const chips = [typeCourt(m).toUpperCase(), `FOOT À ${m.format}`, c.formation];
  ctx.font = '800 28px Manrope';
  const largeurs = chips.map(t => ctx.measureText(t).width + 44), total = largeurs.reduce((s, w) => s + w, 0) + 16 * (chips.length - 1);
  let x = W / 2 - total / 2;
  chips.forEach((t, i) => {
    rectArrondi(ctx, x, 432, largeurs[i], 56, 12);
    ctx.fillStyle = i === 0 ? VIS.or : '#26262C'; ctx.fill();
    if (i) { ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = i === 0 ? VIS.noir : VIS.creme; ctx.fillText(t, x + largeurs[i] / 2, 470);
    x += largeurs[i] + 16;
  });
  ctx.fillStyle = VIS.gris; ctx.font = '700 32px Manrope';
  const infos = [maj1(fmtJour(m.date)) + ' · ' + fmtHeure(m.date), l?.nom].filter(Boolean).join(' · ');
  texteAjuste(ctx, infos, W - 140, 32, '700 {t}px Manrope'); ctx.fillText(infos, W / 2, 550);

  // Terrain
  const PX = 150, PY = 600, PW = 780, PH = 1000;
  rectArrondi(ctx, PX, PY, PW, PH, 28);
  const gt = ctx.createLinearGradient(0, PY, 0, PY + PH); gt.addColorStop(0, '#16201A'); gt.addColorStop(1, '#0F1712');
  ctx.fillStyle = gt; ctx.fill();
  ctx.save(); ctx.clip();
  for (let i = 0; i < 8; i++) if (i % 2) { ctx.fillStyle = 'rgba(255,255,255,.025)'; ctx.fillRect(PX, PY + i * PH / 8, PW, PH / 8); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(201,162,74,.5)'; ctx.lineWidth = 3;
  rectArrondi(ctx, PX, PY, PW, PH, 28); ctx.stroke();
  const m4 = 30;
  ctx.strokeRect(PX + m4, PY + m4, PW - 2 * m4, PH - 2 * m4);
  ctx.beginPath(); ctx.moveTo(PX + m4, PY + PH / 2); ctx.lineTo(PX + PW - m4, PY + PH / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(PX + PW / 2, PY + PH / 2, 95, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(PX + PW * 0.25, PY + m4, PW * 0.5, 150);
  ctx.strokeRect(PX + PW * 0.25, PY + PH - m4 - 150, PW * 0.5, 150);

  // Joueurs
  const slots = emplacements(c.formation);
  for (const s of slots) {
    const jid = c.postes?.[s.id], j = joueur(jid);
    const cx = PX + PW * s.x / 100, cy = PY + 110 + (PH - 300) * ((s.y - 16) / (90 - 16)); // de l'attaque (y≈16) au gardien (y=90), étiquettes comprises
    if (!j) {
      ctx.save(); ctx.setLineDash([10, 8]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, 54, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      ctx.fillStyle = VIS.gris; ctx.font = '800 24px Manrope'; ctx.fillText(s.role, cx, cy + 10);
      continue;
    }
    const src = j.photo || (avecPhotosGoogle ? j.photoGoogle : null);
    const img = await chargerImage(src, src && !src.startsWith('data:'));
    avatarRond(ctx, cx, cy, 54, img, initiales(j.nom));
    const nom = prenom(jid).toUpperCase() + (j.role === 'capitaine' ? ' (C)' : '');
    ctx.font = '800 28px Manrope';
    const nw = Math.min(ctx.measureText(nom).width + 30, 230);
    rectArrondi(ctx, cx - nw / 2, cy + 68, nw, 46, 10); ctx.fillStyle = 'rgba(8,8,8,.88)'; ctx.fill();
    ctx.fillStyle = VIS.creme; texteAjuste(ctx, nom, nw - 20, 28, '800 {t}px Manrope'); ctx.fillText(nom, cx, cy + 101);
    ctx.fillStyle = VIS.or; ctx.font = '800 20px Manrope'; ctx.fillText(s.role, cx, cy + 138);
  }

  // Remplaçants
  const remp = (c.remplacants || []).filter(joueur);
  ctx.fillStyle = VIS.or2; ctx.font = '800 28px Manrope';
  ctx.fillText(remp.length ? 'R E M P L A Ç A N T S' : '', W / 2, 1665);
  if (remp.length) {
    ctx.fillStyle = VIS.creme;
    const t = remp.map(prenom).join('  ·  ');
    texteAjuste(ctx, t, W - 160, 38, '700 {t}px Manrope'); ctx.fillText(t, W / 2, 1720);
  }
  // Pied
  ctx.fillStyle = VIS.or2; ctx.font = '44px "Bebas Neue"';
  ctx.fillText('AKAAL FC  ·  EST. 2019', W / 2, 1830);
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.font = '700 24px Manrope';
  ctx.fillText(location.host || 'akaal-fc.web.app', W / 2, 1868);
  return cv;
}

function canvasEnFichier(cv, nom) {
  return new Promise((ok, ko) => {
    try { cv.toBlob(b => b ? ok(new File([b], nom, { type: 'image/png' })) : ko(new Error('Image vide')), 'image/png'); }
    catch (e) { ko(e); }
  });
}

async function partagerCompo(mid) {
  toast('Préparation de l’image…');
  const nom = `compo-akaal-fc-${(Store.get('matchs', mid)?.date || '').slice(0, 10)}.png`;
  let fichier;
  try { fichier = await canvasEnFichier(await dessinerCompo(mid, true), nom); }
  catch { fichier = await canvasEnFichier(await dessinerCompo(mid, false), nom); } // photo Google refusée : on refait sans
  if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
    try { await navigator.share({ files: [fichier], title: 'Compo Akaal FC' }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  // Pas de partage de fichier (ordinateur) : on télécharge l'image
  const url = URL.createObjectURL(fichier), a = document.createElement('a');
  a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('Image téléchargée ✓');
}
