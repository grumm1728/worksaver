const providedWorkSampleFiles = [
  'photo 1.JPG',
  'photo 1a.JPG',
  'photo 1b.JPG',
  'photo 2.JPG',
  'photo 2a.JPG',
  'photo 2b.JPG',
  'photo 3.JPG',
  'photo 3a.JPG',
  'photo 3b.JPG',
  'photo 4.JPG',
  'photo 4a.JPG',
  'photo 5.JPG',
  'photo 5a.JPG'
];

const dummyWorkSamples = Array.from({ length: 20 }, (_, index) => `https://picsum.photos/seed/worksaver-dummy-${index + 1}/1400/980`);

const roster = ['Ava Thompson', 'Liam Chen', 'Noah Rivera', 'Mia Patel', 'Sophia Martinez', 'Ethan Brooks', 'Olivia Green', 'Lucas Adams'];

const assignments = [
  'Skyline Express Poster',
  'Train Pattern Investigation',
  'Length Combination Proof',
  'Group Reflection Board',
  'Reasoning Write-Up',
  'Algebraic Thinking Summary'
];

const topics = ['Patterns', 'Combinatorics', 'Expressions', 'Reasoning & Proof'];
const standards = ['CCSS.MATH.CONTENT.5.OA.B.3', 'CCSS.MATH.CONTENT.6.EE.A.2', 'CCSS.MATH.PRACTICE.MP3'];

function buildScan(imageUrl, index, sourceLabel) {
  const baseDate = new Date();
  baseDate.setHours(baseDate.getHours() - index * 36);

  return {
    id: crypto.randomUUID(),
    imageUrl,
    fallbackImageUrl: `https://picsum.photos/seed/worksaver-fallback-${index + 1}/1400/980`,
    student: roster[index % roster.length],
    assignment: `${assignments[index % assignments.length]}${sourceLabel ? ` (${sourceLabel})` : ''}`,
    topic: topics[index % topics.length],
    standard: standards[index % standards.length],
    capturedAt: baseDate.toISOString().slice(0, 16),
    annotations: []
  };
}

const providedScans = providedWorkSampleFiles.map((fileName, index) => buildScan(fileName, index, 'provided sample'));
const dummyScans = dummyWorkSamples.map((imageUrl, index) => buildScan(imageUrl, index + providedScans.length, 'dummy sample'));
const scans = [...providedScans, ...dummyScans];

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
  activeCluster: null
};

const sortButtons = document.getElementById('sortButtons');
const clusterPlane = document.getElementById('clusterPlane');
const summary = document.getElementById('summary');
const viewHint = document.getElementById('viewHint');
const shuffleToggle = document.getElementById('shuffleToggle');
const template = document.getElementById('cardTemplate');

const groupModal = document.getElementById('groupModal');
const closeGroupModal = document.getElementById('closeGroupModal');
const groupModalTitle = document.getElementById('groupModalTitle');
const groupModalMeta = document.getElementById('groupModalMeta');
const groupGallery = document.getElementById('groupGallery');

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

function setImageSource(imageElement, scan) {
  imageElement.src = scan.imageUrl;
  imageElement.onerror = () => {
    if (scan.fallbackImageUrl && imageElement.src !== scan.fallbackImageUrl) {
      imageElement.src = scan.fallbackImageUrl;
    }
  };
}

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
  summary.textContent = `${scans.length} captures · ${groups.length} ${labels[state.sortKey].toLowerCase()} groups`;
}

function updateViewControls() {
  if (state.sortKey === 'student') {
    viewHint.textContent = 'Student board view: alphabetic grid with workload indicators. Click any tile to open its work in a modal.';
    return;
  }

  if (state.sortKey === 'assignment') {
    viewHint.textContent = 'Assignment timeline view: today, 1-7 days, 8-30 days, and school-year archive. Click any assignment to open its work in a modal.';
    return;
  }

  viewHint.textContent = 'Concept map view: k-means style clusters by topic/standard. Click any concept to open its work in a modal.';
}

function applyBackdropTheme() {
  clusterPlane.classList.remove('theme-bulletin', 'theme-desk', 'theme-chalkboard');
  if (state.sortKey === 'student') {
    clusterPlane.classList.add('theme-bulletin');
  } else if (state.sortKey === 'assignment') {
    clusterPlane.classList.add('theme-desk');
  } else {
    clusterPlane.classList.add('theme-chalkboard');
  }
}

function openGroupModal(groupName) {
  state.activeCluster = groupName;
  renderGroupModal();
  groupModal.showModal();
}

function renderStudentGrid(groups) {
  clusterPlane.innerHTML = '';
  clusterPlane.classList.add('student-grid-view');

  groups.forEach(([groupName, items]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'student-tile';
    card.setAttribute('aria-label', `Open ${groupName}`);

    const name = document.createElement('h3');
    name.textContent = groupName;

    const count = document.createElement('p');
    count.textContent = `${items.length} work samples`;

    const meter = document.createElement('div');
    meter.className = 'sample-meter';
    const maxBars = Math.min(10, Math.max(...groups.map(([, groupItems]) => groupItems.length)));
    const activeBars = Math.max(1, Math.round((items.length / maxBars) * 10));

    for (let i = 0; i < 10; i += 1) {
      const dot = document.createElement('span');
      dot.className = i < activeBars ? 'on' : '';
      meter.appendChild(dot);
    }

    card.append(name, count, meter);
    card.addEventListener('click', () => openGroupModal(groupName));
    clusterPlane.appendChild(card);
  });
}

function assignmentBucket(daysAgo) {
  if (daysAgo <= 0) return 'Today';
  if (daysAgo <= 7) return '1-7 days ago';
  if (daysAgo <= 30) return '8-30 days ago';
  return '31+ days ago (school year)';
}

function renderAssignmentTimeline(groups) {
  clusterPlane.innerHTML = '';
  clusterPlane.classList.add('assignment-timeline-view');

  const timelineOrder = ['Today', '1-7 days ago', '8-30 days ago', '31+ days ago (school year)'];
  const lanes = new Map(timelineOrder.map((label) => [label, []]));
  const now = new Date();

  groups.forEach(([groupName, items]) => {
    const latestCapture = items.reduce((latest, scan) => {
      const at = new Date(scan.capturedAt);
      return at > latest ? at : latest;
    }, new Date(0));

    const elapsedMs = now - latestCapture;
    const daysAgo = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const lane = assignmentBucket(daysAgo);
    lanes.get(lane).push({ groupName, items, daysAgo });
  });

  timelineOrder.forEach((lane) => {
    const laneSection = document.createElement('section');
    laneSection.className = 'timeline-lane';

    const laneTitle = document.createElement('h3');
    laneTitle.textContent = lane;

    const laneTrack = document.createElement('div');
    laneTrack.className = 'timeline-track';

    lanes.get(lane).forEach(({ groupName, items, daysAgo }) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'timeline-chip';

      const title = document.createElement('h4');
      title.textContent = groupName;
      const details = document.createElement('p');
      details.textContent = `${items.length} samples · ${Math.max(daysAgo, 0)}d ago`;

      chip.append(title, details);
      chip.addEventListener('click', () => openGroupModal(groupName));
      laneTrack.appendChild(chip);
    });

    laneSection.append(laneTitle, laneTrack);
    clusterPlane.appendChild(laneSection);
  });
}

function renderConceptClusters(groups) {
  clusterPlane.innerHTML = '';
  clusterPlane.classList.add('kmeans-view');

  const count = groups.length;
  groups.forEach(([groupName, items], index) => {
    const angle = (index / Math.max(1, count)) * Math.PI * 2;
    const radius = count === 1 ? 0 : 30;
    const centerX = 50 + Math.cos(angle) * radius;
    const centerY = 50 + Math.sin(angle) * radius;

    const blob = document.createElement('div');
    blob.className = 'cluster-blob';
    blob.style.left = `${centerX}%`;
    blob.style.top = `${centerY}%`;

    const centroid = document.createElement('button');
    centroid.type = 'button';
    centroid.className = 'cluster-centroid';
    centroid.style.left = `${centerX}%`;
    centroid.style.top = `${centerY}%`;
    centroid.setAttribute('aria-label', `Open ${groupName}`);

    const title = document.createElement('h3');
    title.textContent = groupName;
    const meta = document.createElement('p');
    meta.textContent = `${items.length} samples`;

    centroid.append(title, meta);
    centroid.addEventListener('click', () => openGroupModal(groupName));

    clusterPlane.append(blob, centroid);
  });
}

function renderOverview(groups) {
  clusterPlane.classList.remove('student-grid-view', 'assignment-timeline-view', 'kmeans-view');
  applyBackdropTheme();

  if (state.sortKey === 'student') {
    renderStudentGrid(groups);
    return;
  }

  if (state.sortKey === 'assignment') {
    renderAssignmentTimeline(groups);
    return;
  }

  renderConceptClusters(groups);
}

function renderGroupModal() {
  const groups = groupScans();
  const activeGroup = groups.find(([groupName]) => groupName === state.activeCluster);
  if (!activeGroup) return;

  const [groupName, items] = activeGroup;
  groupModalTitle.textContent = `${labels[state.sortKey]}: ${groupName}`;
  groupModalMeta.textContent = `${items.length} work samples`;
  groupGallery.textContent = '';

  orderedItems(items).forEach((scan) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const button = card.querySelector('.card-button');
    setImageSource(card.querySelector('img'), scan);
    card.querySelector('.student').textContent = scan.student;
    card.querySelector('.assignment').textContent = scan.assignment;
    card.querySelector('.topic').textContent = scan.topic;
    card.querySelector('.standard').textContent = scan.standard;
    card.querySelector('.date').textContent = new Date(scan.capturedAt).toLocaleString();

    button.addEventListener('click', () => openFocus(scan.id));
    groupGallery.appendChild(card);
  });
}

function render() {
  const groups = groupScans();
  updateSummary(groups);
  updateViewControls();

  if (!groups.length) {
    clusterPlane.textContent = 'No captures available.';
    return;
  }

  renderOverview(groups);

  if (groupModal.open) {
    if (groups.some(([groupName]) => groupName === state.activeCluster)) {
      renderGroupModal();
    } else {
      groupModal.close();
    }
  }
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

  setImageSource(focusImage, scan);
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
  state.activeCluster = null;
  if (groupModal.open) groupModal.close();
  [...sortButtons.querySelectorAll('button')].forEach((btn) => btn.classList.toggle('active', btn === button));
  render();
});

shuffleToggle.addEventListener('change', () => {
  state.shuffle = shuffleToggle.checked;
  if (groupModal.open) renderGroupModal();
  render();
});

closeGroupModal.addEventListener('click', () => groupModal.close());
closeModal.addEventListener('click', () => focusModal.close());

groupModal.addEventListener('close', () => {
  state.activeCluster = null;
});

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
