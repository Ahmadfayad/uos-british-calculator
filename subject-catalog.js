// Reuse the calculator's Supabase connection, admin session and Excel exporter.
const CATALOG_CATEGORIES = ['Languages','Social Studies','Sciences','Math','Arts and Design'];
const catalog = { rows: [], loadedAt: 0, loading: null, error: '' };
const catalogText = value => escHtml(String(value ?? '')).replace(/"/g, '&quot;');

function validateCatalogRows(rows) {
  if(!Array.isArray(rows) || rows.some(r => !Number.isSafeInteger(r.id) || r.id < 1 || !levelLabels[r.level] ||
    !CATALOG_CATEGORIES.includes(r.category) || typeof r.subject !== 'string' || !r.subject.trim() || r.subject.length > 120 ||
    typeof r.active !== 'boolean' || !Array.isArray(r.aliases) || r.aliases.length > 30 ||
    r.aliases.some(a => typeof a !== 'string' || a.length > 160) || typeof r.updated_at !== 'string')) throw Error('Invalid subject catalog received.');
  return rows;
}
function applySubjectCatalog(rows) {
  catalog.rows = validateCatalogRows(rows);
  allSubjects.splice(0, allSubjects.length, ...rows.filter(r => r.active).map(r => ({subject:r.subject,level:r.level,category:r.category,aliases:r.aliases})));
}
async function loadSubjectCatalog(force = false) {
  if(catalog.loading) return catalog.loading;
  if(!force && Date.now() - catalog.loadedAt < 60000) return catalog.rows;
  catalog.loading = (async () => {
    try {
      const rows = [];
      // ponytail: one catalog request for today's 154 rows; page only beyond 1000.
      for(let offset = 0;; offset += 1000) {
        const page = await sbFetch(`/rest/v1/subject_catalog?select=id,level,subject,category,aliases,active,updated_at&order=level.asc,subject.asc&limit=1000&offset=${offset}`, {signal:AbortSignal.timeout(5000)});
        validateCatalogRows(page); rows.push(...page);
        if(page.length < 1000) break;
      }
      applySubjectCatalog(rows); catalog.loadedAt = Date.now(); catalog.error = '';
      try { localStorage.setItem('subjectCatalog', JSON.stringify(rows)); } catch {}
      return rows;
    } catch(error) {
      catalog.error = 'Could not refresh subjects. Using the last saved catalog or built-in subjects.';
      return catalog.rows;
    } finally {
      const status = document.getElementById('subject-catalog-status');
      if(status) status.textContent = catalog.error;
    }
  })();
  try { return await catalog.loading; } finally { catalog.loading = null; }
}

async function renderSubjectCatalog() {
  const target = document.getElementById('admin-subject-catalog');
  if(!target || !_adminToken) return;
  await loadSubjectCatalog(true);
  if(catalog.error) { target.textContent = 'The catalog could not be loaded. Check the connection and reopen the admin page.'; return; }
  target.innerHTML = `<p class="teach-help">${catalog.rows.length} subjects. Categories affect eligibility. Grade conversion rules remain unchanged.</p>
    <div class="admin-actions"><label>Search <input id="catalog-search" type="search" placeholder="Subject or OCR alias" oninput="filterSubjectCatalog()"></label>
    <label>Level <select id="catalog-filter" onchange="filterSubjectCatalog()"><option value="">All levels</option>${Object.keys(levelLabels).map(level=>`<option value="${level}">${catalogText(levelLabels[level])}</option>`).join('')}</select></label>
    <button class="btn btn-primary" onclick="editCatalogSubject()">Add subject</button>
    <button class="btn btn-outline" onclick="exportSubjectCatalog('csv')">Export CSV</button>
    <button class="btn btn-outline" onclick="exportSubjectCatalog('xlsx')">Export XLSX</button></div>
    <p class="teach-help">Exports include the complete catalog. OCR aliases are alternative names printed on certificates. Inactive subjects remain here but are excluded from new subject selection and OCR matching.</p>
    <div id="catalog-form"></div><div class="ocr-table-wrap"><table class="ocr-table"><thead><tr><th>Level</th><th>Subject</th><th>Category</th><th>OCR aliases</th><th>Active</th><th>Actions</th></tr></thead><tbody id="catalog-table"></tbody></table></div>`;
  filterSubjectCatalog();
}
function filterSubjectCatalog() {
  const query = (document.getElementById('catalog-search')?.value || '').trim().toLowerCase();
  const level = document.getElementById('catalog-filter')?.value || '';
  const rows = catalog.rows.filter(r => (!level || r.level === level) && (!query || [r.subject,...r.aliases].join(' ').toLowerCase().includes(query)));
  document.getElementById('catalog-table').innerHTML = rows.map(r=>`<tr><td>${catalogText(levelLabels[r.level])}</td><td>${catalogText(r.subject)}</td><td>${catalogText(r.category)}</td>
    <td>${catalogText(r.aliases.join(', '))}</td><td>${r.active ? 'Yes' : 'No'}</td><td class="admin-actions"><button class="btn btn-outline" onclick="editCatalogSubject(${r.id})">Edit</button><button class="btn btn-outline" onclick="deleteCatalogSubject(${r.id})">Delete</button></td></tr>`).join('') || '<tr><td colspan="6">No matching subjects.</td></tr>';
}
function editCatalogSubject(id) {
  const row = catalog.rows.find(r=>r.id === id) || {level:'o-level',subject:'',category:'Languages',aliases:[],active:true};
  const target = document.getElementById('catalog-form');
  target.innerHTML = `<form class="teach-form" onsubmit="event.preventDefault();saveCatalogSubject(${id || 'null'})">
    <label>Level<select id="catalog-level">${Object.keys(levelLabels).map(l=>`<option value="${l}"${l === row.level ? ' selected' : ''}>${catalogText(levelLabels[l])}</option>`).join('')}</select></label>
    <label>Subject name<input id="catalog-name" required maxlength="120" value="${catalogText(row.subject)}"></label>
    <label>Category<select id="catalog-category">${CATALOG_CATEGORIES.map(c=>`<option${c === row.category ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
    <label class="teach-keywords">OCR aliases (one per line)<textarea id="catalog-aliases" rows="3" maxlength="4000">${catalogText(row.aliases.join('\n'))}</textarea></label>
    <label><input type="checkbox" id="catalog-active"${row.active ? ' checked' : ''}> Active</label>
    <button class="btn btn-primary" id="catalog-save">Save subject</button><button class="btn btn-outline" type="button" onclick="document.getElementById('catalog-form').innerHTML=''">Cancel</button>
    <p id="catalog-message" role="status"></p></form>`;
  target.querySelector('#catalog-name').focus();
  target.scrollIntoView({block:'nearest'});
}
async function saveCatalogSubject(id) {
  if(!_adminToken) return;
  const message = document.getElementById('catalog-message'), button = document.getElementById('catalog-save');
  const row = catalog.rows.find(r=>r.id === id);
  if(id && !row) {message.textContent='Refresh the catalog before editing this subject.';return;}
  const data = {level:document.getElementById('catalog-level').value,subject:document.getElementById('catalog-name').value.trim(),category:document.getElementById('catalog-category').value,
    aliases:[...new Set(document.getElementById('catalog-aliases').value.split('\n').map(a=>a.trim()).filter(Boolean))],active:document.getElementById('catalog-active').checked};
  if(!data.subject || data.subject.length > 120 || !levelLabels[data.level] || !CATALOG_CATEGORIES.includes(data.category) || data.aliases.length > 30 || data.aliases.some(a=>a.length > 160)) {message.textContent='Enter a valid name, level and category; use at most 30 aliases of 160 characters each.';return;}
  if(catalog.rows.some(r=>r.id !== id && r.level === data.level && r.subject.toLowerCase() === data.subject.toLowerCase())) {message.textContent='This subject already exists at this level. Edit its existing row.';return;}
  // Preserve a renamed subject as an OCR alias, including existing certificates.
  if(row && row.subject !== data.subject && !data.aliases.includes(row.subject)) data.aliases.push(row.subject);
  if(data.aliases.length > 30) {message.textContent='Leave room for the previous name as an alias (maximum 30).';return;}
  button.disabled=true;
  try {
    const path='/rest/v1/subject_catalog'+(id ? `?id=eq.${id}&updated_at=eq.${encodeURIComponent(row.updated_at)}` : '');
    const saved=await sbFetch(path,{method:id ? 'PATCH' : 'POST',token:_adminToken,body:data});
    if(!Array.isArray(saved) || saved.length !== 1) throw Error('This subject changed in another session. Refresh the catalog before editing again.');
    markResultsStale();
    await renderSubjectCatalog();
  } catch(error) {message.textContent=/409/.test(error.message) ? 'This subject already exists at this level.' : error.message;button.disabled=false;}
}
function deleteCatalogSubject(id) {
  const row=catalog.rows.find(r=>r.id === id);
  if(!row || !_adminToken) return;
  appConfirm({title:'Delete subject?',message:`Delete ${row.subject} (${levelLabels[row.level]})? Existing student entries stay unchanged. You can set Active to off instead.`,okText:'Delete',onConfirm:async()=>{
    try {
      const removed=await sbFetch(`/rest/v1/subject_catalog?id=eq.${id}&updated_at=eq.${encodeURIComponent(row.updated_at)}`,{method:'DELETE',token:_adminToken});
      if(!Array.isArray(removed) || removed.length !== 1) throw Error('This subject changed in another session. Refresh before deleting.');
      markResultsStale(); await renderSubjectCatalog();
    } catch(error) {appAlert(error.message);}
  }});
}
function subjectCatalogExportRows() {
  const safe = value => /^[\s]*[=+@-]/.test(String(value)) ? "'"+value : String(value);
  return [['Level','Subject','Category','OCR aliases','Active'],...catalog.rows.map(r=>[levelLabels[r.level],r.subject,r.category,r.aliases.join('; '),r.active ? 'Yes' : 'No'].map(safe))];
}
function exportSubjectCatalog(format) {
  const rows=subjectCatalogExportRows();
  if(format === 'xlsx') {loadXLSX(()=>{const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(rows),'Subjects');XLSX.writeFile(book,'subject-catalog.xlsx');});return;}
  const csv='\ufeff'+rows.map(row=>row.map(cell=>'"'+cell.replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='subject-catalog.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

try {const saved=localStorage.getItem('subjectCatalog');if(saved) applySubjectCatalog(JSON.parse(saved));} catch {}
loadSubjectCatalog();
