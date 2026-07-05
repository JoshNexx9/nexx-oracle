/**
 * NEXX Vault — encrypted personal file portal
 */
(function () {
  const $ = (id) => document.getElementById(id);

  function fmtSize(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  function fmtDate(ts) {
    return new Date(ts * 1000).toLocaleString();
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      ...opts,
    });
    if (res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    }
    if (!res.ok) throw new Error(res.statusText);
    return res;
  }

  function showApp(user) {
    $('login-panel').hidden = true;
    $('vault-app').hidden = false;
    $('vault-user').textContent = user;
    loadInfo();
    loadFiles();
  }

  function showLogin(err) {
    $('login-panel').hidden = false;
    $('vault-app').hidden = true;
    const el = $('login-error');
    if (err) {
      el.hidden = false;
      el.textContent = err;
    } else {
      el.hidden = true;
    }
  }

  async function checkSession() {
    try {
      const data = await api('/api/vault/session');
      if (data.ok) showApp(data.user);
    } catch {
      showLogin();
    }
  }

  async function loadInfo() {
    try {
      const info = await api('/api/vault/info');
      const port = location.port || '8765';
      const urls = (info.all_ips || [info.lan_ip]).map((ip) => `http://${ip}:${port}/`);
      $('lan-url').textContent = urls.join('  ·  ');
    } catch {
      $('lan-url').textContent = location.origin + '/';
    }
  }

  async function login(username, password) {
    await api('/api/vault/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    showApp(username);
  }

  async function logout() {
    await api('/api/vault/logout', { method: 'POST' });
    showLogin();
    $('password').value = '';
  }

  async function loadFiles() {
    const data = await api('/api/vault/files');
    const list = $('file-list');
    const files = data.files || [];
    $('file-count').textContent = files.length ? `(${files.length})` : '';

    if (!files.length) {
      list.innerHTML = '<p class="field-hint">No files yet. Upload from iPhone or desktop.</p>';
      return;
    }

    list.innerHTML = '';
    files.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'vault-file-row';
      row.innerHTML = `
        <div class="vault-file-meta">
          <strong>${escapeHtml(f.name)}</strong>
          <span>${fmtSize(f.size)} · ${fmtDate(f.uploaded)}</span>
        </div>
        <div class="actions">
          <button type="button" class="btn-dl" data-id="${f.id}">Download</button>
          <button type="button" class="btn-del" data-id="${f.id}">Delete</button>
        </div>
      `;
      row.querySelector('.btn-dl').addEventListener('click', () => download(f.id, f.name));
      row.querySelector('.btn-del').addEventListener('click', () => removeFile(f.id));
      list.appendChild(row);
    });
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function download(id, name) {
    const a = document.createElement('a');
    a.href = `/api/vault/download?id=${encodeURIComponent(id)}`;
    a.download = name;
    a.click();
  }

  async function removeFile(id) {
    if (!confirm('Delete this file from the vault?')) return;
    await api(`/api/vault/file?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    loadFiles();
  }

  async function uploadFiles(fileList) {
    if (!fileList.length) return;
    const status = $('upload-status');
    status.textContent = `Encrypting & uploading ${fileList.length} file(s)…`;

    const form = new FormData();
    for (const f of fileList) {
      form.append('files', f, f.name);
    }

    try {
      const res = await fetch('/api/vault/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'upload failed');
      status.textContent = `Uploaded ${data.uploaded?.length || 0} file(s). Encrypted.`;
      loadFiles();
      setTimeout(() => { status.textContent = ''; }, 3000);
    } catch (e) {
      status.textContent = `Error: ${e.message}`;
    }
  }

  function init() {
    $('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await login($('username').value.trim(), $('password').value);
      } catch (err) {
        showLogin(err.message || 'Login failed');
      }
    });

    $('btn-logout').addEventListener('click', () => logout().catch(() => showLogin()));

    $('btn-pick').addEventListener('click', () => $('file-input').click());
    $('file-input').addEventListener('change', (e) => {
      uploadFiles([...e.target.files]);
      e.target.value = '';
    });

    const zone = $('upload-zone');
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      uploadFiles([...e.dataTransfer.files]);
    });

    checkSession().catch(() => {
      const note = $('vault-deploy-note');
      if (note) note.hidden = false;
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();