const state = {
  session: null,
  start: 0,
  limit: 50,
  total: 0,
  busy: false,
  editing: null,
};

const $ = (selector) => document.querySelector(selector);
const notice = $('#notice');

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body.detail;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail || response.statusText));
  }
  return body;
}

function showNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle('error', isError);
  notice.hidden = !message;
}

function setBusy(busy) {
  state.busy = busy;
  $('#downloadButton').disabled = busy;
  $('#uploadButton').disabled = busy || !state.session;
  $('#saveButton').disabled = busy || !state.session;
  $('#imageFile').disabled = busy;
  $('#radioModel').disabled = busy;
  $('#serialPort').disabled = busy;
  $('#refreshPorts').disabled = busy;
  const [low, high] = state.session?.memory_bounds || [0, 0];
  $('#previousPage').disabled = busy || state.start <= low;
  $('#nextPage').disabled = busy || state.start + state.limit > high;
}

async function loadRadios() {
  const radios = await api('/api/radios');
  const select = $('#radioModel');
  select.replaceChildren();
  radios.forEach((radio) => {
    const option = document.createElement('option');
    option.value = radio.id;
    option.textContent = radio.name;
    select.append(option);
  });
  if (!radios.length) {
    select.add(new Option('No clone-mode radios available', ''));
  }
}

async function loadPorts() {
  const ports = await api('/api/ports');
  const select = $('#serialPort');
  select.replaceChildren();
  ports.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.port;
    option.textContent = item.description
      ? `${item.port} — ${item.description}`
      : item.port;
    select.append(option);
  });
  if (!ports.length) {
    select.add(new Option('No serial ports detected', ''));
  }
}

function renderSession() {
  const details = $('#sessionInfo');
  const saveButton = $('#saveButton');
  if (!state.session) {
    details.hidden = true;
    saveButton.disabled = true;
    $('#uploadButton').disabled = true;
    $('#channelTitle').textContent = 'Your channels';
    $('#channelCount').textContent = 'Open an image to begin';
    $('#memoryRows').innerHTML = '<tr class="empty-state"><td colspan="7">Your channel list will appear here after you open an image.</td></tr>';
    $('#pageLabel').textContent = '—';
    setBusy(false);
    return;
  }
  details.hidden = false;
  details.textContent = `${state.session.name} · ${state.session.filename}${state.session.dirty ? ' · Unsaved changes' : ''}`;
  saveButton.disabled = state.busy;
  $('#uploadButton').disabled = state.busy || !state.session.supports_upload;
  $('#channelTitle').textContent = state.session.name;
  $('#channelCount').textContent = `${state.total.toLocaleString()} channels`;
}

function formatFrequency(value) {
  if (value === null || value === undefined || Number(value) === 0) return '—';
  return (Number(value) / 1_000_000).toFixed(6);
}

function renderMemories(memories) {
  const rows = $('#memoryRows');
  rows.replaceChildren();
  memories.forEach((memory) => {
    const row = document.createElement('tr');
    const channelName = memory.empty ? 'Empty' : (memory.name || '—');
    const values = [
      [String(memory.number)],
      [channelName, 'channel-name'],
      [formatFrequency(memory.freq), 'frequency'],
      [memory.mode || '—'],
      [memory.duplex ? `${memory.duplex} ${formatFrequency(memory.offset)}` : '—'],
      [memory.tmode || '—'],
    ];
    values.forEach(([value, className]) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      if (className) cell.className = className;
      row.append(cell);
    });
    const actionCell = document.createElement('td');
    const edit = document.createElement('button');
    edit.className = 'edit-button';
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => openEditor(memory));
    actionCell.append(edit);
    row.append(actionCell);
    rows.append(row);
  });
  if (!memories.length) {
    rows.innerHTML = '<tr class="empty-state"><td colspan="7">No channels in this range.</td></tr>';
  }
}

async function loadMemories() {
  if (!state.session) return;
  const result = await api(`/api/memories?start=${state.start}&limit=${state.limit}`);
  state.total = result.total;
  renderMemories(result.memories);
  const first = result.memories[0]?.number ?? result.start;
  const last = result.memories.at(-1)?.number ?? result.end - 1;
  $('#pageLabel').textContent = `${first}–${last} of ${result.total}`;
  $('#channelCount').textContent = `${result.total.toLocaleString()} channels`;
  const [low, high] = state.session.memory_bounds;
  $('#previousPage').disabled = state.busy || state.start <= low;
  $('#nextPage').disabled = state.busy || state.start + state.limit > high;
}

async function refreshSession() {
  state.session = await api('/api/session');
  state.start = state.session.memory_bounds[0];
  renderSession();
  await loadMemories();
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',', 2)[1]);
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

$('#imageFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) {
    showNotice('Choose an image smaller than 20 MB.', true);
    return;
  }
  const confirmReplace = Boolean(state.session?.dirty);
  if (confirmReplace && !window.confirm('Discard unsaved channel changes and open another image?')) {
    return;
  }
  try {
    setBusy(true);
    showNotice('Opening radio image…');
    await api('/api/session/open', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        data_base64: await readFileAsBase64(file),
        confirm_replace: confirmReplace,
      }),
    });
    await refreshSession();
    renderSession();
    showNotice('Radio image opened. Your edits remain on this computer.');
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    setBusy(false);
    renderSession();
  }
});

function downloadData(filename, dataBase64) {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

$('#saveButton').addEventListener('click', async () => {
  try {
    const result = await api('/api/session/save', { method: 'POST' });
    downloadData(result.filename, result.data_base64);
    state.session.dirty = false;
    renderSession();
    showNotice('Image saved to your computer.');
  } catch (error) {
    showNotice(error.message, true);
  }
});

function showProgress(job) {
  $('#transferProgress').hidden = false;
  $('#progressBar').style.width = `${job.progress}%`;
  $('#progressMessage').textContent = job.message;
  $('#progressPercent').textContent = `${job.progress}%`;
}

async function watchTransfer(job) {
  showProgress(job);
  while (job.state === 'running') {
    await new Promise((resolve) => setTimeout(resolve, 650));
    job = await api(`/api/transfers/${job.id}`);
    showProgress(job);
  }
  if (job.state === 'failed') throw new Error(job.error || 'Radio transfer failed.');
  if (job.operation === 'download') await refreshSession();
  return job;
}

$('#downloadButton').addEventListener('click', async () => {
  if (!$('#radioModel').value || !$('#serialPort').value) {
    showNotice('Select a radio model and serial port first.', true);
    return;
  }
  const confirmReplace = Boolean(state.session?.dirty);
  if (confirmReplace && !window.confirm(
      'Reading from the radio will replace your unsaved image changes. Continue?')) {
    return;
  }
  try {
    setBusy(true);
    $('#transferProgress').hidden = false;
    const job = await api('/api/transfers/download', {
      method: 'POST',
      body: JSON.stringify({
        radio_id: $('#radioModel').value,
        port: $('#serialPort').value,
        confirm_replace: confirmReplace,
      }),
    });
    await watchTransfer(job);
    showNotice('Radio read complete. Review the channel list and save the image.');
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    setBusy(false);
    renderSession();
  }
});

$('#uploadButton').addEventListener('click', async () => {
  if (!state.session || !$('#serialPort').value) {
    showNotice('Open a radio image and select a serial port first.', true);
    return;
  }
  if (!state.session.supports_upload) {
    showNotice('This file format cannot be written to a radio.', true);
    return;
  }
  if (!window.confirm(`Write ${state.session.name} to the connected radio? This replaces the radio's current channel programming.`)) {
    return;
  }
  try {
    setBusy(true);
    $('#transferProgress').hidden = false;
    const job = await api('/api/transfers/upload', {
      method: 'POST',
      body: JSON.stringify({ port: $('#serialPort').value, confirm: true }),
    });
    await watchTransfer(job);
    showNotice('Radio write complete.');
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    setBusy(false);
    renderSession();
  }
});

$('#refreshPorts').addEventListener('click', async () => {
  try {
    await loadPorts();
    showNotice('Serial port list refreshed.');
  } catch (error) {
    showNotice(error.message, true);
  }
});

function appendControl(container, labelText, field, value, choices, options = {}) {
  const label = document.createElement('label');
  label.textContent = labelText;
  if (options.wide) label.classList.add('wide');
  const control = choices ? document.createElement('select') : document.createElement('input');
  control.name = field;
  if (choices) {
    choices.forEach((choice) => {
      const option = document.createElement('option');
      option.value = String(choice);
      option.textContent = String(choice || 'None');
      control.append(option);
    });
  } else {
    control.type = options.type || 'text';
    if (options.step) control.step = options.step;
    if (options.maxLength) control.maxLength = options.maxLength;
  }
  control.value = value === null || value === undefined ? '' : String(value);
  control.disabled = options.disabled || false;
  label.append(control);
  container.append(label);
}

function openEditor(memory) {
  state.editing = memory;
  $('#editTitle').textContent = `Channel ${memory.number}`;
  const fields = $('#editFields');
  fields.replaceChildren();
  const features = state.session.features;
  const immutable = new Set(memory.immutable || []);
  const add = (text, key, val, choices, config = {}) =>
    appendControl(fields, text, key, val, choices, {
      ...config,
      disabled: immutable.has(key),
    });

  if (features.has_name) add('Name', 'name', memory.name, null, { maxLength: features.valid_name_length });
  add('Receive frequency (MHz)', 'freq', memory.freq ? (memory.freq / 1e6).toFixed(6) : '', null, { type: 'number', step: '0.000001' });
  if (features.has_mode) add('Mode', 'mode', memory.mode, features.valid_modes);
  add('Duplex', 'duplex', memory.duplex, features.valid_duplexes);
  if (features.has_offset) add('Offset (MHz)', 'offset', memory.offset ? (memory.offset / 1e6).toFixed(6) : '', null, { type: 'number', step: '0.000001' });
  if (features.valid_tmodes.length) add('Tone mode', 'tmode', memory.tmode, features.valid_tmodes);
  if (features.valid_tones.length) {
    add('Transmit tone', 'rtone', memory.rtone, features.valid_tones);
    if (features.has_ctone) add('Receive tone', 'ctone', memory.ctone, features.valid_tones);
  }
  if (features.has_dtcs) add('DTCS code', 'dtcs', memory.dtcs, features.valid_dtcs_codes);
  if (features.has_rx_dtcs) add('Receive DTCS', 'rx_dtcs', memory.rx_dtcs, features.valid_dtcs_codes);
  if (features.has_dtcs_polarity) add('DTCS polarity', 'dtcs_polarity', memory.dtcs_polarity, features.valid_dtcs_pols);
  if (features.has_cross) add('Cross mode', 'cross_mode', memory.cross_mode, features.valid_cross_modes);
  if (features.has_tuning_step) add('Tuning step (kHz)', 'tuning_step', memory.tuning_step, features.valid_tuning_steps);
  add('Scan skip', 'skip', memory.skip, features.valid_skips);
  if (features.has_comment) add('Comment', 'comment', memory.comment, null, { wide: true });
  $('#editDialog').showModal();
}

function closeEditor() {
  $('#editDialog').close();
  state.editing = null;
}

$('#closeEditor').addEventListener('click', closeEditor);
$('#cancelEdit').addEventListener('click', closeEditor);
$('#editForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.editing) return;
  const submit = $('#saveMemory');
  submit.disabled = true;
  const values = {};
  new FormData(event.currentTarget).forEach((value, key) => {
    if (key === 'freq' || key === 'offset') {
      values[key] = Math.round(Number(value) * 1_000_000);
    } else if (key === 'dtcs' || key === 'rx_dtcs') {
      values[key] = Number(value);
    } else if (key === 'rtone' || key === 'ctone' || key === 'tuning_step') {
      values[key] = Number(value);
    } else {
      values[key] = value;
    }
  });
  try {
    const result = await api(`/api/memories/${state.editing.number}`, {
      method: 'PATCH',
      body: JSON.stringify(values),
    });
    state.session.dirty = true;
    await loadMemories();
    closeEditor();
    showNotice(result.warnings.length
      ? `Channel saved with a driver warning: ${result.warnings.join('; ')}`
      : `Channel ${state.editing?.number ?? result.memory.number} saved.`);
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    submit.disabled = false;
    renderSession();
  }
});

$('#previousPage').addEventListener('click', async () => {
  state.start = Math.max(
    state.session.memory_bounds[0], state.start - state.limit);
  try { await loadMemories(); } catch (error) { showNotice(error.message, true); }
});
$('#nextPage').addEventListener('click', async () => {
  state.start += state.limit;
  try { await loadMemories(); } catch (error) { showNotice(error.message, true); }
});

async function initialize() {
  try {
    await Promise.all([loadRadios(), loadPorts()]);
    try {
      await refreshSession();
      renderSession();
    } catch {
      state.session = null;
      renderSession();
    }
  } catch (error) {
    showNotice(error.message, true);
  }
}

initialize();
