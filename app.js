const scans = [
  {
    id: crypto.randomUUID(),
    imageUrl: 'https://images.unsplash.com/photo-1453738773917-9c3eff1db985?auto=format&fit=crop&w=1200&q=80',
    student: 'Ava Thompson',
    assignment: 'Fractions Exit Ticket',
    topic: 'Equivalent Fractions',
    standard: 'CCSS.MATH.CONTENT.4.NF.A.1',
    capturedAt: '2026-02-02T09:12',
    annotations: []
  },
  {
    id: crypto.randomUUID(),
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
    student: 'Liam Chen',
    assignment: 'Number Talk Whiteboard',
    topic: 'Place Value',
    standard: 'CCSS.MATH.CONTENT.3.NBT.A.1',
    capturedAt: '2026-02-02T10:01',
    annotations: []
  },
  {
    id: crypto.randomUUID(),
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    student: 'Ava Thompson',
    assignment: 'Multiplication Strategy Check',
    topic: 'Area Models',
    standard: 'CCSS.MATH.CONTENT.4.NBT.B.5',
    capturedAt: '2026-02-03T08:44',
    annotations: []
  },
  {
    id: crypto.randomUUID(),
    imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1200&q=80',
    student: 'Noah Rivera',
    assignment: 'Word Problem Journal',
    topic: 'Two-Step Problems',
    standard: 'CCSS.MATH.CONTENT.3.OA.D.8',
    capturedAt: '2026-02-03T11:22',
    annotations: []
  },
  {
    id: crypto.randomUUID(),
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
    student: 'Mia Patel',
    assignment: 'Geometry Board Model',
    topic: 'Classifying Shapes',
    standard: 'CCSS.MATH.CONTENT.5.G.B.3',
    capturedAt: '2026-02-04T09:36',
    annotations: []
  },
  {
    id: crypto.randomUUID(),
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    student: 'Liam Chen',
    assignment: 'Student Explanation Video',
    topic: 'Comparing Decimals',
    standard: 'CCSS.MATH.CONTENT.5.NBT.A.3',
    capturedAt: '2026-02-04T13:18',
    annotations: []
  }
];

const labels = {
  student: 'Student',
  assignment: 'Assignment',
  topic: 'Math Topic',
  standard: 'Common Core'
};

const state = {
  sortKey: 'student',
  shuffle: false,
  selectedId: null,
  tool: null,
  drawing: null,
  viewMode: 'plane',
  activeCluster: null
};

const sortButtons = document.getElementById('sortButtons');
const gallery = document.getElementById('gallery');
const clusterPlane = document.getElementById('clusterPlane');
const summary = document.getElementById('summary');
const viewHint = document.getElementById('viewHint');
const zoomOutButton = document.getElementById('zoomOutButton');
const shuffleToggle = document.getElementById('shuffleToggle');
const template = document.getElementById('cardTemplate');
const focusModal = document.getElementById('focusModal');
const closeModal = document.getElementById('closeModal');
const focusImage = document.getElementById('focusImage');
const annotationLayer = document.getElementById('annotationLayer');
const metaForm = document.getElementById('metaForm');
const imageCanvas = document.getElementById('imageCanvas');

const highlightTool = document.getElementById('highlightTool');
const stickerGood = document.getElementById('stickerGood');
const stickerMisconception = document.getElementById('stickerMisconception');
const clearAnnotations = document.getElementById('clearAnnotations');

function shuffleCopy(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function groupScans() {
  const grouped = new Map();
  scans.forEach((scan) => {
    const key = scan[state.sortKey];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(scan);
  });
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function orderedItems(items) {
  return state.shuffle ? shuffleCopy(items) : [...items].sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
}

function updateSummary(groups) {
  summary.textContent = `${scans.length} captures · ${groups.length} ${labels[state.sortKey].toLowerCase()} clusters`;
}

function updateViewControls() {
  const isRows = state.viewMode === 'rows';
  zoomOutButton.hidden = !isRows;
  clusterPlane.hidden = isRows;
  gallery.hidden = !isRows;
  viewHint.textContent = isRows
    ? `Zoomed into ${labels[state.sortKey].toLowerCase()} cluster: ${state.activeCluster}`
    : 'Cluster map view: click a cluster to zoom into row view.';
}

function renderClusterPlane(groups) {
  clusterPlane.textContent = '';
  const count = groups.length;

  groups.forEach(([groupName, items], index) => {
    const angle = (index / Math.max(1, count)) * Math.PI * 2;
    const radius = count === 1 ? 0 : 31;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;

    const clusterButton = document.createElement('button');
    clusterButton.type = 'button';
    clusterButton.className = 'cluster';
    clusterButton.style.left = `${x}%`;
    clusterButton.style.top = `${y}%`;
    clusterButton.setAttribute('aria-label', `Open ${groupName} cluster`);

    const preview = document.createElement('div');
    preview.className = 'cluster-preview';
    orderedItems(items).slice(0, 4).forEach((scan, previewIndex) => {
      const thumb = document.createElement('img');
      thumb.src = scan.imageUrl;
      thumb.alt = `${scan.student} ${scan.assignment}`;
      thumb.style.setProperty('--stack-offset', `${previewIndex * 8}px`);
      preview.appendChild(thumb);
    });

    const title = document.createElement('h3');
    title.textContent = groupName;
    const meta = document.createElement('p');
    meta.textContent = `${items.length} work samples`;

    clusterButton.append(preview, title, meta);
    clusterButton.addEventListener('click', () => {
      state.viewMode = 'rows';
      state.activeCluster = groupName;
      render();
    });

    clusterPlane.appendChild(clusterButton);
  });
}

function renderRows(groups) {
  gallery.textContent = '';
  const activeGroup = groups.find(([groupName]) => groupName === state.activeCluster) || groups[0];
  if (!activeGroup) return;

  const [groupName, items] = activeGroup;
  state.activeCluster = groupName;

  const section = document.createElement('section');
  section.className = 'group';

  const title = document.createElement('h3');
  title.textContent = `${labels[state.sortKey]}: ${groupName}`;

  const grid = document.createElement('div');
  grid.className = 'group-grid';

  orderedItems(items).forEach((scan) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const button = card.querySelector('.card-button');
    card.querySelector('img').src = scan.imageUrl;
    card.querySelector('.student').textContent = scan.student;
    card.querySelector('.assignment').textContent = scan.assignment;
    card.querySelector('.topic').textContent = scan.topic;
    card.querySelector('.standard').textContent = scan.standard;
    card.querySelector('.date').textContent = new Date(scan.capturedAt).toLocaleString();

    button.addEventListener('click', () => openFocus(scan.id));
    grid.appendChild(card);
  });

  section.append(title, grid);
  gallery.appendChild(section);
}

function render() {
  const groups = groupScans();
  updateSummary(groups);
  if (!groups.length) {
    clusterPlane.textContent = 'No captures available.';
    gallery.textContent = '';
    return;
  }

  if (state.viewMode === 'rows' && !groups.some(([groupName]) => groupName === state.activeCluster)) {
    state.activeCluster = groups[0][0];
  }

  renderClusterPlane(groups);
  renderRows(groups);
  updateViewControls();
}

function setActiveTool(toolName) {
  state.tool = toolName;
  [highlightTool, stickerGood, stickerMisconception].forEach((btn) => btn.classList.remove('active'));
  if (toolName === 'highlight') highlightTool.classList.add('active');
  if (toolName === 'good') stickerGood.classList.add('active');
  if (toolName === 'misconception') stickerMisconception.classList.add('active');
}

function selectedScan() {
  return scans.find((scan) => scan.id === state.selectedId);
}

function drawAnnotation(annotation) {
  const element = document.createElement('div');
  element.className = annotation.type;

  if (annotation.type === 'highlight') {
    element.style.left = `${annotation.x}%`;
    element.style.top = `${annotation.y}%`;
    element.style.width = `${annotation.width}%`;
    element.style.height = `${annotation.height}%`;
  } else {
    element.classList.add('sticker');
    element.style.left = `${annotation.x}%`;
    element.style.top = `${annotation.y}%`;
    element.textContent = annotation.text;
  }

  annotationLayer.appendChild(element);
}

function renderAnnotations() {
  annotationLayer.textContent = '';
  const scan = selectedScan();
  if (!scan) return;
  scan.annotations.forEach(drawAnnotation);
}

function openFocus(scanId) {
  state.selectedId = scanId;
  const scan = selectedScan();
  if (!scan) return;

  focusImage.src = scan.imageUrl;
  metaForm.student.value = scan.student;
  metaForm.assignment.value = scan.assignment;
  metaForm.topic.value = scan.topic;
  metaForm.standard.value = scan.standard;
  metaForm.capturedAt.value = scan.capturedAt;
  setActiveTool(null);
  renderAnnotations();
  focusModal.showModal();
}

sortButtons.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-sort]');
  if (!button) return;
  state.sortKey = button.dataset.sort;
  state.viewMode = 'plane';
  state.activeCluster = null;
  [...sortButtons.querySelectorAll('button')].forEach((btn) => btn.classList.toggle('active', btn === button));
  render();
});

shuffleToggle.addEventListener('change', () => {
  state.shuffle = shuffleToggle.checked;
  render();
});

zoomOutButton.addEventListener('click', () => {
  state.viewMode = 'plane';
  state.activeCluster = null;
  render();
});

closeModal.addEventListener('click', () => focusModal.close());

metaForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const scan = selectedScan();
  if (!scan) return;

  const formData = new FormData(metaForm);
  scan.student = formData.get('student');
  scan.assignment = formData.get('assignment');
  scan.topic = formData.get('topic');
  scan.standard = formData.get('standard');
  scan.capturedAt = formData.get('capturedAt');

  render();
});

highlightTool.addEventListener('click', () => setActiveTool('highlight'));
stickerGood.addEventListener('click', () => setActiveTool('good'));
stickerMisconception.addEventListener('click', () => setActiveTool('misconception'));

clearAnnotations.addEventListener('click', () => {
  const scan = selectedScan();
  if (!scan) return;
  scan.annotations = [];
  renderAnnotations();
});

imageCanvas.addEventListener('pointerdown', (event) => {
  const scan = selectedScan();
  if (!scan) return;
  const rect = annotationLayer.getBoundingClientRect();
  const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
  const yPercent = ((event.clientY - rect.top) / rect.height) * 100;

  if (state.tool === 'good' || state.tool === 'misconception') {
    scan.annotations.push({
      type: 'sticker',
      x: xPercent,
      y: yPercent,
      text: state.tool === 'good' ? 'Good Work Example' : 'Misconception to Watch'
    });
    renderAnnotations();
    return;
  }

  if (state.tool === 'highlight') {
    state.drawing = { startX: xPercent, startY: yPercent };
  }
});

imageCanvas.addEventListener('pointerup', (event) => {
  const scan = selectedScan();
  if (!scan || !state.drawing || state.tool !== 'highlight') return;

  const rect = annotationLayer.getBoundingClientRect();
  const endX = ((event.clientX - rect.left) / rect.width) * 100;
  const endY = ((event.clientY - rect.top) / rect.height) * 100;

  const x = Math.min(state.drawing.startX, endX);
  const y = Math.min(state.drawing.startY, endY);
  const width = Math.abs(state.drawing.startX - endX);
  const height = Math.abs(state.drawing.startY - endY);

  if (width > 1 && height > 1) {
    scan.annotations.push({ type: 'highlight', x, y, width, height });
    renderAnnotations();
  }

  state.drawing = null;
});

render();
