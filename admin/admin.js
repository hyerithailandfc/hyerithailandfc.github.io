// Admin panel. All writes go through the GitHub REST API with the admin's own token,
// so GitHub (not this page) decides who is allowed to change the site.
import { esc, icon, workPhotos } from '../assets/js/core.js';

const LABEL = 'claude-request';
const DATA_FILES = [
  ['data/profile.json', 'โปรไฟล์ (Profile)'],
  ['data/journey.json', 'เส้นทาง (Journey)'],
  ['data/stories.json', 'เรื่องเล่าเจาะลึก (Journey: Deep dives)'],
  ['data/works.json', 'ผลงาน (Works)'],
  ['data/awards.json', 'รางวัล (Awards)'],
  ['data/girlsday.json', "Girl's Day (สมาชิก / ผลงานเพลง)"],
  ['data/media.json', 'มีเดีย (Media)'],
  ['data/site.json', 'ตั้งค่าเว็บ / รายการหน้า (Site)'],
  ['data/i18n/th.json', 'ข้อความ UI ภาษาไทย'],
  ['data/i18n/en.json', 'ข้อความ UI ภาษาอังกฤษ'],
  ['data/i18n/ko.json', 'ข้อความ UI ภาษาเกาหลี'],
];
const SECTIONS = [
  ['profile', 'โปรไฟล์'], ['journey', 'เส้นทาง / ประวัติ'], ['works', 'ผลงาน (ละคร/หนัง/รายการ)'],
  ['awards', 'รางวัล'], ['other', 'อื่น ๆ'],
];

const app = document.getElementById('app');
const store = {
  get(k) { try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch { return null; } },
  set(k, v, remember) { try { (remember ? localStorage : sessionStorage).setItem(k, v); } catch { /* ignore */ } },
  clear(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch { /* ignore */ } },
};

const cfg = { owner: '', repo: '', branch: 'main', token: '', user: null };
let tab = 'dashboard';

/* ---------- utils ---------- */
function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), kind === 'err' ? 7000 : 3500);
}

function b64encode(str) {
  const bytes = typeof str === 'string' ? new TextEncoder().encode(str) : str;
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function detectRepo() {
  const host = location.hostname;
  if (host.endsWith('.github.io')) {
    const owner = host.replace('.github.io', '');
    const seg = location.pathname.split('/').filter(Boolean)[0];
    return { owner, repo: seg && seg !== 'admin' ? seg : host };
  }
  return { owner: store.get('hyeri.admin.owner') || '', repo: store.get('hyeri.admin.repo') || '' };
}

async function api(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${cfg.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...opts.headers,
    },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}
const repoPath = (p = '') => `/repos/${cfg.owner}/${cfg.repo}${p}`;

async function getFile(path) {
  const f = await api(repoPath(`/contents/${path}?ref=${cfg.branch}`));
  return { sha: f.sha, text: b64decode(f.content) };
}
async function putFile(path, contentB64, message, sha) {
  return api(repoPath(`/contents/${path}`), {
    method: 'PUT',
    body: JSON.stringify({ message, content: contentB64, branch: cfg.branch, ...(sha ? { sha } : {}) }),
  });
}
async function ensureLabel() {
  try { await api(repoPath(`/labels/${LABEL}`)); } catch (e) {
    if (e.status !== 404) throw e;
    await api(repoPath('/labels'), { method: 'POST', body: JSON.stringify({ name: LABEL, color: '5aa9ff', description: 'Work request for Claude AI' }) });
  }
}
async function createClaudeIssue(title, body) {
  await ensureLabel();
  const issue = await api(repoPath('/issues'), { method: 'POST', body: JSON.stringify({ title, body }) });
  // Label is added in a second call so the workflow fires exactly once (on "labeled").
  await api(repoPath(`/issues/${issue.number}/labels`), { method: 'POST', body: JSON.stringify({ labels: [LABEL] }) });
  return issue;
}
const ago = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'เมื่อสักครู่';
  if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`;
  if (s < 86400) return `${Math.floor(s / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(s / 86400)} วันที่แล้ว`;
};

/* ---------- login ---------- */
function renderLogin(msg = '') {
  const d = detectRepo();
  document.getElementById('admin-user').innerHTML = '';
  app.innerHTML = `
  <div class="card login-card page-enter">
    <div class="counter-icon">${icon('lock')}</div>
    <h1 class="admin-title" style="text-align:center">เข้าสู่ระบบแอดมิน</h1>
    <p class="admin-sub" style="text-align:center">ใช้ GitHub token ของคุณ: เฉพาะคนที่มีสิทธิ์เขียน repo นี้เท่านั้นที่แก้เว็บได้</p>
    ${msg ? `<p class="note-box" style="margin-bottom:14px">${esc(msg)}</p>` : ''}
    <form id="login-form">
      <div class="row" style="gap:10px">
        <label class="field" style="flex:1 1 160px"><span>GitHub owner</span><input class="input" name="owner" required value="${esc(d.owner)}" placeholder="your-username"></label>
        <label class="field" style="flex:1 1 160px"><span>Repository</span><input class="input" name="repo" required value="${esc(d.repo)}" placeholder="hyeri-fansite"></label>
      </div>
      <label class="field"><span>Fine-grained personal access token</span>
        <input class="input" name="token" type="password" required autocomplete="off" placeholder="github_pat_…">
        <span class="hint">สร้างที่ GitHub → Settings → Developer settings → Fine-grained tokens เลือกเฉพาะ repo นี้ และให้สิทธิ์ Contents, Issues, Pull requests, Actions = Read and write (ดูวิธีใน README)</span>
      </label>
      <label class="check"><input type="checkbox" name="remember"> <span>จำไว้ในเครื่องนี้ (ไม่แนะนำบนเครื่องสาธารณะ)</span></label>
      <button class="btn btn-primary" style="width:100%;margin-top:18px" type="submit">${icon('lock')} เข้าสู่ระบบ</button>
    </form>
  </div>`;
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    cfg.owner = f.get('owner').trim();
    cfg.repo = f.get('repo').trim();
    cfg.token = f.get('token').trim();
    const ok = await verify();
    if (ok) {
      const remember = f.get('remember') === 'on';
      store.set('hyeri.admin.token', cfg.token, remember);
      store.set('hyeri.admin.owner', cfg.owner, true);
      store.set('hyeri.admin.repo', cfg.repo, true);
      renderShell();
    }
  });
}

async function verify() {
  try {
    const [repo, user] = await Promise.all([api(repoPath()), api('/user')]);
    if (!repo.permissions?.push) {
      renderLogin('Token นี้ไม่มีสิทธิ์เขียน repo: ต้องเป็นเจ้าของหรือ collaborator');
      return false;
    }
    cfg.branch = repo.default_branch || 'main';
    cfg.user = user;
    return true;
  } catch (e) {
    renderLogin(`เข้าสู่ระบบไม่สำเร็จ: ${e.message}`);
    return false;
  }
}

function logout() {
  store.clear('hyeri.admin.token');
  cfg.token = '';
  renderLogin();
}

/* ---------- shell ---------- */
const TABS = [
  ['dashboard', 'ภาพรวม', 'sparkle'],
  ['refresh', 'อัปเดตจาก namu.wiki', 'globe'],
  ['request', 'สั่ง Claude ทำงาน', 'star'],
  ['content', 'แก้ไขข้อความ', 'info'],
  ['media', 'รูป & วิดีโอ', 'image'],
];

function renderShell() {
  document.getElementById('admin-user').innerHTML = `
    <span class="chip">${cfg.user?.avatar_url ? `<img src="${esc(cfg.user.avatar_url)}" alt="" width="20" height="20" style="border-radius:50%">` : ''}${esc(cfg.user?.login || '')}</span>
    <button class="btn btn-ghost btn-sm" id="logout" type="button">ออกจากระบบ</button>`;
  document.getElementById('logout').onclick = logout;
  app.innerHTML = `
    <div class="tabs admin-tabs" role="tablist">${TABS.map(([id, label, ic]) =>
      `<button class="tab" role="tab" type="button" data-tab="${id}" aria-selected="${id === tab}">${icon(ic)} ${label}</button>`).join('')}</div>
    <div id="panel"></div>`;
  app.querySelector('.admin-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    tab = b.dataset.tab;
    app.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.tab === tab)));
    renderPanel();
  });
  renderPanel();
}

function renderPanel() {
  const panel = document.getElementById('panel');
  panel.innerHTML = '<div class="page-loading"><span class="spinner"></span></div>';
  const fn = { dashboard, refresh, request, content, media }[tab];
  fn(panel).catch((e) => {
    console.error(e);
    panel.innerHTML = `<div class="card empty">${icon('info')}<p>${esc(e.message)}</p></div>`;
  });
}

/* ---------- dashboard ---------- */
async function dashboard(panel) {
  const readJSONFile = (p) => getFile(p).then((f) => JSON.parse(f.text)).catch(() => null);
  const [issues, pulls, runs, site, tmdb, yt] = await Promise.all([
    api(repoPath(`/issues?labels=${LABEL}&state=all&per_page=15&sort=updated`)),
    api(repoPath('/pulls?state=open&per_page=30')),
    api(repoPath('/actions/runs?per_page=6')).catch(() => ({ workflow_runs: [] })),
    readJSONFile('data/site.json'),
    readJSONFile('data/tmdb.json'),
    readJSONFile('data/youtube.json'),
  ]);
  const claudePulls = pulls.filter((p) => p.head.ref.startsWith('claude/'));
  const reqs = issues.filter((i) => !i.pull_request);
  const when = (iso) => (iso ? `${new Date(iso).toLocaleString('th-TH-u-ca-gregory')} (${ago(iso)})` : 'ยังไม่เคยดึง');
  const unmatched = (tmdb?.unmatched || []).slice(0, 12);
  const mvs = Object.entries(yt?.mv || {});

  panel.innerHTML = `
  <div class="stack page-enter">
    <div class="card">
      <h2 style="font-size:1.3rem">${icon('globe').replace('<svg', '<svg width="20" height="20" style="display:inline;vertical-align:-3px"')} สถานะข้อมูลต้นทาง</h2>
      <p style="margin:0">namu.wiki แก้ไขล่าสุด (ตามที่บันทึกไว้): <b>${esc(site.source.sourceLastModified)}</b> · ซิงก์ล่าสุด: <b>${esc(site.source.lastSynced)}</b></p>
      <p class="hint">เปิด <a href="${esc(site.source.url)}" target="_blank" rel="noopener">หน้า namu.wiki</a> แล้วดู “최근 수정 시각” ถ้าใหม่กว่าวันที่ด้านบน ให้ไปที่แท็บ “อัปเดตจาก namu.wiki”</p>
    </div>

    <div class="card">
      <div class="row-between">
        <h2 style="font-size:1.3rem;margin:0">${icon('film').replace('<svg', '<svg width="20" height="20" style="display:inline;vertical-align:-3px"')} ข้อมูลจาก TMDB & YouTube</h2>
        <button class="btn btn-primary btn-sm" type="button" data-sync>${icon('sparkle')} ดึงข้อมูลใหม่ตอนนี้</button>
      </div>
      <p style="margin:10px 0 0">TMDB (โปสเตอร์ เรื่องย่อ รูป): <b>${esc(when(tmdb?.updatedAt))}</b> · จับคู่ได้ ${Object.keys(tmdb?.works || {}).length} เรื่อง</p>
      <p style="margin:0">YouTube (MV ช่อง และวิดีโอล่าสุด): <b>${esc(when(yt?.updatedAt))}</b> · MV ${mvs.length} เพลง</p>
      <p class="hint">ดึงอัตโนมัติทุกวันจันทร์ หรือกดปุ่มเพื่อดึงทันที (ใช้เวลา ~1–2 นาที) ต้องตั้งค่า secret <code>TMDB_API_KEY</code> และ <code>YOUTUBE_API_KEY</code> ก่อน (ดู README)</p>

      ${unmatched.length ? `
      <h3 style="font-size:1.05rem;margin-top:18px">ผลงานบน TMDB ที่ยังไม่มีในเว็บ</h3>
      <p class="hint">กด “ขอให้ Claude เพิ่ม” แล้ว Claude จะเพิ่มลงหน้า “ผลงาน” พร้อมแปล 3 ภาษา (ถ้าเป็นรายการวาไรตี้หรือไม่ใช่ผลงานของเธอก็ข้ามได้)</p>
      <div class="item-list">${unmatched.map((u) => `
        <div class="card item">
          <div class="item-main"><div class="item-title">${esc(u.title)}${u.original && u.original !== u.title ? ` · ${esc(u.original)}` : ''}</div>
          <div class="item-meta">${u.year || '-'} · ${u.type === 'movie' ? 'ภาพยนตร์' : 'ซีรีส์/รายการ'}${u.character ? ` · รับบท ${esc(u.character)}` : ''} · <a href="https://www.themoviedb.org/${esc(u.type)}/${u.tmdbId}" target="_blank" rel="noopener">TMDB</a></div></div>
          <button class="btn btn-ghost btn-sm" type="button" data-add-credit="${esc(u.type)}:${u.tmdbId}">ขอให้ Claude เพิ่ม</button>
        </div>`).join('')}</div>` : ''}

      ${mvs.length ? `
      <h3 style="font-size:1.05rem;margin-top:18px">MV ที่จับคู่จาก YouTube</h3>
      <p class="hint">ถ้าคลิปไม่ถูกต้อง ไปที่ “แก้ไขข้อความ” → ผลงาน → mv แล้วใส่ <code>youtubeId</code> ที่ถูกต้อง (11 ตัวอักษรท้ายลิงก์) ระบบจะใช้คลิปนั้นแทน</p>
      <div class="item-list">${mvs.map(([key, v]) => `
        <div class="card item">
          <div class="item-main"><div class="item-title">${esc(key.replace(/^(mv|gd):/, '').replace('|', ': '))}</div>
          <div class="item-meta">${v.pinned ? '📌 ปักหมุดแล้ว' : '🔎 ค้นหาอัตโนมัติ'} · <a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener">${esc(v.title)}</a> · ${esc(v.channel || '')}</div></div>
        </div>`).join('')}</div>` : ''}
    </div>

    <div class="card">
      <h2 style="font-size:1.3rem">การเปลี่ยนแปลงที่รอเผยแพร่</h2>
      <p class="hint">Claude จะเปิด Pull Request ไว้ให้ตรวจก่อน กด “เผยแพร่” เพื่อให้ขึ้นเว็บจริง (ประมาณ 1–2 นาที)</p>
      <div class="item-list">${claudePulls.length ? claudePulls.map((p) => `
        <div class="card item">
          <div class="item-main"><div class="item-title">#${p.number} ${esc(p.title)}</div>
          <div class="item-meta">อัปเดต ${ago(p.updated_at)} · <a href="${esc(p.html_url)}/files" target="_blank" rel="noopener">ดูไฟล์ที่เปลี่ยน</a></div></div>
          <div class="row">
            <button class="btn btn-primary btn-sm" data-merge="${p.number}" type="button">เผยแพร่</button>
            <button class="btn btn-danger btn-sm" data-close-pr="${p.number}" type="button">ทิ้ง</button>
          </div>
        </div>`).join('') : '<p class="hint">ไม่มีงานค้าง ✨</p>'}</div>
    </div>

    <div class="card">
      <h2 style="font-size:1.3rem">คำขอถึง Claude</h2>
      <div class="item-list">${reqs.length ? reqs.map((i) => `
        <div class="card item">
          <div class="item-main"><div class="item-title"><span class="status-dot ${i.state}"></span> #${i.number} ${esc(i.title)}</div>
          <div class="item-meta">${i.state === 'open' ? 'กำลังดำเนินการ / รอตรวจ' : 'ปิดแล้ว'} · ${i.comments} ความเห็น · ${ago(i.updated_at)} · <a href="${esc(i.html_url)}" target="_blank" rel="noopener">เปิดดู</a></div></div>
          ${i.state === 'open' ? `<button class="btn btn-ghost btn-sm" data-followup="${i.number}" type="button">ส่งข้อความเพิ่ม</button>` : ''}
        </div>`).join('') : '<p class="hint">ยังไม่มีคำขอ</p>'}</div>
    </div>

    <div class="card">
      <h2 style="font-size:1.3rem">งานอัตโนมัติล่าสุด (GitHub Actions)</h2>
      <div class="item-list">${runs.workflow_runs.length ? runs.workflow_runs.map((r) => `
        <div class="item card"><div class="item-main"><div class="item-title"><span class="status-dot ${esc(r.conclusion || r.status)}"></span> ${esc(r.name)}</div>
        <div class="item-meta">${esc(r.display_title || '')} · ${esc(r.conclusion || r.status)} · ${ago(r.created_at)} · <a href="${esc(r.html_url)}" target="_blank" rel="noopener">log</a></div></div></div>`).join('')
        : '<p class="hint">ไม่มีข้อมูล (token อาจไม่มีสิทธิ์ Actions: Read)</p>'}</div>
    </div>
  </div>`;

  panel.onclick = async (e) => {
    const m = e.target.closest('[data-merge]');
    const c = e.target.closest('[data-close-pr]');
    const f = e.target.closest('[data-followup]');
    const sync = e.target.closest('[data-sync]');
    const add = e.target.closest('[data-add-credit]');
    try {
      if (sync) {
        sync.disabled = true;
        await api(repoPath('/actions/workflows/sync-external.yml/dispatches'), { method: 'POST', body: JSON.stringify({ ref: cfg.branch }) });
        toast('เริ่มดึงข้อมูลแล้ว รอ ~1–2 นาทีแล้วรีเฟรชหน้านี้', 'ok');
      } else if (add) {
        const [type, id] = add.dataset.addCredit.split(':');
        const u = tmdb.unmatched.find((x) => x.type === type && String(x.tmdbId) === id);
        add.disabled = true;
        const issue = await createClaudeIssue(`[refresh-data] เพิ่มผลงานจาก TMDB: ${u.title}`, [
          '<!-- claude-request -->',
          '**Type:** refresh-data',
          '**Section:** works',
          '',
          '### Request',
          `TMDB lists a credit that is not on the site yet. Add it to data/works.json (drama or movie) with "tmdbId": ${u.tmdbId},`,
          'translated into TH/EN/KR. Check the details on TMDB; if it is a variety/talk show put it under "variety" instead.',
          '',
          `- Title: ${u.title} (${u.original})`,
          `- Year: ${u.year || 'unknown'}`,
          `- Type: ${u.type}`,
          `- Character: ${u.character || '-'}`,
          `- Link: https://www.themoviedb.org/${u.type}/${u.tmdbId}`,
        ].join('\n'));
        toast(`ส่งแล้ว (#${issue.number}) Claude กำลังทำงาน`, 'ok');
      } else if (m && confirm(`เผยแพร่ PR #${m.dataset.merge} ขึ้นเว็บจริง?`)) {
        m.disabled = true;
        await api(repoPath(`/pulls/${m.dataset.merge}/merge`), { method: 'PUT', body: JSON.stringify({ merge_method: 'squash' }) });
        toast('เผยแพร่แล้ว: เว็บจะอัปเดตภายใน 1–2 นาที', 'ok');
        renderPanel();
      } else if (c && confirm(`ทิ้งการเปลี่ยนแปลงใน PR #${c.dataset.closePr}?`)) {
        await api(repoPath(`/pulls/${c.dataset.closePr}`), { method: 'PATCH', body: JSON.stringify({ state: 'closed' }) });
        toast('ปิด PR แล้ว');
        renderPanel();
      } else if (f) {
        const text = prompt('ข้อความถึง Claude (เช่น ขอแก้สีปุ่มให้อ่อนลง):');
        if (text?.trim()) {
          await api(repoPath(`/issues/${f.dataset.followup}/comments`), { method: 'POST', body: JSON.stringify({ body: `@claude ${text.trim()}` }) });
          toast('ส่งแล้ว Claude จะเริ่มทำงานในไม่กี่วินาที', 'ok');
        }
      }
    } catch (err) { toast(err.message, 'err'); renderPanel(); }
  };
}

/* ---------- refresh from namu.wiki ---------- */
async function refresh(panel) {
  const site = JSON.parse((await getFile('data/site.json')).text);
  panel.innerHTML = `
  <div class="card page-enter">
    <h2 style="font-size:1.4rem">อัปเดตข้อมูลจาก namu.wiki</h2>
    <p class="hint">namu.wiki ไม่อนุญาตให้บอตดึงข้อมูลอัตโนมัติ เราจึงให้แอดมินคัดลอกส่วนที่เปลี่ยนมาวาง แล้ว Claude จะจัดรูปแบบ แปลเป็น TH/EN/KR และเตรียมให้ตรวจก่อนเผยแพร่</p>
    <ol class="steps">
      <li>เปิด <a href="${esc(site.source.url)}" target="_blank" rel="noopener">หน้า namu.wiki ของฮเยริ</a> (บันทึกล่าสุด: ${esc(site.source.sourceLastModified)})</li>
      <li>คัดลอกเฉพาะส่วนที่เพิ่ม/เปลี่ยน (เช่น ตารางละคร หรือรางวัลปีล่าสุด)</li>
      <li>วางด้านล่าง แล้วกดส่ง → รอ Claude เปิด PR → ไปที่ “ภาพรวม” แล้วกด “เผยแพร่”</li>
    </ol>
    <form id="refresh-form">
      <div class="row" style="gap:10px">
        <label class="field" style="flex:1 1 220px"><span>ส่วนที่อัปเดต</span>
          <select class="select" name="section">${SECTIONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
        <label class="field" style="flex:1 1 220px"><span>วันที่แก้ไขล่าสุดบน namu.wiki</span>
          <input class="input" type="date" name="modified" value="${new Date().toISOString().slice(0, 10)}"></label>
      </div>
      <label class="field"><span>ข้อความที่คัดลอกจาก namu.wiki</span>
        <textarea class="textarea" name="text" required style="min-height:220px" placeholder="วางข้อความที่นี่…"></textarea></label>
      <label class="field"><span>หมายเหตุถึง Claude (ไม่บังคับ)</span>
        <textarea class="textarea" name="note" style="min-height:80px" placeholder="เช่น เพิ่มละครเรื่องใหม่ปี 2027 และอัปเดตเส้นทางด้วย"></textarea></label>
      <button class="btn btn-primary" type="submit">${icon('sparkle')} ส่งให้ Claude อัปเดต</button>
    </form>
  </div>`;
  panel.querySelector('#refresh-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    const body = [
      '<!-- claude-request -->',
      '**Type:** refresh-data',
      `**Section:** ${f.get('section')}`,
      `**namu.wiki last modified:** ${f.get('modified')}`,
      '',
      '### Admin note',
      f.get('note') || '-',
      '',
      '### Pasted source text (from namu.wiki)',
      '`````text',
      f.get('text'),
      '`````',
    ].join('\n');
    try {
      const issue = await createClaudeIssue(`[Refresh] ${f.get('section')}: ${f.get('modified')}`, body);
      toast(`ส่งแล้ว (#${issue.number}) Claude กำลังทำงาน`, 'ok');
      tab = 'dashboard';
      renderShell();
    } catch (err) { toast(err.message, 'err'); btn.disabled = false; }
  });
}

/* ---------- request to Claude ---------- */
async function request(panel) {
  panel.innerHTML = `
  <div class="card page-enter">
    <h2 style="font-size:1.4rem">สั่ง Claude ทำหน้า / ฟีเจอร์ใหม่</h2>
    <p class="hint">Claude จะทำตามกฎใน CLAUDE.md (ธีมพาสเทล 3 ภาษา responsive) แล้วเปิด PR ให้ตรวจก่อนเผยแพร่ เขียนเป็นภาษาไทยได้เลย ยิ่งละเอียดยิ่งดี</p>
    <form id="req-form">
      <div class="row" style="gap:10px">
        <label class="field" style="flex:1 1 200px"><span>ประเภท</span>
          <select class="select" name="type">
            <option value="new-page">หน้าใหม่</option>
            <option value="feature">ฟีเจอร์ / ส่วนใหม่ในหน้าเดิม</option>
            <option value="design">ปรับดีไซน์</option>
            <option value="bug">แก้ปัญหา</option>
            <option value="other">อื่น ๆ</option>
          </select></label>
        <label class="field" style="flex:2 1 300px"><span>หัวข้อ</span>
          <input class="input" name="title" required placeholder="เช่น หน้ารวมเพลงของ Girl's Day"></label>
      </div>
      <label class="field"><span>รายละเอียด</span>
        <textarea class="textarea" name="details" required style="min-height:200px" placeholder="อยากให้มีอะไรบ้าง แสดงข้อมูลอะไร อยู่ในเมนูไหม ฯลฯ"></textarea></label>
      <label class="field"><span>ลิงก์อ้างอิง (ไม่บังคับ)</span>
        <input class="input" name="ref" type="url" placeholder="https://…"></label>
      <button class="btn btn-primary" type="submit">${icon('star')} ส่งคำขอ</button>
    </form>
  </div>`;
  panel.querySelector('#req-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    const body = [
      '<!-- claude-request -->',
      `**Type:** ${f.get('type')}`,
      '',
      '### Request',
      f.get('details'),
      '',
      f.get('ref') ? `**Reference:** ${f.get('ref')}` : '',
    ].join('\n');
    try {
      const issue = await createClaudeIssue(`[${f.get('type')}] ${f.get('title')}`, body);
      toast(`ส่งแล้ว (#${issue.number}) Claude กำลังทำงาน`, 'ok');
      tab = 'dashboard';
      renderShell();
    } catch (err) { toast(err.message, 'err'); btn.disabled = false; }
  });
}

/* ---------- content editor (generic JSON form) ---------- */
const LANG_KEYS = ['th', 'en', 'ko'];
const isLangObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
  && Object.keys(v).length > 0 && Object.keys(v).every((k) => LANG_KEYS.includes(k)) && Object.values(v).every((x) => typeof x === 'string');

function blankLike(v) {
  if (Array.isArray(v)) {
    // Remember the item shape, so "+ เพิ่มรายการ" on the emptied list still adds the right kind of item
    // (e.g. a TH/EN/KR paragraph in a new story's body[]). Non-index props are not saved by JSON.stringify.
    const out = [];
    const shape = v.__tpl ?? v[0];
    if (shape !== undefined) Object.defineProperty(out, '__tpl', { value: blankLike(shape) });
    return out;
  }
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankLike(x)]));
  if (typeof v === 'number' || v === null) return null;
  if (typeof v === 'boolean') return false;
  return '';
}
/** Empty id fields (youtubeId, tmdbId…) are saved as null = "none", which the site and validator expect. */
function cleanForSave(v, key = '') {
  if (Array.isArray(v)) return v.map((x) => cleanForSave(x));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cleanForSave(x, k)]));
  return v === '' && /Id$/.test(key) ? null : v;
}
function summarize(item) {
  if (item == null || typeof item !== 'object') return String(item ?? '');
  const pick = item.title || item.name || item.category || item.song || item.label || item.caption || item.handle || item.id;
  const label = pick && typeof pick === 'object' ? (pick.th || pick.en || pick.ko) : pick;
  return [item.year || item.date, label].filter(Boolean).join(' · ') || '(รายการ)';
}

function editorNode(value, set, key) {
  if (isLangObj(value)) {
    const wrap = document.createElement('div');
    wrap.className = 'je-lang';
    LANG_KEYS.forEach((l) => {
      const lab = document.createElement('label');
      const long = (value[l] || '').length > 70;
      const input = document.createElement(long ? 'textarea' : 'input');
      input.className = long ? 'textarea' : 'input';
      if (long) input.style.minHeight = '110px';
      input.value = value[l] ?? '';
      input.addEventListener('input', () => {
        if (input.value === '' && l === 'th') delete value[l]; else value[l] = input.value;
      });
      lab.innerHTML = `<b>${l === 'ko' ? 'KR' : l.toUpperCase()}</b>`;
      lab.appendChild(input);
      wrap.appendChild(lab);
    });
    return wrap;
  }
  if (Array.isArray(value)) {
    const wrap = document.createElement('div');
    wrap.className = 'je-arr';
    const draw = () => {
      wrap.innerHTML = '';
      value.forEach((item, i) => {
        if (item && typeof item === 'object') {
          const d = document.createElement('details');
          d.className = 'je-item';
          if (item.__new) { d.open = true; delete item.__new; }
          const sum = document.createElement('summary');
          sum.innerHTML = `<span class="sum">${esc(summarize(item))}</span><span class="je-tools">
            <button type="button" data-a="up" title="ขึ้น">↑</button><button type="button" data-a="down" title="ลง">↓</button><button type="button" data-a="del" title="ลบ">✕</button></span>`;
          sum.querySelector('.je-tools').addEventListener('click', (e) => {
            e.preventDefault();
            const a = e.target.dataset.a;
            if (a === 'up' && i > 0) [value[i - 1], value[i]] = [value[i], value[i - 1]];
            if (a === 'down' && i < value.length - 1) [value[i + 1], value[i]] = [value[i], value[i + 1]];
            if (a === 'del' && confirm('ลบรายการนี้?')) value.splice(i, 1);
            draw();
          });
          const body = document.createElement('div');
          body.className = 'je-body';
          body.appendChild(editorNode(item, (nv) => { value[i] = nv; }));
          d.append(sum, body);
          wrap.appendChild(d);
        } else {
          const row = document.createElement('div');
          row.className = 'row';
          const node = editorNode(item, (nv) => { value[i] = nv; });
          node.style.flex = '1';
          const del = document.createElement('button');
          del.type = 'button'; del.className = 'btn btn-ghost btn-sm'; del.textContent = '✕';
          del.onclick = () => { value.splice(i, 1); draw(); };
          row.append(node, del);
          wrap.appendChild(row);
        }
      });
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'btn btn-ghost btn-sm';
      add.textContent = '+ เพิ่มรายการ';
      add.onclick = () => {
        const tpl = value.length ? blankLike(value[value.length - 1]) : (value.__tpl !== undefined ? blankLike(value.__tpl) : '');
        if (tpl && typeof tpl === 'object') tpl.__new = true;
        value.push(tpl);
        draw();
      };
      wrap.appendChild(add);
    };
    draw();
    return wrap;
  }
  if (value && typeof value === 'object') {
    const wrap = document.createElement('div');
    wrap.className = 'je-obj';
    Object.keys(value).forEach((k) => {
      const field = document.createElement('div');
      const lab = document.createElement('span');
      lab.className = 'je-key';
      lab.textContent = k;
      field.append(lab, editorNode(value[k], (nv) => { value[k] = nv; }, k));
      wrap.appendChild(field);
    });
    return wrap;
  }
  if (typeof value === 'boolean') {
    const lab = document.createElement('label');
    lab.className = 'check';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = value;
    cb.onchange = () => set(cb.checked);
    lab.append(cb, document.createTextNode(' เปิด'));
    return lab;
  }
  const long = typeof value === 'string' && value.length > 80;
  const input = document.createElement(long ? 'textarea' : 'input');
  input.className = long ? 'textarea' : 'input';
  input.value = value ?? '';
  if (typeof value === 'number' || value === null) input.placeholder = '(ว่าง = ไม่มีข้อมูล)';
  input.addEventListener('input', () => {
    const raw = input.value;
    if (typeof value === 'number' || value === null) {
      const n = raw.trim() === '' ? null : Number(raw);
      set(Number.isNaN(n) ? raw : n);
    } else set(raw);
  });
  return input;
}

function countMissing(v) {
  if (Array.isArray(v)) return v.reduce((n, x) => n + countMissing(x), 0);
  if (!v || typeof v !== 'object') return 0;
  if (isLangObj(v)) return (v.en ? 0 : 1) + (v.ko ? 0 : 1);
  return Object.values(v).reduce((n, x) => n + countMissing(x), 0);
}

async function content(panel) {
  panel.innerHTML = `
  <div class="card page-enter">
    <h2 style="font-size:1.4rem">แก้ไขข้อความ</h2>
    <p class="hint">แก้ข้อความได้ทันทีโดยไม่ต้องใช้ Claude: กดบันทึกแล้วเว็บจะอัปเดตใน 1–2 นาที ช่อง TH ว่างได้ (จะแสดงภาษาอังกฤษแทน)</p>
    <label class="field" style="max-width:420px"><span>เลือกไฟล์ข้อมูล</span>
      <select class="select" id="file-pick">${DATA_FILES.map(([p, l]) => `<option value="${p}">${l}</option>`).join('')}</select></label>
    <div id="editor"></div>
  </div>`;
  const pick = panel.querySelector('#file-pick');
  const holder = panel.querySelector('#editor');
  const load = async () => {
    holder.innerHTML = '<div class="page-loading" style="min-height:20vh"><span class="spinner"></span></div>';
    const path = pick.value;
    const file = await getFile(path);
    const data = JSON.parse(file.text);
    holder.innerHTML = '';
    holder.appendChild(editorNode(data, () => {}));
    const bar = document.createElement('div');
    bar.className = 'save-bar';
    bar.innerHTML = `<button class="btn btn-ghost" type="button" data-reset>ยกเลิกการแก้</button><button class="btn btn-primary" type="button" data-save>บันทึก & เผยแพร่</button>`;
    holder.appendChild(bar);
    bar.querySelector('[data-reset]').onclick = load;
    bar.querySelector('[data-save]').onclick = async (e) => {
      const gaps = countMissing(data);
      if (gaps && !confirm(`มีช่อง EN/KR ว่างอยู่ ${gaps} จุด (เว็บจะแสดงข้อความว่าง) บันทึกต่อไหม?`)) return;
      e.target.disabled = true;
      try {
        await putFile(path, b64encode(JSON.stringify(cleanForSave(data), null, 2) + '\n'), `content: update ${path} via admin`, file.sha);
        toast('บันทึกแล้ว ✨ เว็บจะอัปเดตใน 1–2 นาที', 'ok');
        load();
      } catch (err) {
        toast(err.status === 409 ? 'ไฟล์ถูกแก้จากที่อื่น กรุณาโหลดใหม่' : err.message, 'err');
        e.target.disabled = false;
      }
    };
  };
  pick.onchange = () => load().catch((e) => toast(e.message, 'err'));
  await load();
}

/* ---------- media ---------- */
function youtubeId(url) {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : (/^[\w-]{11}$/.test(url) ? url : null);
}

async function resizeImage(file, max = 1600) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.85));
  return { bytes: new Uint8Array(await blob.arrayBuffer()), w, h };
}

async function media(panel) {
  const [file, worksF, tmdbF, siteF] = await Promise.all(
    ['data/media.json', 'data/works.json', 'data/tmdb.json', 'data/site.json'].map((p) => getFile(p)),
  );
  const data = JSON.parse(file.text);
  const site = JSON.parse(siteF.text);
  const hidden = new Set(site.external?.tmdbImageIgnore || []);
  const raw = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/`;
  const srcOf = (src) => (/^https?:/.test(src) ? src : raw + src);
  const capOf = (c) => (c && typeof c === 'object' ? c.th || c.en || c.ko || '' : c || '');
  const langInputs = (name, req = true) => `<div class="je-lang">${LANG_KEYS.map((l) => `<label><b>${l === 'ko' ? 'KR' : l.toUpperCase()}</b><input class="input" name="${name}_${l}" ${l !== 'th' && req ? 'required' : ''}></label>`).join('')}</div>`;

  // Two photo groups, each a list of { view: what the site shows, stored: what gets saved }.
  // "works" mirrors the public "From her works" order (core.js → workPhotos); TMDB stills are stored as { tmdb: path }.
  const curated = new Map((data.workGallery || []).filter((c) => c.tmdb).map((c) => [c.tmdb, c]));
  const lists = {
    hyeri: data.gallery.map((g) => ({ view: g, stored: g })),
    works: workPhotos(data, JSON.parse(tmdbF.text), JSON.parse(worksF.text), hidden)
      .map((v) => ({ view: v, stored: v.tmdb ? { ...(curated.get(v.tmdb) || { tmdb: v.tmdb }) } : { ...v } })),
  };
  const dirty = new Set();
  const commit = () => {
    data.gallery = lists.hyeri.map((r) => r.stored);
    data.workGallery = lists.works.map((r) => r.stored);
  };

  panel.innerHTML = `
  <div class="stack page-enter">
    <div class="card">
      <h2 style="font-size:1.3rem">${icon('youtube').replace('<svg', '<svg width="22" height="22" style="display:inline;vertical-align:-4px;color:#FF3B3B"')} เพิ่มวิดีโอ YouTube</h2>
      <p class="hint">วิดีโอที่เพิ่มจะขึ้นในหน้า "มีเดีย" หัวข้อ "วิดีโอ" เท่านั้น: อันที่เพิ่มล่าสุดอยู่บนสุด ตามด้วยคลิปล่าสุดจากช่อง YouTube ของฮเยริ (ดึงอัตโนมัติ)</p>
      <form id="yt-form">
        <label class="field"><span>ลิงก์ YouTube (ควรเป็นช่องทางการ)</span><input class="input" name="url" required placeholder="https://www.youtube.com/watch?v=…"></label>
        <div class="field"><span class="field-label">ชื่อวิดีโอ</span>${langInputs('title')}</div>
        <button class="btn btn-primary" type="submit">เพิ่มวิดีโอ</button>
      </form>
      <div class="item-list" style="margin-top:16px">${data.videos.map((v, i) => `
        <div class="card item"><div class="item-main"><div class="item-title">${esc(v.title.th || v.title.en)}</div><div class="item-meta">${esc(v.id)}</div></div>
        <button class="btn btn-danger btn-sm" type="button" data-del-video="${i}">ลบ</button></div>`).join('')}</div>
    </div>

    <div class="card">
      <h2 style="font-size:1.3rem">${icon('image').replace('<svg', '<svg width="22" height="22" style="display:inline;vertical-align:-4px;color:var(--accent)"')} อัปโหลดรูป</h2>
      <p class="hint">รูปจะถูกย่อเป็น WebP ไม่เกิน 1600px อัตโนมัติ: อัปโหลดเฉพาะรูปที่มีสิทธิ์เผยแพร่ (เช่น รูปจากช่องทางการที่อนุญาตให้แชร์ หรือรูปที่ถ่ายเอง)</p>
      <form id="img-form">
        <label class="field"><span>ไฟล์รูป</span><input class="input" type="file" name="file" accept="image/*" required></label>
        <label class="field"><span>แสดงในหมวด</span><select class="select" name="group">
          <option value="hyeri">ฮเยริ</option><option value="works">จากผลงานของเธอ (ขึ้นเป็นรูปแรก จัดลำดับใหม่ได้ด้านล่าง)</option></select></label>
        <div class="field"><span class="field-label">คำบรรยาย</span>${langInputs('cap')}</div>
        <label class="field"><span>เครดิต / ที่มา</span><input class="input" name="credit" placeholder="เช่น Sublime official / ถ่ายเองที่แฟนมีต 2025"></label>
        <div class="row" style="margin-bottom:12px" data-hyeri-only>
          <label class="check"><input type="checkbox" name="featured"> <span>ใช้เป็นรูปหลักหน้าแรก</span></label>
          <label class="check"><input type="checkbox" name="avatar"> <span>ใช้เป็นรูปโปรไฟล์</span></label>
        </div>
        <label class="check" style="margin-bottom:14px"><input type="checkbox" name="rights" required> <span>ฉันยืนยันว่ามีสิทธิ์เผยแพร่รูปนี้</span></label>
        <button class="btn btn-primary" type="submit">อัปโหลด</button>
      </form>
    </div>

    <div class="card">
      <h2 style="font-size:1.3rem">รูปหมวด "ฮเยริ"</h2>
      <p class="hint">ลากรูปหรือกดลูกศรเพื่อเรียงลำดับ แล้วกด "บันทึกลำดับ": รูปโปรไฟล์จาก TMDB จะต่อท้ายให้อัตโนมัติ</p>
      <div class="photo-grid" data-list="hyeri"></div>
    </div>

    <div class="card">
      <h2 style="font-size:1.3rem">รูปหมวด "จากผลงานของเธอ"</h2>
      <p class="hint">เริ่มต้นเรียงตามผลงานจากใหม่ไปเก่า ลากหรือกดลูกศรเพื่อเรียงใหม่ได้ "ซ่อน" รูปจาก TMDB แล้วจะไม่กลับมาอีกแม้กด Sync ใหม่</p>
      <div class="photo-grid photo-grid-wide" data-list="works"></div>
    </div>

    <div class="save-bar" data-order-bar hidden><span class="hint" style="margin-right:auto">ยังไม่ได้บันทึกลำดับรูป</span>
      <button class="btn btn-ghost" type="button" data-order-reset>ยกเลิก</button><button class="btn btn-primary" type="button" data-order-save>บันทึกลำดับ</button></div>
  </div>
  <dialog class="card edit-dialog" id="photo-edit"></dialog>`;

  const drawList = (group) => {
    const rows = lists[group];
    panel.querySelector(`[data-list="${group}"]`).innerHTML = rows.length ? rows.map((r, i) => `
      <div class="photo" draggable="true" data-group="${group}" data-i="${i}">
        <span class="photo-num">${i + 1}</span>
        <img src="${esc(srcOf(r.view.src))}" alt="" loading="lazy" draggable="false">
        <div class="photo-cap"><b>${esc(capOf(r.view.caption)) || '<i>ไม่มีคำบรรยาย</i>'}</b><span>${r.view.credit ? `© ${esc(r.view.credit)}` : '<i>ยังไม่ใส่เครดิต</i>'}</span></div>
        <div class="photo-tools">
          <button type="button" data-move="-1" aria-label="เลื่อนไปก่อนหน้า" ${i === 0 ? 'disabled' : ''}>←</button>
          <button type="button" data-move="1" aria-label="เลื่อนไปถัดไป" ${i === rows.length - 1 ? 'disabled' : ''}>→</button>
          <button type="button" data-edit>แก้ไข</button>
          <button type="button" class="danger" data-del>${r.view.tmdb ? 'ซ่อน' : 'ลบ'}</button>
        </div>
      </div>`).join('') : '<p class="hint">ยังไม่มีรูป</p>';
  };
  const move = (group, from, to) => {
    const rows = lists[group];
    if (to < 0 || to >= rows.length || from === to) return;
    rows.splice(to, 0, ...rows.splice(from, 1));
    dirty.add(group);
    panel.querySelector('[data-order-bar]').hidden = false;
    drawList(group);
  };
  drawList('hyeri');
  drawList('works');

  const save = async (msg) => {
    const fresh = await getFile('data/media.json');
    await putFile('data/media.json', b64encode(JSON.stringify(data, null, 2) + '\n'), msg, fresh.sha);
  };
  const deleteRepoFile = async (path) => {
    try {
      const meta = await api(repoPath(`/contents/${path}?ref=${cfg.branch}`));
      await api(repoPath(`/contents/${path}`), { method: 'DELETE', body: JSON.stringify({ message: 'media: delete photo file', sha: meta.sha, branch: cfg.branch }) });
    } catch { /* file may already be gone */ }
  };
  const langVal = (f, name) => Object.fromEntries(LANG_KEYS.map((l) => [l, (f.get(`${name}_${l}`) || '').trim()]).filter(([, v]) => v));

  panel.querySelector('#yt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const id = youtubeId(f.get('url').trim());
    if (!id) { toast('ลิงก์ YouTube ไม่ถูกต้อง', 'err'); return; }
    data.videos.unshift({ id, title: langVal(f, 'title') });
    try { await save('media: add video via admin'); toast('เพิ่มวิดีโอแล้ว', 'ok'); renderPanel(); } catch (err) { toast(err.message, 'err'); }
  });

  const imgForm = panel.querySelector('#img-form');
  imgForm.group.onchange = () => { imgForm.querySelector('[data-hyeri-only]').hidden = imgForm.group.value !== 'hyeri'; };
  imgForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const { bytes, w, h } = await resizeImage(f.get('file'));
      const path = `images/gallery/${Date.now()}.webp`;
      await putFile(path, b64encode(bytes), 'media: upload photo via admin');
      const photo = { src: path, width: w, height: h, caption: langVal(f, 'cap'), credit: f.get('credit').trim() };
      if (f.get('group') === 'works') {
        lists.works.unshift({ view: photo, stored: photo });
      } else {
        if (f.get('featured') === 'on') data.gallery.forEach((g) => delete g.featured);
        if (f.get('avatar') === 'on') data.gallery.forEach((g) => delete g.avatar);
        lists.hyeri.unshift({ view: photo, stored: Object.assign(photo, f.get('featured') === 'on' ? { featured: true } : {}, f.get('avatar') === 'on' ? { avatar: true } : {}) });
      }
      commit();
      await save('media: add photo via admin');
      toast('อัปโหลดแล้ว ✨', 'ok');
      renderPanel();
    } catch (err) { toast(err.message, 'err'); btn.disabled = false; }
  });

  // Edit caption / credit (and home/profile flags for "Hyeri" photos) after upload.
  const dlg = panel.querySelector('#photo-edit');
  const openEdit = (group, i) => {
    const r = lists[group][i];
    const isTmdb = !!r.view.tmdb;
    dlg.innerHTML = `
      <form method="dialog">
        <h3 style="margin-top:0">แก้ไขรายละเอียดรูป</h3>
        <img class="edit-preview" src="${esc(srcOf(r.view.src))}" alt="">
        <div class="field"><span class="field-label">คำบรรยาย</span>${langInputs('cap', !isTmdb)}
          ${isTmdb ? `<span class="hint">เว้นว่างไว้ = ใช้ชื่อผลงานจาก TMDB (${esc(capOf(r.view.caption))})</span>` : ''}</div>
        <label class="field"><span>เครดิต / ที่มา</span><input class="input" name="credit" placeholder="${isTmdb ? 'TMDB' : 'เช่น Sublime official'}"></label>
        ${group === 'hyeri' ? `<div class="row" style="margin-bottom:12px">
          <label class="check"><input type="checkbox" name="featured"> <span>ใช้เป็นรูปหลักหน้าแรก</span></label>
          <label class="check"><input type="checkbox" name="avatar"> <span>ใช้เป็นรูปโปรไฟล์</span></label></div>` : ''}
        <div class="row" style="justify-content:flex-end"><button class="btn btn-ghost" value="cancel" formnovalidate>ยกเลิก</button><button class="btn btn-primary" value="save">บันทึก</button></div>
      </form>`;
    const form = dlg.querySelector('form');
    const cap = r.stored.caption && typeof r.stored.caption === 'object' ? r.stored.caption : {};
    LANG_KEYS.forEach((l) => { form[`cap_${l}`].value = cap[l] || ''; });
    form.credit.value = r.stored.credit || '';
    if (group === 'hyeri') { form.featured.checked = !!r.stored.featured; form.avatar.checked = !!r.stored.avatar; }
    form.onsubmit = async (e) => { // method="dialog": the dialog closes itself after this
      if (e.submitter?.value !== 'save') return;
      const f = new FormData(form);
      const newCap = langVal(f, 'cap');
      const credit = f.get('credit').trim();
      if (isTmdb) {
        if (Object.keys(newCap).length) r.stored.caption = newCap; else delete r.stored.caption;
        if (credit) r.stored.credit = credit; else delete r.stored.credit;
      } else {
        r.stored.caption = newCap;
        r.stored.credit = credit;
      }
      if (group === 'hyeri') {
        for (const flag of ['featured', 'avatar']) {
          if (f.get(flag) === 'on') { lists.hyeri.forEach((x) => delete x.stored[flag]); r.stored[flag] = true; } else delete r.stored[flag];
        }
      }
      commit();
      try { await save('media: edit photo details via admin'); toast('บันทึกแล้ว ✨', 'ok'); renderPanel(); } catch (err) { toast(err.message, 'err'); }
    };
    dlg.showModal();
  };

  const removePhoto = async (group, i) => {
    const r = lists[group][i];
    if (r.view.tmdb) {
      if (!confirm('ซ่อนรูปนี้จากเว็บ? (Sync ครั้งต่อไปจะไม่ดึงกลับมา)')) return;
      lists[group].splice(i, 1);
      commit();
      await save('media: hide TMDB still via admin');
      const fresh = await getFile('data/site.json');
      const s = JSON.parse(fresh.text);
      s.external = s.external || {};
      s.external.tmdbImageIgnore = [...new Set([...(s.external.tmdbImageIgnore || []), r.view.tmdb])];
      await putFile('data/site.json', b64encode(JSON.stringify(s, null, 2) + '\n'), 'media: hide TMDB still via admin', fresh.sha);
    } else {
      if (!confirm('ลบรูปนี้ออกจากเว็บ?')) return;
      lists[group].splice(i, 1);
      commit();
      await save('media: remove photo via admin');
      await deleteRepoFile(r.stored.src);
    }
    toast(r.view.tmdb ? 'ซ่อนแล้ว' : 'ลบแล้ว');
    renderPanel();
  };

  panel.onclick = async (e) => {
    const v = e.target.closest('[data-del-video]');
    const tile = e.target.closest('.photo');
    try {
      if (v && confirm('ลบวิดีโอนี้?')) {
        data.videos.splice(Number(v.dataset.delVideo), 1);
        await save('media: remove video via admin');
        toast('ลบแล้ว'); renderPanel();
      } else if (tile) {
        const { group } = tile.dataset;
        const i = Number(tile.dataset.i);
        const mv = e.target.closest('[data-move]');
        if (mv) move(group, i, i + Number(mv.dataset.move));
        else if (e.target.closest('[data-edit]')) openEdit(group, i);
        else if (e.target.closest('[data-del]')) await removePhoto(group, i);
      } else if (e.target.closest('[data-order-save]')) {
        commit();
        await save('media: reorder photos via admin');
        toast('บันทึกลำดับแล้ว ✨', 'ok'); renderPanel();
      } else if (e.target.closest('[data-order-reset]')) {
        renderPanel();
      }
    } catch (err) { toast(err.message, 'err'); }
  };

  // Drag & drop inside one group.
  let drag = null;
  panel.ondragstart = (e) => {
    const tile = e.target.closest('.photo');
    if (!tile) return;
    drag = { group: tile.dataset.group, i: Number(tile.dataset.i) };
    e.dataTransfer.effectAllowed = 'move';
    tile.classList.add('dragging');
  };
  panel.ondragover = (e) => {
    const tile = e.target.closest('.photo');
    if (drag && tile?.dataset.group === drag.group) e.preventDefault();
  };
  panel.ondrop = (e) => {
    const tile = e.target.closest('.photo');
    if (!drag || tile?.dataset.group !== drag.group) return;
    e.preventDefault();
    move(drag.group, drag.i, Number(tile.dataset.i));
    drag = null;
  };
  panel.ondragend = () => { drag = null; panel.querySelector('.photo.dragging')?.classList.remove('dragging'); };
}

/* ---------- boot ---------- */
(async () => {
  const theme = (() => { try { return localStorage.getItem('hyeri.theme'); } catch { return null; } })();
  if (theme) document.documentElement.dataset.theme = theme;
  const d = detectRepo();
  cfg.owner = d.owner;
  cfg.repo = d.repo;
  cfg.token = store.get('hyeri.admin.token') || '';
  if (cfg.token && cfg.owner && cfg.repo && await verify()) renderShell();
  else if (!cfg.token) renderLogin();
})();
