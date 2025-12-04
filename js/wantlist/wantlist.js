/* ========= Configuration ========= */
const STORAGE_KEY = 'mytool_wishlist_v1';

/* color list provided by user */
const COLOR_LIST = ["#f0f8ff","#87cefa","#fff0f5","#7fffd4","#fafad2","#ee82ee"];

/* ========= State ========= */
let items = []; // array of item objects
let activeTab = 'this_year';
let editingId = null; // null = new item, otherwise id of item being edited
let selectedColor = COLOR_LIST[0];

/* ========= Helpers ========= */
function uid(){ return 'id_'+Date.now()+'_'+Math.floor(Math.random()*9999); }

function saveToStorage(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadFromStorage(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return [];
  try{
    const parsed = JSON.parse(raw);
    if(Array.isArray(parsed)) return parsed;
  }catch(e){}
  return [];
}

/* ========= Rendering ========= */
const gridEl = document.getElementById('grid');
const emptyEl = document.getElementById('empty');

function render(){
  gridEl.innerHTML = '';
  const list = items.filter(it => it.category === activeTab);
  if(list.length === 0){
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
  }

  list.sort((a,b)=> b.createdAt - a.createdAt);
  list.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card' + (item.done ? ' done' : '');
    card.setAttribute('data-id', item.id);

    // top image or placeholder
    const imgWrap = document.createElement('div');
    imgWrap.className = 'imgWrap';
    if(item.image){
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.title || '';
      imgWrap.appendChild(img);
    } else {
      imgWrap.style.background = item.color || '#fff';
      imgWrap.innerHTML = `<div style="font-weight:700;color:rgba(255,255,255,0.8);font-size:12px;">${item.title ? item.title.slice(0,18) : ''}</div>`;
    }

    // when image exists, overlay a tint using selected color (subtle)
    if(item.image && item.color){
      imgWrap.style.background = item.color;
    }

    // body
    const body = document.createElement('div');
    body.className = 'body';
    body.style.background = item.color ? item.color+'10' : 'transparent'; // slight tint

    // title
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = item.title || '(無題)';
    body.appendChild(title);

    // meta row
    const meta = document.createElement('div');
    meta.className = 'meta';
    const cat = document.createElement('div');
    cat.textContent = item.category === 'this_year' ? '今年' : '人生';
    cat.style.fontWeight = 700;
    meta.appendChild(cat);
    if(item.createdAt){
      const d = new Date(item.createdAt);
      const date = document.createElement('div');
      date.textContent = d.toLocaleDateString();
      date.style.opacity = .7;
      meta.appendChild(date);
    }
    body.appendChild(meta);

    // memo
    if(item.memo){
      const memo = document.createElement('div');
      memo.className = 'memo';
      memo.textContent = item.memo;
      body.appendChild(memo);
    }

    // actions
    const actions = document.createElement('div');
    actions.className = 'actions';

    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn icon';
    doneBtn.title = item.done ? '未達成に戻す' : '達成にする';
    doneBtn.innerHTML = item.done ? '🔄 未達' : '✅ 達成';
    doneBtn.onclick = (e) => {
      e.stopPropagation();
      toggleDone(item.id);
    };
    actions.appendChild(doneBtn);

    const editBtn = document.createElement('button');
    editBtn.className = 'btn icon';
    editBtn.innerHTML = '✏️ 編集';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      openModalForEdit(item.id);
    };
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn icon';
    delBtn.style.color = '#b33';
    delBtn.innerHTML = '🗑️ 削除';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if(confirm('本当に削除しますか？')) deleteItem(item.id);
    };
    actions.appendChild(delBtn);

    card.appendChild(imgWrap);
    card.appendChild(body);
    card.appendChild(actions);

    // clicking card opens edit as well
    card.onclick = () => openModalForEdit(item.id);

    gridEl.appendChild(card);
  });
}

/* ========= CRUD ========= */
function addItem(data){
  items.push({
    id: uid(),
    title: data.title || '',
    category: data.category || 'this_year',
    color: data.color || COLOR_LIST[0],
    image: data.image || null,
    memo: data.memo || '',
    done: !!data.done,
    createdAt: Date.now()
  });
  saveToStorage();
  render();
}

function updateItem(id, data){
  const idx = items.findIndex(i => i.id === id);
  if(idx === -1) return;
  items[idx] = {
    ...items[idx],
    ...data
  };
  saveToStorage();
  render();
}

function deleteItem(id){
  items = items.filter(i => i.id !== id);
  saveToStorage();
  render();
}

function toggleDone(id){
  const idx = items.findIndex(i => i.id === id);
  if(idx === -1) return;
  items[idx].done = !items[idx].done;
  saveToStorage();
  render();
}

/* ========= Modal / Form handling ========= */
const modalBackdrop = document.getElementById('modalBackdrop');
const fab = document.getElementById('fab');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');

const titleInput = document.getElementById('titleInput');
const categorySelect = document.getElementById('categorySelect');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const memoInput = document.getElementById('memoInput');
const doneInput = document.getElementById('doneInput');
const swatchesEl = document.getElementById('swatches');

function openModal(isNew = true){
  modalBackdrop.style.display = 'flex';
  modalBackdrop.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  if(isNew){
    document.getElementById('modalTitle').textContent = '新しいやりたいこと';
    deleteBtn.style.display = 'none';
    editingId = null;
    resetForm();
  }
}

function closeModal(){
  modalBackdrop.style.display = 'none';
  modalBackdrop.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  editingId = null;
}

function resetForm(){
  titleInput.value = '';
  categorySelect.value = activeTab; // default to current tab
  selectedColor = COLOR_LIST[0];
  renderSwatches();
  imageInput.value = '';
  imagePreview.innerHTML = '<div style="font-size:12px;color:#99a">画像なし</div>';
  memoInput.value = '';
  doneInput.checked = false;
}

function openModalForEdit(id){
  const it = items.find(x => x.id === id);
  if(!it) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'カードを編集';
  deleteBtn.style.display = 'inline-block';
  titleInput.value = it.title;
  categorySelect.value = it.category;
  selectedColor = it.color || COLOR_LIST[0];
  renderSwatches();
  memoInput.value = it.memo || '';
  doneInput.checked = !!it.done;
  if(it.image){
    imagePreview.innerHTML = `<img src="${it.image}" style="height:64px;width:100%;object-fit:cover">`;
  }else{
    imagePreview.innerHTML = '<div style="font-size:12px;color:#99a">画像なし</div>';
  }
  modalBackdrop.style.display = 'flex';
  modalBackdrop.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}

/* ========= Swatches UI ========= */
function renderSwatches(){
  swatchesEl.innerHTML = '';
  COLOR_LIST.forEach(col => {
    const s = document.createElement('div');
    s.className = 'swatch' + (col === selectedColor ? ' selected' : '');
    s.style.background = col;
    s.title = col;
    s.onclick = (e) => {
      selectedColor = col;
      renderSwatches();
    };
    swatchesEl.appendChild(s);
  });
}

/* ========= Image handling ========= */
let lastSelectedImageData = null;
imageInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if(!file){ lastSelectedImageData = null; imagePreview.innerHTML = '<div style="font-size:12px;color:#99a">画像なし</div>'; return; }
  if(!file.type.startsWith('image/')) { alert('画像ファイルを選択してください'); return; }
  const fr = new FileReader();
  fr.onload = () => {
    lastSelectedImageData = fr.result; // base64 string
    imagePreview.innerHTML = `<img src="${lastSelectedImageData}" style="height:64px;width:100%;object-fit:cover">`;
  };
  fr.readAsDataURL(file);
});

/* ========= Modal buttons ========= */
fab.addEventListener('click', () => {
  openModal(true);
});

closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => {
  if(e.target === modalBackdrop) closeModal();
});

saveBtn.addEventListener('click', () => {
  const title = titleInput.value.trim();
  if(!title){ alert('タイトルは必須です'); titleInput.focus(); return; }
  const payload = {
    title,
    category: categorySelect.value,
    color: selectedColor,
    image: lastSelectedImageData || null,
    memo: memoInput.value.trim(),
    done: doneInput.checked
  };

  if(editingId){
    updateItem(editingId, payload);
  } else {
    addItem(payload);
  }
  closeModal();
  lastSelectedImageData = null; // clear temp
});

deleteBtn.addEventListener('click', () => {
  if(!editingId) return;
  if(confirm('このカードを完全に削除しますか？')) {
    deleteItem(editingId);
    closeModal();
  }
});

/* ========= Tabs ========= */
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    activeTab = t.getAttribute('data-tab');
    render();
  });
});

/* ========= Init ========= */
function init(){
  // load storage
  items = loadFromStorage();
  // render swatches
  renderSwatches();
  // initial render
  render();
}
init();

/* Expose for debugging */
window._mytool = {
  items, render, saveToStorage, loadFromStorage
};