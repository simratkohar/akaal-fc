/* =========================================================
   STORE : toutes les lectures / écritures de données passent ici.
   - Mode démo (pas de config Firebase) : données fictives
     gardées dans le navigateur (localStorage).
   - Mode Firebase : Firestore en temps réel + connexion Google.
   Le reste de l'app ne voit que Store.data, Store.set/patch/del.
   ========================================================= */

const COLLECTIONS = ['joueurs', 'profils', 'matchs', 'buts', 'presences', 'lieux', 'adversaires', 'paiements', 'votes', 'equipe'];
// Lisibles sans compte (lien visiteur ?voir) : pas d'e-mails ni de paiements
const PUBLIQUES = ['profils', 'matchs', 'buts', 'presences', 'lieux', 'adversaires', 'equipe']; // pas les votes : qui a noté qui reste dans l'équipe
const CHAMPS_PROFIL = ['nom', 'numero', 'poste', 'role', 'photo', 'photoGoogle'];
const CLE_DEMO = 'akaal-demo-v1';
const FB_VERSION = '10.12.2';

const CONFIG_DEFAUT = {
  nom: 'Akaal FC', championnat: 'FSGT', groupe: 'Football à 7 · 93 Groupe 1', couleurs: 'Noir & Or',
  saison: saisonDe(new Date().toISOString()), logo: null,
  votesHeures: 48, hdmMode: 'vote',
  limiteJours: 1, limiteHeure: '20:00', maxJoueurs: 0,
  convocation: { Championnat: null, Amical: null, Tournoi: null }
};

const nettoie = o => JSON.parse(JSON.stringify(o));

const Store = {
  mode: (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG) ? 'firebase' : 'demo',
  // ?voir (ou ancien ?demo) = visiteur : tout voir en direct, sans compte, sans rien modifier
  visiteur: !!(typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG) && ['voir', 'demo'].some(k => new URLSearchParams(location.search).has(k)),
  data: Object.fromEntries(COLLECTIONS.map(c => [c, {}])),
  user: null,     // compte Google connecté
  moi: null,      // id du joueur lié au compte
  role: null,     // 'capitaine' | 'joueur'
  etat: 'chargement', // chargement | connexion | non-lie | pret
  _cb: () => {},
  _unsubs: [],

  get capitaine() { return this.role === 'capitaine'; },
  config() { return { ...CONFIG_DEFAUT, ...(this.data.equipe.config || {}) }; },
  liste(col) { return Object.values(this.data[col]); },
  get(col, id) { return id ? this.data[col][id] : undefined; },
  surChangement(cb) { this._cb = cb; },
  _notifie() { this._cb(); },

  async init() {
    if (this.mode === 'demo') return this._initDemo();
    return this._initFirebase();
  },

  /* ---------------- Écritures ---------------- */
  async set(col, id, obj) { return this.batch([{ op: 'set', col, id, obj }]); },
  async patch(col, id, obj) { return this.batch([{ op: 'patch', col, id, obj }]); },
  async del(col, id) { return this.batch([{ op: 'del', col, id }]); },
  async batch(ops) {
    if (this.mode === 'demo') {
      ops.forEach(({ op, col, id, obj }) => {
        if (op === 'set') this.data[col][id] = { ...nettoie(obj), id };
        if (op === 'patch') this.data[col][id] = { ...(this.data[col][id] || {}), ...nettoie(obj), id };
        if (op === 'del') delete this.data[col][id];
      });
      this._sauveDemo(); this._notifie();
      return true;
    }
    try {
      const b = this.fs.batch();
      ops.forEach(({ op, col, id, obj }) => {
        const ref = this.fs.collection(col).doc(id);
        if (op === 'set') { const o = nettoie(obj); delete o.id; b.set(ref, o); }
        if (op === 'patch') { const o = nettoie(obj); delete o.id; b.update(ref, o); }
        if (op === 'del') b.delete(ref);
      });
      await b.commit();
      return true;
    } catch (e) {
      console.error(e);
      toast(e.code === 'permission-denied' ? 'Action non autorisée' : 'Erreur : ' + (e.message || e));
      return false;
    }
  },

  /* ---------------- Mode démo ---------------- */
  get visite() { return false; },
  _initDemo() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(CLE_DEMO)); } catch {}
    if (!d || !d.joueurs) d = donneesDemo();
    COLLECTIONS.forEach(c => this.data[c] = d[c] || {});
    const cap = this.liste('joueurs').find(j => j.role === 'capitaine');
    this.moi = cap?.id; this.role = 'capitaine'; this.user = { uid: 'demo', email: cap?.email, nom: cap?.nom, photo: null };
    this.etat = 'pret';
    this._notifie();
  },
  _sauveDemo() { try { localStorage.setItem(CLE_DEMO, JSON.stringify(this.data)); } catch {} },
  basculeDemo() { // capitaine ↔ vue d'un joueur (ou visiteur)
    const js = this.liste('joueurs');
    if (this.role === 'capitaine') {
      const j = this.visite ? null : (js.find(x => x.role !== 'capitaine' && x.numero === 5) || js.find(x => x.role !== 'capitaine'));
      this.moi = j?.id || null; this.role = 'joueur';
    } else {
      const c = js.find(x => x.role === 'capitaine'); this.moi = c?.id; this.role = 'capitaine';
    }
    this.user = { ...this.user, nom: this.get('joueurs', this.moi)?.nom || 'Visiteur' };
    this._notifie();
  },
  reinitDemo() { localStorage.removeItem(CLE_DEMO); location.reload(); },

  /* ---------------- Mode Firebase ---------------- */
  async _chargeScript(src) {
    return new Promise((ok, ko) => {
      const t = setTimeout(() => ko(new Error('Pas de connexion internet ? Impossible de joindre Firebase.')), 15000);
      const s = document.createElement('script'); s.src = src;
      s.onload = () => { clearTimeout(t); ok(); };
      s.onerror = () => { clearTimeout(t); ko(new Error('Pas de connexion internet ? Impossible de joindre Firebase.')); };
      document.head.appendChild(s);
    });
  },
  async _initFirebase() {
    const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}/`;
    await this._chargeScript(base + 'firebase-app-compat.js');
    await Promise.all([this._chargeScript(base + 'firebase-auth-compat.js'), this._chargeScript(base + 'firebase-firestore-compat.js')]);
    firebase.initializeApp(FIREBASE_CONFIG);
    this.auth = firebase.auth();
    this.fs = firebase.firestore();
    // Cache hors ligne ; désactivé si ce téléphone a déjà posé problème (voir _surCompte)
    let sansCache = false; try { sansCache = sessionStorage.getItem('akaal-sans-cache') === '1'; } catch {}
    if (!sansCache) { try { await this.fs.enablePersistence({ synchronizeTabs: true }); } catch {} }
    if (this.visiteur) { this.user = null; this.moi = null; this.role = 'visiteur'; return this._ecoute(PUBLIQUES); }
    try { await this.auth.getRedirectResult(); } catch (e) { console.warn(e); }
    this.auth.onAuthStateChanged(u => this._surCompte(u));
  },
  async connexionGoogle() {
    const p = new firebase.auth.GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    try { await this.auth.signInWithPopup(p); }
    catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code)) return this.auth.signInWithRedirect(p);
      if (e.code !== 'auth/popup-closed-by-user') toast('Connexion impossible : ' + (e.code || e.message));
    }
  },
  async deconnexion() {
    if (this.mode === 'demo') return toast('Mode démo : pas de compte');
    this._unsubs.forEach(f => f()); this._unsubs = [];
    await this.auth.signOut();
  },
  async _surCompte(u) {
    this._unsubs.forEach(f => f()); this._unsubs = [];
    COLLECTIONS.forEach(c => this.data[c] = {});
    if (!u) { this.user = null; this.moi = null; this.role = null; this.etat = 'connexion'; return this._notifie(); }
    this.user = { uid: u.uid, email: (u.email || '').toLowerCase(), nom: u.displayName, photo: u.photoURL };
    this.etat = 'chargement'; this._notifie();
    let etape = 'acces';
    try {
      let acces = await this.fs.collection('acces').doc(u.uid).get();
      if (!acces.exists) {
        // Première connexion : on cherche la fiche joueur créée par le capitaine avec cet e-mail
        etape = 'recherche';
        const q = await this.fs.collection('joueurs').where('email', '==', this.user.email).limit(1).get();
        if (q.empty) {
          try { this.equipeExiste = (await this.fs.collection('equipe').doc('config').get()).exists; } catch { this.equipeExiste = false; }
          this.etat = 'non-lie'; return this._notifie();
        }
        const j = q.docs[0];
        etape = 'liaison';
        await this.fs.collection('acces').doc(u.uid).set({ joueur: j.id, role: j.data().role || 'joueur', email: this.user.email });
        await this.fs.collection('joueurs').doc(j.id).update({ uid: u.uid, photoGoogle: u.photoURL || null });
        try { await this.fs.collection('profils').doc(j.id).update({ photoGoogle: u.photoURL || null }); } catch {}
        acces = await this.fs.collection('acces').doc(u.uid).get();
      }
      this.moi = acces.data().joueur; this.role = acces.data().role;
      this._ecoute();
    } catch (e) {
      console.error(etape, e);
      // Souci de cache sur certains téléphones : on recharge une fois sans le cache hors ligne
      let dejaEssaye = false; try { dejaEssaye = sessionStorage.getItem('akaal-sans-cache') === '1'; } catch {}
      if (['failed-precondition', 'unavailable'].includes(e.code) && !dejaEssaye) {
        try { sessionStorage.setItem('akaal-sans-cache', '1'); } catch {}
        return location.reload();
      }
      this.etat = 'non-lie'; this.erreur = (e.code || e.message) + ' · ' + etape; this._notifie();
    }
  },
  _ecoute(cols = COLLECTIONS) {
    let restants = cols.length;
    const fini = () => { if (restants > 0 && --restants === 0) { this.etat = 'pret'; this._syncProfils(); } };
    cols.forEach(col => {
      const un = this.fs.collection(col).onSnapshot(snap => {
        const o = {}; snap.forEach(d => o[d.id] = { ...d.data(), id: d.id });
        this.data[col] = o;
        if (this.visiteur && col === 'profils') this.data.joueurs = o; // le visiteur ne voit que les profils publics
        fini();
        if (this.etat === 'pret') { if (col === 'joueurs' || col === 'profils') this._syncProfils(); if (col === 'presences' || col === 'matchs') this._syncCompos(); this._notifie(); }
      }, e => { console.error(col, e); fini(); if (this.etat === 'pret') this._notifie(); });
      this._unsubs.push(un);
    });
  },
  /* Le capitaine tient les compos à jour avec les présences (un joueur ne peut pas écrire le match) */
  _syncCompos() {
    if (!this.capitaine || this.visiteur || typeof compoAJour !== 'function') return;
    clearTimeout(this._tCompo);
    this._tCompo = setTimeout(() => {
      const ops = [];
      this.liste('matchs').forEach(m => {
        if (!m.compo || m.joue) return;
        const n = compoAJour(m);
        if (!memeCompo(n, m.compo)) ops.push({ op: 'patch', col: 'matchs', id: m.id, obj: { compo: n } });
      });
      if (!ops.length) return;
      if (this.mode === 'demo') return this.batch(ops);
      const b = this.fs.batch();
      ops.forEach(o => b.update(this.fs.collection('matchs').doc(o.id), { compo: nettoie(o.obj.compo) }));
      b.commit().catch(e => console.warn('compo', e.code || e));
    }, 800);
  },
  /* Vote clos : le capitaine reporte l'homme du match élu sur le match (visible par les visiteurs) */
  _syncHdm() {
    if (!this.fs || typeof hommeDuMatch !== 'function') return;
    this.liste('matchs').forEach(m => {
      if (!m.joue || !m.votesFin || votesOuverts(m)) return;
      const h = hommeDuMatch(m);
      if (h && h !== m.hommeDuMatch) this.fs.collection('matchs').doc(m.id).update({ hommeDuMatch: h }).catch(e => console.warn('hdm', e.code || e));
    });
  },
  /* Le capitaine tient à jour la copie publique des fiches (sans e-mail) */
  _syncProfils() {
    if (!this.capitaine || this.visiteur) return;
    this._syncHdm();
    clearTimeout(this._tSync);
    this._tSync = setTimeout(() => {
      const ops = [];
      Object.values(this.data.joueurs).forEach(j => {
        const v = Object.fromEntries(CHAMPS_PROFIL.map(c => [c, j[c] ?? null])), p = this.data.profils[j.id];
        if (!p || CHAMPS_PROFIL.some(c => (p[c] ?? null) !== v[c])) ops.push({ op: 'set', col: 'profils', id: j.id, obj: v });
      });
      Object.keys(this.data.profils).forEach(id => { if (!this.data.joueurs[id]) ops.push({ op: 'del', col: 'profils', id }); });
      if (!ops.length) return;
      const b = this.fs.batch(); // silencieux : pas de message si les règles ne sont pas encore à jour
      ops.slice(0, 400).forEach(({ op, col, id, obj }) => op === 'del' ? b.delete(this.fs.collection(col).doc(id)) : b.set(this.fs.collection(col).doc(id), nettoie(obj)));
      b.commit().catch(e => console.warn('profils', e.code || e));
    }, 1500);
  },
  /* Premier lancement : le capitaine (e-mail autorisé dans les règles) crée l'équipe */
  async creerEquipe(nom, numero) {
    try {
      const ops = [], moiId = nouvelId();
      ops.push({ op: 'set', col: 'joueurs', id: moiId, obj: { nom, numero: +numero || 10, poste: 'Milieu', role: 'capitaine', email: this.user.email, uid: this.user.uid, photoGoogle: this.user.photo || null } });
      ops.push({ op: 'set', col: 'equipe', id: 'config', obj: { ...CONFIG_DEFAUT } });
      ops.push({ op: 'set', col: 'acces', id: this.user.uid, obj: { joueur: moiId, role: 'capitaine', email: this.user.email } });
      if (!(await this.batch(ops))) return;
      toast('Équipe créée ✓');
      return this._surCompte(this.auth.currentUser);
    } catch (e) { console.error(e); toast('Erreur : ' + e.message); }
  },
  /* Quand le capitaine change le rôle d'un joueur déjà connecté */
  async majAcces(joueur) {
    if (this.mode === 'demo' || !joueur.uid) return;
    try { await this.fs.collection('acces').doc(joueur.uid).set({ joueur: joueur.id, role: joueur.role || 'joueur', email: joueur.email || '' }); }
    catch (e) { console.error(e); }
  }
};

/* =========================================================
   Données fictives pour le mode démo
   ========================================================= */
function donneesDemo() {
  const d = Object.fromEntries(COLLECTIONS.map(c => [c, {}]));
  const jour = (n, h) => { const x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() + n); const [hh, mm] = h.split(':'); x.setHours(+hh, +mm); return x.toISOString(); };
  // Prochain lundi (championnat FSGT le lundi soir)
  const auj = new Date(); const dl = ((1 - auj.getDay()) + 7) % 7 || 7;
  const lundi = k => jour(dl + 7 * k, '20:45');

  const J = (id, nom, numero, poste, role = 'joueur') => d.joueurs[id] = { id, nom, numero, poste, role, email: nom.toLowerCase().split(' ')[0] + '@exemple.fr' };
  J('p1', 'Simratpal Singh', 10, 'Attaquant', 'capitaine');
  J('p2', 'Manpreet', 1, 'Gardien'); J('p3', 'Jaspreet', 4, 'Défenseur'); J('p4', 'Karan', 5, 'Défenseur');
  J('p5', 'Ravinder', 3, 'Défenseur'); J('p6', 'Gurvinder', 7, 'Milieu'); J('p7', 'Arjun', 8, 'Milieu');
  J('p8', 'Amandeep', 11, 'Milieu'); J('p9', 'Harpreet', 9, 'Attaquant'); J('p10', 'Navjot', 12, 'Défenseur');
  J('p11', 'Vikram', 14, 'Milieu'); J('p12', 'Sukhdev', 13, 'Attaquant');

  const L = (id, nom, adresse) => d.lieux[id] = { id, nom, adresse, maps: '' };
  L('l1', 'Stade Léo Lagrange', 'Rue de la République, 93140 Bondy');
  L('l2', 'Stade Auguste-Delaune', 'Avenue Paul Vaillant-Couturier, 93000 Bobigny');
  L('l3', 'Gymnase Joliot-Curie', 'Drancy (93)');
  L('l4', 'Stade Henri Wallon', 'Bobigny (93)');

  const A = (id, nom) => d.adversaires[id] = { id, nom, logo: null };
  A('a1', 'FC Noisy-le-Sec A'); A('a2', 'AS Drancy 7'); A('a3', 'Sporting Romainville'); A('a4', 'Les Lions de Bagnolet');
  A('a5', 'Bobigny Academy'); A('a6', 'FC Montreuil 7'); A('a7', 'Real Pantin'); A('a8', 'United Singh FC');

  const tous = Object.keys(d.joueurs);
  const M = (id, date, type, journee, format, domicile, lieu, adversaire, nous, eux, extra = {}) => {
    d.matchs[id] = { id, date, type, journee, format, domicile, lieu, adversaire, saison: saisonDe(date), convoques: tous,
      scoreNous: nous, scoreEux: eux, joue: nous != null, hommeDuMatch: null, ontJoue: [], compo: null, ...extra };
  };
  M('m1', lundi(-6), 'Championnat', 1, '7', true, 'l1', 'a1', 3, 1, { hommeDuMatch: 'p9' });
  M('m2', jour(-36, '10:30'), 'Amical', null, '8', false, 'l4', 'a7', 2, 2, { hommeDuMatch: 'p2' });
  M('m3', lundi(-4), 'Championnat', 2, '7', false, 'l3', 'a2', 1, 2, { hommeDuMatch: 'p6' });
  M('m4', lundi(-3), 'Championnat', 3, '7', true, 'l1', 'a4', 4, 0, { hommeDuMatch: 'p9' });
  M('m5', jour(-15, '14:00'), 'Tournoi', null, '11', true, 'l2', 'a8', 2, 1, { hommeDuMatch: 'p1' });
  M('m6', lundi(-2), 'Championnat', 4, '7', false, 'l4', 'a3', 3, 3, { hommeDuMatch: 'p12' });
  M('m7', lundi(-1), 'Championnat', 5, '7', true, 'l1', 'a2', 5, 2, { votesFin: Date.now() + 30 * 3600e3 });
  M('m8', lundi(0), 'Championnat', 6, '7', true, 'l1', 'a3', null, null);
  M('m9', jour(dl + 5, '10:00'), 'Amical', null, '8', true, 'l2', 'a7', null, null);
  M('m10', lundi(1), 'Championnat', 7, '7', false, 'l4', 'a5', null, null);
  M('m11', jour(dl + 13, '09:00'), 'Tournoi', null, '7', true, 'l2', 'a8', null, null);
  M('m12', lundi(2), 'Championnat', 8, '7', true, 'l1', 'a6', null, null);

  let n = 0;
  const G = (match, buteur, passeur, minute) => { const id = 'b' + (++n); d.buts[id] = { id, match, buteur, passeur, minute }; };
  G('m1', 'p9', 'p1', 12); G('m1', 'p1', 'p6', 30); G('m1', 'p9', null, 41);
  G('m2', 'p1', 'p8', 20); G('m2', 'p7', 'p1', 55);
  G('m3', 'p12', 'p1', 33);
  G('m4', 'p9', 'p1', 8); G('m4', 'p1', 'p9', 19); G('m4', 'p9', 'p7', 36); G('m4', 'p8', 'p6', 42);
  G('m5', 'p1', 'p8', 25); G('m5', 'p9', 'p1', 61);
  G('m6', 'p12', 'p9', 15); G('m6', 'p1', null, 31); G('m6', 'csc', null, 49);
  G('m7', 'p1', 'p9', 12); G('m7', 'p7', 'p1', 22); G('m7', 'p1', null, 38); G('m7', 'p9', 'p6', 44); G('m7', 'p9', 'p1', 49);

  const sept = ['p1', 'p2', 'p3', 'p4', 'p6', 'p7', 'p9', 'p10', 'p12'];
  d.matchs.m1.ontJoue = sept; d.matchs.m2.ontJoue = tous.slice(0, 11); d.matchs.m3.ontJoue = ['p1', 'p2', 'p3', 'p5', 'p6', 'p7', 'p8', 'p12'];
  d.matchs.m4.ontJoue = sept; d.matchs.m5.ontJoue = tous; d.matchs.m6.ontJoue = ['p1', 'p2', 'p4', 'p5', 'p6', 'p9', 'p11', 'p12'];
  d.matchs.m7.ontJoue = ['p1', 'p2', 'p3', 'p4', 'p6', 'p7', 'p9', 'p10', 'p11'];

  const P = (match, joueur, reponse) => { const id = match + '_' + joueur; d.presences[id] = { id, match, joueur, reponse }; };
  ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'].forEach(m => tous.forEach(j => P(m, j, d.matchs[m].ontJoue.includes(j) ? 'present' : 'absent')));
  ['p2', 'p3', 'p4', 'p6', 'p7', 'p9', 'p10'].forEach(j => P('m8', j, 'present')); P('m8', 'p8', 'absent'); P('m8', 'p11', 'absent');
  ['p3', 'p7', 'p9'].forEach(j => P('m9', j, 'present')); P('m9', 'p12', 'absent');

  d.matchs.m8.compo = { nom: 'Compo J6', formation: '2-3-1', postes: { G: 'p2', D1: 'p3', D2: 'p4', M1: 'p6', M2: 'p7', M3: 'p10', A1: 'p9' }, remplacants: [] };

  const V = (joueur, hdm, notes) => { const id = 'm7_' + joueur; d.votes[id] = { id, match: 'm7', joueur, hommeDuMatch: hdm, notes }; };
  V('p2', 'p1', { p1: 9, p9: 8, p7: 7 }); V('p3', 'p1', { p1: 9, p9: 8 }); V('p6', 'p9', { p1: 8, p9: 9 }); V('p9', 'p1', { p1: 10, p2: 7 });

  const s = saisonDe(new Date().toISOString());
  d.paiements.c1 = { id: 'c1', libelle: 'Cotisation saison ' + s, montant: 50, echeance: jour(28, '23:59').slice(0, 10), saison: s,
    joueurs: Object.fromEntries(tous.map((j, i) => [j, i % 3 !== 2])) };
  d.paiements.c2 = { id: 'c2', libelle: 'Inscription tournoi', montant: 10, echeance: jour(dl + 12, '23:59').slice(0, 10), saison: s,
    joueurs: Object.fromEntries(tous.slice(0, 10).map((j, i) => [j, i !== 4])) };

  d.equipe.config = { ...CONFIG_DEFAUT, id: 'config' };
  d.equipe.classement = { id: 'classement', maj: new Date().toISOString().slice(0, 10), lignes: [
    { equipe: 'Akaal FC', j: 5, v: 3, n: 1, d: 1, bp: 16, bc: 8 },
    { equipe: 'Bobigny Academy', j: 5, v: 3, n: 1, d: 1, bp: 12, bc: 7 },
    { equipe: 'AS Drancy 7', j: 5, v: 3, n: 0, d: 2, bp: 11, bc: 10 },
    { equipe: 'Sporting Romainville', j: 5, v: 2, n: 2, d: 1, bp: 10, bc: 9 },
    { equipe: 'FC Noisy-le-Sec A', j: 5, v: 1, n: 1, d: 3, bp: 6, bc: 11 },
    { equipe: 'Les Lions de Bagnolet', j: 5, v: 0, n: 1, d: 4, bp: 3, bc: 13 }
  ] };
  return d;
}
