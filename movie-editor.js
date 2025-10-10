
// assets/js/movie-editor.js
// Full editor: load raw, CRUD (episodes supported), edit-on-click, download, commit via GitHub API
(() => {
  const RAW_URL = 'https://raw.githubusercontent.com/crytals-sc/json-link/refs/heads/img/lib/movies.json';
  const STORAGE_KEY = 'movie-editor.v3';
  const GITHUB_CONF_KEY = 'movie-editor.v3.conf';
  const DEFAULT_PATHS = ['movies.json', 'data/movies.json'];

  const $ = id => document.getElementById(id);
  const toast = (msg, type='info') => {
    console[type==='error'?'error':'log']('[Toast]',msg);
    const s = $('githubStatus'); if(s) s.textContent = msg;
  };
  const encodeContent = s => btoa(unescape(encodeURIComponent(s||'')));
  const uid = () => (crypto && crypto.randomUUID) ? crypto.randomUUID() : ('id_' + Date.now().toString(36) + Math.floor(Math.random()*9999));
  const setBusy = (el, b=true) => { if(!el) return; el.disabled = b; };

  // DOM
  const dom = {
    addBtn: $('add'), downloadBtn: $('download'), listWrap: $('list'),
    title: $('title'), year: $('year'), poster: $('poster'), driveId: $('driveId'),
    duration: $('duration'), rating: $('rating'), category: $('category'), genre: $('genre'), desc: $('desc'),
    episodesEditor: $('episodesEditor'), addEpisode: $('addEpisode'), clearEpisodes: $('clearEpisodes'),
    commitBtn: $('commitToGithub'), tokenInput: $('githubToken'), repoInput: $('githubRepo'),
    branchInput: $('githubBranch'), status: $('githubStatus'), formStatus: $('formStatus')
  };

  // state
  let movies = [];
  let editingId = null;

  // storage
  function loadLocal(){ try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) movies=JSON.parse(raw);}catch(e){movies=[]}}
  function saveLocal(){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(movies)); }catch(e){} }
  function loadConf(){ try{ const raw=localStorage.getItem(GITHUB_CONF_KEY); if(raw){ const c=JSON.parse(raw); if(c.repo) dom.repoInput.value=c.repo; if(c.branch) dom.branchInput.value=c.branch; } }catch(e){}}
  function saveConf(){ try{ const c={repo:dom.repoInput.value.trim(),branch:dom.branchInput.value.trim()||'main'}; localStorage.setItem(GITHUB_CONF_KEY,JSON.stringify(c)); }catch(e){} }

  // render list (cards/rows)
  function render(){
    const wrap = dom.listWrap; if(!wrap) return;
    wrap.innerHTML = '';
    if(!movies.length){ wrap.innerHTML = '<div class="muted">Danh sách rỗng</div>'; return; }
    const frag = document.createDocumentFragment();
    movies.forEach((m, idx) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.id = m.id;
      row.innerHTML = `
        <img class="poster-mini" src="${escape(m.poster||'')}" onerror="this.style.visibility='hidden'"/>
        <div>
          <div style="font-weight:600">#${escape(m.id)} — ${escape(m.title||'(No title)')}</div>
          <div class="muted" style="font-size:12px">${m.year||''} ${m.duration? '• '+escape(m.duration):''} ${m.genre && m.genre.length? '• '+escape(m.genre.join(', ')) : ''}</div>
          <div style="margin-top:6px;font-size:13px">${escape(m.desc||'')}</div>
          ${m.category? `<div class="muted" style="margin-top:6px">Category: ${escape(m.category)}</div>` : ''}
          ${m.episodes ? `<div class="muted" style="margin-top:6px">Tập: ${m.episodes.length}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <div style="display:flex;gap:6px">
            <button class="small" data-action="edit" data-idx="${idx}">Sửa</button>
            <button class="small" data-action="remove" data-idx="${idx}">Xóa</button>
          </div>
          <div style="display:flex;gap:6px">
            <button class="small" data-action="up" data-idx="${idx}">▲</button>
            <button class="small" data-action="down" data-idx="${idx}">▼</button>
          </div>
        </div>
      `;
      frag.appendChild(row);
    });
    wrap.appendChild(frag);
  }

  function escape(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // form helpers for episodes
  function renderEpisodesEditor(list = []){
    const wrap = dom.episodesEditor; if(!wrap) return;
    wrap.innerHTML = '';
    (list || []).forEach((ep, i) => {
      const div = document.createElement('div'); div.className='ep-row';
      div.innerHTML = `
        <input class="small" data-ep-index="${i}" data-ep-field="name" placeholder="Tên tập" value="${escape(ep.name||'')}" style="flex:1"/>
        <input class="small" data-ep-index="${i}" data-ep-field="driveId" placeholder="driveId" value="${escape(ep.driveId||'')}" style="width:300px"/>
        <button class="small" data-ep-action="del" data-ep-index="${i}">Xóa</button>
      `;
      wrap.appendChild(div);
    });
    // attach listeners delegated
  }

  function readEpisodesFromEditor(){
    const wrap = dom.episodesEditor; if(!wrap) return [];
    const rows = Array.from(wrap.querySelectorAll('.ep-row'));
    const out = rows.map(r => {
      const name = (r.querySelector('[data-ep-field="name"]')||{value:''}).value.trim();
      const driveId = (r.querySelector('[data-ep-field="driveId"]')||{value:''}).value.trim();
      return { name, driveId };
    }).filter(e => e.name || e.driveId);
    return out;
  }

  // form read/write
  function readForm(){
    const title = dom.title.value.trim();
    const year = dom.year.value ? Number(dom.year.value) : undefined;
    const poster = dom.poster.value.trim();
    const driveId = dom.driveId.value.trim();
    const duration = dom.duration.value.trim();
    const rating = dom.rating.value ? Number(dom.rating.value) : undefined;
    const category = dom.category.value.trim();
    const desc = dom.desc.value.trim();
    const genre = (dom.genre.value||'').split(',').map(s=>s.trim()).filter(Boolean);
    const episodes = readEpisodesFromEditor();
    return { title, year, poster, driveId, duration, rating, category, desc, genre, episodes: episodes.length? episodes: undefined };
  }
  function fillForm(m){
    dom.title.value = m.title||'';
    dom.year.value = m.year||'';
    dom.poster.value = m.poster||'';
    dom.driveId.value = m.driveId||'';
    dom.duration.value = m.duration||'';
    dom.rating.value = m.rating||'';
    dom.category.value = m.category||'';
    dom.desc.value = m.desc||'';
    dom.genre.value = (m.genre||[]).join(', ');
    renderEpisodesEditor(m.episodes||[]);
    editingId = m.id;
    dom.addBtn.textContent = 'Lưu thay đổi';
  }
  function clearForm(){
    dom.title.value=''; dom.year.value=''; dom.poster.value=''; dom.driveId.value='';
    dom.duration.value=''; dom.rating.value=''; dom.category.value=''; dom.desc.value=''; dom.genre.value='';
    renderEpisodesEditor([]);
    editingId = null;
    dom.addBtn.textContent='Thêm vào list';
  }

  // CRUD
  function addOrSave(){
    const data = readForm();
    if(!data.title || (!data.driveId && !data.episodes)) { toast('Cần title và driveId hoặc episodes', 'error'); return; }
    if(editingId){
      const idx = movies.findIndex(x=>x.id===editingId); if(idx===-1){ toast('Item không tồn tại', 'error'); return; }
      movies[idx] = { ...movies[idx], ...data, updatedAt: new Date().toISOString() };
      toast('Đã lưu thay đổi','success');
    } else {
      const newItem = { id: uid(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      movies.push(newItem); toast('Đã thêm phim','success');
    }
    saveLocal(); render(); clearForm();
  }
  function startEdit(idx){
    const m = movies[idx]; if(!m) return; fillForm(m);
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function removeAt(idx){
    const m = movies[idx]; if(!m) return;
    if(!confirm(`Xác nhận xóa #${m.id} — ${m.title}?`)) return;
    movies.splice(idx,1); saveLocal(); render(); toast('Đã xóa','success');
  }
  function moveUp(idx){ if(idx<=0) return; [movies[idx-1],movies[idx]]=[movies[idx],movies[idx-1]]; saveLocal(); render(); }
  function moveDown(idx){ if(idx>=movies.length-1) return; [movies[idx+1],movies[idx]]=[movies[idx],movies[idx+1]]; saveLocal(); render(); }

  // load
  async function loadFromRaw(){ dom.status && (dom.status.textContent='Đang load từ raw...'); const r=await fetch(RAW_URL,{cache:'no-cache'}); if(!r.ok) throw new Error('Raw fetch failed:'+r.status); const j=await r.json(); return Array.isArray(j)?j:[]; }
  async function loadLocalFallback(){ try{ const r=await fetch('https://raw.githubusercontent.com/crytals-sc/json-link/refs/heads/img/lib/movies.json'); if(!r.ok) return []; const j=await r.json(); return Array.isArray(j)?j:[]; }catch(e){return []} }

  async function loadInitial(){
    setBusy(dom.addBtn,true); loadLocal();
    if(movies && movies.length){ render(); dom.status && (dom.status.textContent='Loaded từ local'); setBusy(dom.addBtn,false); return; }
    try{
      const list = await loadFromRaw(); movies = list.slice(); saveLocal(); render(); dom.status && (dom.status.textContent='Đã tải từ raw GitHub');
    }catch(e){
      console.warn('raw failed',e);
      const fallback = await loadLocalFallback(); movies = fallback.slice(); saveLocal(); render(); dom.status && (dom.status.textContent='Dùng fallback local');
    } finally { loadConf(); setBusy(dom.addBtn,false); }
  }

  // GitHub helpers
  async function ghGet(token, repo, path, branch='main'){
    const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
    const res = await fetch(url, { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } });
    if(res.status===404) return null;
    if(!res.ok){ const t=await res.text(); throw new Error('GET failed '+res.status+': '+t); }
    return await res.json();
  }
  async function ghPut(token, repo, path, contentStr, branch='main', sha){
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    const body = { message:`Update ${path} via Movie Editor`, content: encodeContent(contentStr), branch }; if(sha) body.sha=sha;
    const res = await fetch(url, { method:'PUT', headers:{ Authorization:`token ${token}`, Accept:'application/vnd.github.v3+json', 'Content-Type':'application/json' }, body: JSON.stringify(body) });
    const j = await res.json();
    if(!res.ok) throw new Error((j && j.message) ? j.message : 'PUT failed');
    return j;
  }

  // commit
  async function commitToGithub(){
    const token = dom.tokenInput.value.trim(); const repo = dom.repoInput.value.trim(); const branch = dom.branchInput.value.trim()||'main';
    if(!token || !repo){ toast('Nhập token và repo', 'error'); return; } if(!movies.length){ toast('Danh sách rỗng', 'error'); return; }
    setBusy(dom.commitBtn,true); dom.status && (dom.status.textContent='Đang kiểm tra file trên GitHub...');
    try{
      let file = null;
      for(const p of DEFAULT_PATHS){
        try{ file = await ghGet(token, repo, p, branch); if(file){ file.path=p; break; } }catch(e){}
      }
      const path = file && file.path ? file.path : 'movies.json';
      const contentStr = JSON.stringify(movies, null, 2);
      dom.status && (dom.status.textContent='Đang commit...');
      const res = await ghPut(token, repo, path, contentStr, branch, file && file.sha ? file.sha : undefined);
      dom.status && (dom.status.textContent = `Commit thành công (${res && res.commit ? res.commit.sha || '' : ''})`);
      toast('Commit thành công','success'); saveConf();
    }catch(err){ console.error('commit err',err); dom.status && (dom.status.textContent='Lỗi khi commit: '+(err.message||err)); toast('Lỗi khi commit: '+(err.message||err),'error'); }
    finally{ setBusy(dom.commitBtn,false); }
  }

  // events
  function bind(){
    if(dom.addBtn) dom.addBtn.addEventListener('click', addOrSave);
    if(dom.downloadBtn) dom.downloadBtn.addEventListener('click', ()=>{ if(!movies.length){toast('Danh sách rỗng','error'); return;} const blob=new Blob([JSON.stringify(movies,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='movies.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('Đã tải file','success'); });
    if(dom.listWrap) dom.listWrap.addEventListener('click', (e)=>{ const btn = e.target.closest('button'); if(!btn) return; const idx = Number(btn.dataset.idx); const action = btn.dataset.action; if(action==='edit') return startEdit(idx); if(action==='remove') return removeAt(idx); if(action==='up') return moveUp(idx); if(action==='down') return moveDown(idx); });
    if(dom.listWrap) dom.listWrap.addEventListener('dblclick', (e)=>{ const r = e.target.closest('.row'); if(!r) return; const id = r.dataset.id; const i = movies.findIndex(x=>x.id===id); if(i>=0) startEdit(i); });
    if(dom.addEpisode) dom.addEpisode.addEventListener('click', ()=>{ const eps = readEpisodesFromEditor(); eps.push({name:'Tập '+(eps.length+1), driveId:''}); renderEpisodesEditor(eps); });
    if(dom.clearEpisodes) dom.clearEpisodes.addEventListener('click', ()=>{ if(confirm('Xóa tất cả tập?')) renderEpisodesEditor([]); });
    if(dom.episodesEditor) dom.episodesEditor.addEventListener('click', (e)=>{ const btn = e.target.closest('button[data-ep-action]'); if(!btn) return; const idx = Number(btn.dataset.epIndex); const eps = readEpisodesFromEditor(); eps.splice(idx,1); renderEpisodesEditor(eps); });
    if(dom.commitBtn) dom.commitBtn.addEventListener('click', commitToGithub);
    if(dom.title) dom.title.addEventListener('keydown', (e)=>{ if(e.key==='Enter') addOrSave(); });
  }

  // init
  (function init(){ loadLocal(); loadConf(); bind(); loadInitial(); window.__movieEditor={get:()=>movies,set:(m)=>{movies=Array.isArray(m)?m:[];saveLocal();render();},clear:()=>{movies=[];saveLocal();render();}} })();

})();
