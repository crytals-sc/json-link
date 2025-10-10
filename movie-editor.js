// assets/js/movie-editor.js
// Full editor: load from GitHub, CRUD (episodes supported), edit-on-click, download, commit via GitHub API
// Hỗ trợ nhiều categories cho một phim
(() => {
  const RAW_URL = 'https://raw.githubusercontent.com/crytals-sc/json-link/refs/heads/main/movies.json';
  const STORAGE_KEY = 'movie-editor.v3';
  const GITHUB_CONF_KEY = 'movie-editor.v3.conf';
  const DEFAULT_PATHS = ['movies.json', 'data/movies.json'];
  
  // Danh sách categories có sẵn
  const ALL_CATEGORIES = ['phim-le', 'phim-bo', 'hoat-hinh', 'tv-show', 'tai-lieu'];

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
    duration: $('duration'), rating: $('rating'), 
    categoryCheckboxes: $('categoryCheckboxes'), // Container cho checkboxes
    genre: $('genre'), desc: $('desc'),
    episodesEditor: $('episodesEditor'), addEpisode: $('addEpisode'), clearEpisodes: $('clearEpisodes'),
    commitBtn: $('commitToGithub'), tokenInput: $('githubToken'), repoInput: $('githubRepo'),
    branchInput: $('githubBranch'), status: $('githubStatus'), formStatus: $('formStatus')
  };

  // state
  let movies = [];
  let editingId = null;

  // storage
  function loadLocal(){ 
    try{ 
      const raw=localStorage.getItem(STORAGE_KEY); 
      if(raw) movies=JSON.parse(raw);
    }catch(e){movies=[]}
  }
  
  function saveLocal(){ 
    try{ 
      localStorage.setItem(STORAGE_KEY,JSON.stringify(movies)); 
    }catch(e){} 
  }
  
  function loadConf(){ 
    try{ 
      const raw=localStorage.getItem(GITHUB_CONF_KEY); 
      if(raw){ 
        const c=JSON.parse(raw); 
        if(c.repo) dom.repoInput.value=c.repo; 
        if(c.branch) dom.branchInput.value=c.branch; 
      } 
    }catch(e){}
  }
  
  function saveConf(){ 
    try{ 
      const c={
        repo:dom.repoInput.value.trim(),
        branch:dom.branchInput.value.trim()||'main'
      }; 
      localStorage.setItem(GITHUB_CONF_KEY,JSON.stringify(c)); 
    }catch(e){} 
  }

  // Render category checkboxes trong form
  function renderCategoryCheckboxes() {
    const container = dom.categoryCheckboxes;
    if (!container) return;
    
    container.innerHTML = '';
    const frag = document.createDocumentFragment();
    
    ALL_CATEGORIES.forEach(cat => {
      const label = document.createElement('label');
      label.className = 'category-checkbox-label';
      label.innerHTML = `
        <input type="checkbox" value="${escape(cat)}" class="category-checkbox" />
        <span>${escape(cat)}</span>
      `;
      frag.appendChild(label);
    });
    
    container.appendChild(frag);
  }

  // Lấy categories đã chọn từ checkboxes
  function getSelectedCategories() {
    const container = dom.categoryCheckboxes;
    if (!container) return [];
    
    const checked = Array.from(container.querySelectorAll('.category-checkbox:checked'))
      .map(cb => cb.value);
    return checked;
  }

  // Set categories vào checkboxes
  function setSelectedCategories(categories) {
    const container = dom.categoryCheckboxes;
    if (!container) return;
    
    // Reset tất cả checkboxes
    const allCheckboxes = container.querySelectorAll('.category-checkbox');
    allCheckboxes.forEach(cb => cb.checked = false);
    
    // Chuẩn hóa categories thành mảng
    const cats = Array.isArray(categories) ? categories : 
                 (categories ? [categories] : []);
    
    // Check các categories tương ứng
    cats.forEach(cat => {
      const checkbox = container.querySelector(`.category-checkbox[value="${cat}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }

  // Format categories để hiển thị
  function formatCategories(category) {
    if (!category) return '<span class="muted">Chưa có category</span>';
    
    const cats = Array.isArray(category) ? category : [category];
    return cats.map(cat => `<span class="category-tag">${escape(cat)}</span>`).join('');
  }

  // render list (cards/rows)
  function render(){
    const wrap = dom.listWrap; 
    if(!wrap) return;
    
    wrap.innerHTML = '';
    if(!movies.length){ 
      wrap.innerHTML = '<div class="muted" style="text-align:center;padding:40px">Danh sách rỗng. Hãy thêm phim mới!</div>'; 
      return; 
    }
    
    const frag = document.createDocumentFragment();
    movies.forEach((m, idx) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.id = m.id;
      row.innerHTML = `
        <img class="poster-mini" src="${escape(m.poster||'')}" onerror="this.style.visibility='hidden'"/>
        <div style="flex:1">
          <div style="font-weight:600">#${escape(m.id)} — ${escape(m.title||'(No title)')}</div>
          <div class="muted" style="font-size:12px">
            ${m.year||''} 
            ${m.duration? '• '+escape(m.duration):''} 
            ${m.genre && m.genre.length? '• '+escape(m.genre.join(', ')) : ''}
          </div>
          <div style="margin-top:6px;font-size:13px">${escape(m.desc||'').substring(0, 100)}${m.desc && m.desc.length > 100 ? '...' : ''}</div>
          <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">
            ${formatCategories(m.category)}
          </div>
          ${m.episodes ? `<div class="muted" style="margin-top:6px">📺 ${m.episodes.length} tập</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;margin-left:16px">
          <div style="display:flex;gap:6px">
            <button class="small" data-action="edit" data-idx="${idx}">✏️ Sửa</button>
            <button class="small danger" data-action="remove" data-idx="${idx}">🗑️ Xóa</button>
          </div>
          <div style="display:flex;gap:6px">
            <button class="small" data-action="up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button class="small" data-action="down" data-idx="${idx}" ${idx === movies.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
        </div>
      `;
      frag.appendChild(row);
    });
    wrap.appendChild(frag);
  }

  function escape(s){ 
    return String(s||'').replace(/[&<>"']/g,c=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c])); 
  }

  // form helpers for episodes
  function renderEpisodesEditor(list = []){
    const wrap = dom.episodesEditor; 
    if(!wrap) return;
    
    wrap.innerHTML = '';
    if (list.length === 0) {
      wrap.innerHTML = '<div class="muted" style="text-align:center;padding:12px">Chưa có tập nào</div>';
      return;
    }
    
    (list || []).forEach((ep, i) => {
      const div = document.createElement('div'); 
      div.className='ep-row';
      div.innerHTML = `
        <input class="small" data-ep-index="${i}" data-ep-field="name" 
               placeholder="Tên tập" value="${escape(ep.name||'')}" style="flex:1"/>
        <input class="small" data-ep-index="${i}" data-ep-field="driveId" 
               placeholder="driveId" value="${escape(ep.driveId||'')}" style="width:300px"/>
        <button class="small danger" data-ep-action="del" data-ep-index="${i}">Xóa</button>
      `;
      wrap.appendChild(div);
    });
  }

  function readEpisodesFromEditor(){
    const wrap = dom.episodesEditor; 
    if(!wrap) return [];
    
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
    
    // Đọc categories từ checkboxes
    const category = getSelectedCategories();
    
    const desc = dom.desc.value.trim();
    const genre = (dom.genre.value||'').split(',').map(s=>s.trim()).filter(Boolean);
    const episodes = readEpisodesFromEditor();
    
    return { 
      title, year, poster, driveId, duration, rating, 
      category: category.length > 0 ? category : undefined, 
      desc, genre, 
      episodes: episodes.length? episodes: undefined 
    };
  }
  
  function fillForm(m){
    dom.title.value = m.title||'';
    dom.year.value = m.year||'';
    dom.poster.value = m.poster||'';
    dom.driveId.value = m.driveId||'';
    dom.duration.value = m.duration||'';
    dom.rating.value = m.rating||'';
    
    // Set categories vào checkboxes
    setSelectedCategories(m.category);
    
    dom.desc.value = m.desc||'';
    dom.genre.value = (m.genre||[]).join(', ');
    renderEpisodesEditor(m.episodes||[]);
    editingId = m.id;
    dom.addBtn.textContent = '💾 Lưu thay đổi';
  }
  
  function clearForm(){
    dom.title.value=''; 
    dom.year.value=''; 
    dom.poster.value=''; 
    dom.driveId.value='';
    dom.duration.value=''; 
    dom.rating.value=''; 
    
    // Reset checkboxes
    setSelectedCategories([]);
    
    dom.desc.value=''; 
    dom.genre.value='';
    renderEpisodesEditor([]);
    editingId = null;
    dom.addBtn.textContent='➕ Thêm vào list';
  }

  // CRUD
  function addOrSave(){
    const data = readForm();
    
    // Validation
    if(!data.title) { 
      toast('❌ Cần nhập tên phim', 'error'); 
      dom.title.focus();
      return; 
    }
    
    if(!data.driveId && !data.episodes) { 
      toast('❌ Cần driveId hoặc danh sách tập phim', 'error'); 
      return; 
    }
    
    if(!data.category || data.category.length === 0) {
      toast('❌ Vui lòng chọn ít nhất 1 category', 'error');
      return;
    }
    
    if(editingId){
      const idx = movies.findIndex(x=>x.id===editingId); 
      if(idx===-1){ 
        toast('❌ Item không tồn tại', 'error'); 
        return; 
      }
      movies[idx] = { 
        ...movies[idx], 
        ...data, 
        updatedAt: new Date().toISOString() 
      };
      toast('✅ Đã lưu thay đổi','success');
    } else {
      const newItem = { 
        id: uid(), 
        ...data, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };
      movies.push(newItem); 
      toast('✅ Đã thêm phim','success');
    }
    
    saveLocal(); 
    render(); 
    clearForm();
  }
  
  function startEdit(idx){
    const m = movies[idx]; 
    if(!m) return; 
    fillForm(m);
    window.scrollTo({top:0,behavior:'smooth'});
  }
  
  function removeAt(idx){
    const m = movies[idx]; 
    if(!