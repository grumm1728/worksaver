const misconceptionTemplates = {
  'Place value confusion': 'Use base-ten blocks and compare two worked examples to reinforce quantity meaning.',
  'Regrouping error': 'Pull a small group for a quick re-teach with number-bond regrouping steps.',
  "Didn't show work": 'Model sentence frames and require one equation + one explanation line before checking answers.',
  'Great strategy': 'Use this work as a peer exemplar and ask the student to explain the strategy aloud.',
  'Answer-only': 'Prompt students to annotate each step and highlight where each number came from.'
};

const labels = {
  misconception: 'Misconception',
  lessonObjective: 'Lesson / Objective',
  standard: 'Standard',
  assignment: 'Assignment',
  student: 'Student'
};

const tourSteps = [
  'Click “Load Demo Class (200 samples)”.',
  'In cluster view, click a cluster to open its samples.',
  'Place the “Regrouping error” sticker on 3 samples.',
  'Observe “Instructional insights” updating.',
  'Click “Create small group”.'
];

const state = {
  scans: [],
  sortKey: 'misconception',
  shuffle: false,
  selectedId: null,
  activeCluster: null,
  activeSticker: null,
  tagHistory: [],
  demoLoaded: false,
  tourCompleted: [false, false, false, false, false],
  tourActiveIndex: 0,
  smallGroupCreated: false
};

const loadDemoBtn = document.getElementById('loadDemoBtn');
const tryDemoBtn = document.getElementById('tryDemoBtn');
const resetBtn = document.getElementById('resetBtn');
const groupBySelect = document.getElementById('groupBySelect');
const shuffleToggle = document.getElementById('shuffleToggle');
const summary = document.getElementById('summary');
const viewHint = document.getElementById('viewHint');
const viewControls = document.getElementById('viewControls');
const emptyState = document.getElementById('emptyState');
const sidePanels = document.getElementById('sidePanels');
const clusterPlane = document.getElementById('clusterPlane');
const template = document.getElementById('cardTemplate');

const tourChecklist = document.getElementById('tourChecklist');
const tourNext = document.getElementById('tourNext');
const tourSkip = document.getElementById('tourSkip');

const insightTop = document.getElementById('insightTop');
const insightMove = document.getElementById('insightMove');
const insightStudents = document.getElementById('insightStudents');
const insightGroup = document.getElementById('insightGroup');
const createSmallGroupBtn = document.getElementById('createSmallGroupBtn');
const exportGroupCsv = document.getElementById('exportGroupCsv');
const reteachNote = document.getElementById('reteachNote');

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
const stickerButtons = document.getElementById('stickerButtons');
const undoTag = document.getElementById('undoTag');
const toast = document.getElementById('toast');

function on(element, eventName, handler) {
  if (element) element.addEventListener(eventName, handler);
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 1200);
}

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

function selectedScan() {
  return state.scans.find((scan) => scan.id === state.selectedId);
}

function orderedItems(items) {
  return state.shuffle ? shuffleCopy(items) : [...items].sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
}

function primaryMisconception(scan) {
  const tags = (scan.annotations || []).filter((item) => item.type === 'tag').map((item) => item.category).filter((name) => name !== 'Great strategy');
  return tags[0] || 'Untagged';
}

function groupValue(scan) {
  if (state.sortKey === 'misconception') return primaryMisconception(scan);
  return scan[state.sortKey] || 'Unknown';
}

function groupScans() {
  const grouped = new Map();
  state.scans.forEach((scan) => {
    const key = groupValue(scan);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(scan);
  });
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function currentSetForInsights() {
  if (groupModal.open && state.activeCluster) {
    const group = groupScans().find(([name]) => name === state.activeCluster);
    if (group) return group[1];
  }
  return state.scans;
}

function setTourStepComplete(index, value = true) {
  state.tourCompleted[index] = value;
  renderTour();
}

function renderTour() {
  if (!tourChecklist) return;
  tourChecklist.textContent = '';
  tourSteps.forEach((step, index) => {
    const item = document.createElement('li');
    item.className = index === state.tourActiveIndex ? 'active' : '';
    item.innerHTML = `${state.tourCompleted[index] ? '✅' : '⬜'} ${step}`;
    tourChecklist.appendChild(item);
  });
}

function nextTourStep() {
  const nextIndex = state.tourCompleted.findIndex((done, idx) => !done && idx > state.tourActiveIndex);
  if (nextIndex !== -1) {
    state.tourActiveIndex = nextIndex;
  }
  renderTour();
}

function updateTourFromState() {
  if (state.demoLoaded) setTourStepComplete(0);
  if (groupModal.open) setTourStepComplete(1);

  const regroupingCount = state.scans.flatMap((scan) => scan.annotations || []).filter((item) => item.type === 'tag' && item.category === 'Regrouping error').length;
  if (regroupingCount >= 3) setTourStepComplete(2);

  const totalMisconceptions = state.scans.flatMap((scan) => scan.annotations || []).filter((item) => item.type === 'tag' && item.category !== 'Great strategy').length;
  if (totalMisconceptions > 0) setTourStepComplete(3);

  if (state.smallGroupCreated) setTourStepComplete(4);
}

function updateHeaderAndEmptyState(groups) {
  const hasData = state.scans.length > 0;
  emptyState.hidden = hasData;
  viewControls.hidden = !hasData;
  sidePanels.hidden = !hasData;
  clusterPlane.hidden = !hasData;
  summary.textContent = hasData ? `${state.scans.length} captures · ${groups.length} ${labels[state.sortKey].toLowerCase()} groups` : 'No class set loaded yet.';
}

function updateViewHint() {
  const text = {
    student: 'Student board view: alphabetic grid with workload indicators. Click any student to review and tag.',
    assignment: 'Assignment timeline: click a lane chip to open that assignment set.',
    lessonObjective: 'Lesson objective clusters: open a group and tag misconceptions to inform next steps.',
    standard: 'Standard clusters: identify where errors concentrate by standard.',
    misconception: 'Misconception clusters: quickly review tagged work and form targeted small groups.'
  };
  viewHint.textContent = text[state.sortKey];
}

function applyBackdropTheme() {
  clusterPlane.classList.remove('theme-bulletin', 'theme-desk', 'theme-chalkboard');
  if (state.sortKey === 'student') clusterPlane.classList.add('theme-bulletin');
  else if (state.sortKey === 'assignment') clusterPlane.classList.add('theme-desk');
  else clusterPlane.classList.add('theme-chalkboard');
}

function openGroupModal(groupName) {
  state.activeCluster = groupName;
  renderGroupModal();
  groupModal.showModal();
  updateTourFromState();
}

function renderStudentGrid(groups) {
  clusterPlane.innerHTML = '';
  clusterPlane.classList.add('student-grid-view');

  const sorted = [...groups].sort(([a], [b]) => a.localeCompare(b));
  const maxCount = Math.max(1, ...sorted.map(([, items]) => items.length));

  sorted.forEach(([groupName, items]) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'student-tile';

    const name = document.createElement('h3');
    name.textContent = groupName;
    const count = document.createElement('p');
    count.textContent = `${items.length} samples`;

    const meter = document.createElement('div');
    meter.className = 'sample-meter';
    const activeBars = Math.max(1, Math.round((items.length / maxCount) * 10));
    for (let i = 0; i < 10; i += 1) {
      const bar = document.createElement('span');
      bar.className = i < activeBars ? 'on' : '';
      meter.appendChild(bar);
    }

    tile.append(name, count, meter);
    tile.addEventListener('click', () => openGroupModal(groupName));
    clusterPlane.appendChild(tile);
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

  const laneLabels = ['Today', '1-7 days ago', '8-30 days ago', '31+ days ago (school year)'];
  const lanes = new Map(laneLabels.map((label) => [label, []]));
  const now = new Date();

  groups.forEach(([groupName, items]) => {
    const mostRecent = items.reduce((latest, scan) => {
      const when = new Date(scan.capturedAt);
      return when > latest ? when : latest;
    }, new Date(0));

    const daysAgo = Math.floor((now - mostRecent) / (1000 * 60 * 60 * 24));
    lanes.get(assignmentBucket(daysAgo)).push({ groupName, items, daysAgo });
  });

  laneLabels.forEach((label) => {
    const lane = document.createElement('section');
    lane.className = 'timeline-lane';
    const title = document.createElement('h3');
    title.textContent = label;
    const track = document.createElement('div');
    track.className = 'timeline-track';

    lanes.get(label).forEach(({ groupName, items, daysAgo }) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'timeline-chip';
      chip.innerHTML = `<h4>${groupName}</h4><p>${items.length} samples · ${Math.max(daysAgo, 0)}d ago</p>`;
      chip.addEventListener('click', () => openGroupModal(groupName));
      track.appendChild(chip);
    });

    lane.append(title, track);
    clusterPlane.appendChild(lane);
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
    centroid.innerHTML = `<h3>${groupName}</h3><p>${items.length} samples</p>`;
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
  const activeGroup = groupScans().find(([groupName]) => groupName === state.activeCluster);
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
    card.querySelector('.objective').textContent = scan.lessonObjective;
    card.querySelector('.standard').textContent = scan.standard;
    card.querySelector('.date').textContent = new Date(scan.capturedAt).toLocaleString();

    button.addEventListener('click', () => openFocus(scan.id));
    groupGallery.appendChild(card);
  });
}

function drawAnnotation(annotation) {
  const element = document.createElement('div');
  element.className = annotation.type;

  if (annotation.type === 'tag') {
    element.classList.add('sticker');
    element.style.left = `${annotation.x}%`;
    element.style.top = `${annotation.y}%`;
    element.textContent = annotation.category;
  }

  annotationLayer.appendChild(element);
}

function renderAnnotations() {
  annotationLayer.textContent = '';
  const scan = selectedScan();
  if (!scan) return;
  (scan.annotations || []).forEach(drawAnnotation);
}

function openFocus(scanId) {
  state.selectedId = scanId;
  const scan = selectedScan();
  if (!scan) return;

  setImageSource(focusImage, scan);
  metaForm.student.value = scan.student;
  metaForm.assignment.value = scan.assignment;
  metaForm.lessonObjective.value = scan.lessonObjective;
  metaForm.standard.value = scan.standard;
  metaForm.capturedAt.value = scan.capturedAt;
  renderAnnotations();
  focusModal.showModal();
}

function updateInsights() {
  const set = currentSetForInsights();
  const tags = set.flatMap((scan) => (scan.annotations || []).filter((item) => item.type === 'tag').map((item) => ({ ...item, student: scan.student })));
  const misconceptionTags = tags.filter((tag) => tag.category !== 'Great strategy');

  if (!misconceptionTags.length) {
    insightTop.textContent = 'Top misconception this set: —';
    insightMove.textContent = 'Suggested next move: Tag 3+ samples to generate a move.';
    insightStudents.textContent = '';
    insightGroup.textContent = 'Suggested grouping: —';
    reteachNote.value = '';
    exportGroupCsv.href = '#';
    updateTourFromState();
    return;
  }

  const counts = misconceptionTags.reduce((acc, tag) => {
    acc[tag.category] = (acc[tag.category] || 0) + 1;
    return acc;
  }, {});

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const studentList = [...new Set(misconceptionTags.filter((tag) => tag.category === top).map((tag) => tag.student))];

  insightTop.textContent = `Top misconception this set: ${top}`;
  insightMove.textContent = `Suggested next move: ${misconceptionTemplates[top]}`;
  insightStudents.textContent = '';
  studentList.forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    insightStudents.appendChild(li);
  });

  insightGroup.textContent = `Suggested grouping: Small group (${studentList.length} students)`;
  reteachNote.value = `Tomorrow: reteach ${top.toLowerCase()} with a worked example, think-aloud, and quick check for ${studentList.length} students.`;

  const csv = `student\n${studentList.join('\n')}`;
  exportGroupCsv.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  updateTourFromState();
}

function renderStickerButtons() {
  if (!stickerButtons) return;
  stickerButtons.textContent = '';
  Object.keys(misconceptionTemplates).forEach((name) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = name;
    btn.className = state.activeSticker === name ? 'active' : '';
    btn.addEventListener('click', () => {
      state.activeSticker = name;
      renderStickerButtons();
    });
    stickerButtons.appendChild(btn);
  });
}

function render() {
  const requiredNodes = [summary, emptyState, viewControls, sidePanels, clusterPlane, groupBySelect];
  if (requiredNodes.some((node) => !node)) {
    console.error('WorkSaver UI failed to initialize: expected DOM nodes are missing. Ensure GitHub Pages is serving latest index.html.');
    return;
  }

  const groups = groupScans();
  updateHeaderAndEmptyState(groups);
  updateViewHint();
  renderTour();
  renderStickerButtons();
  updateInsights();

  if (!state.scans.length) {
    clusterPlane.textContent = '';
    return;
  }

  renderOverview(groups);

  if (groupModal.open) {
    if (groups.some(([groupName]) => groupName === state.activeCluster)) renderGroupModal();
    else groupModal.close();
  }
}

function loadDemoData() {
  const { scans } = window.WorkSaverDemoData.createDemoClassSet(200);
  state.scans = scans;
  state.demoLoaded = true;
  state.sortKey = 'lessonObjective';
  groupBySelect.value = state.sortKey;
  state.smallGroupCreated = false;
  state.tourActiveIndex = 1;
  showToast('Demo class loaded.');
  updateTourFromState();
  render();
}

function resetAll() {
  state.scans = [];
  state.sortKey = 'misconception';
  groupBySelect.value = state.sortKey;
  state.activeCluster = null;
  state.selectedId = null;
  state.activeSticker = null;
  state.tagHistory = [];
  state.demoLoaded = false;
  state.smallGroupCreated = false;
  state.tourCompleted = [false, false, false, false, false];
  state.tourActiveIndex = 0;
  if (groupModal.open) groupModal.close();
  if (focusModal.open) focusModal.close();
  showToast('Reset complete.');
  render();
}

on(loadDemoBtn, 'click', loadDemoData);
on(tryDemoBtn, 'click', loadDemoData);
on(resetBtn, 'click', resetAll);

on(groupBySelect, 'change', () => {
  state.sortKey = groupBySelect.value;
  state.activeCluster = null;
  if (groupModal?.open) groupModal.close();
  render();
});

on(shuffleToggle, 'change', () => {
  state.shuffle = shuffleToggle.checked;
  if (groupModal?.open) renderGroupModal();
  render();
});

on(closeGroupModal, 'click', () => groupModal?.close());
on(closeModal, 'click', () => focusModal?.close());

on(groupModal, 'close', () => {
  state.activeCluster = null;
  render();
});

on(metaForm, 'submit', (event) => {
  event.preventDefault();
  const scan = selectedScan();
  if (!scan) return;

  const formData = new FormData(metaForm);
  scan.student = formData.get('student');
  scan.assignment = formData.get('assignment');
  scan.lessonObjective = formData.get('lessonObjective');
  scan.standard = formData.get('standard');
  scan.capturedAt = formData.get('capturedAt');

  render();
  showToast('Metadata saved.');
});

on(imageCanvas, 'pointerdown', (event) => {
  const scan = selectedScan();
  if (!scan || !state.activeSticker) return;

  const rect = annotationLayer.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  const tag = {
    id: crypto.randomUUID(),
    type: 'tag',
    category: state.activeSticker,
    x,
    y
  };

  scan.annotations.push(tag);
  state.tagHistory.push({ scanId: scan.id, tagId: tag.id, category: tag.category });
  renderAnnotations();
  render();
  showToast(`Tagged: ${tag.category}`);
});

on(undoTag, 'click', () => {
  const latest = state.tagHistory.pop();
  if (!latest) return;

  const scan = state.scans.find((item) => item.id === latest.scanId);
  if (!scan) return;

  scan.annotations = (scan.annotations || []).filter((tag) => tag.id !== latest.tagId);
  renderAnnotations();
  render();
  showToast(`Undo tag: ${latest.category}`);
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    undoTag.click();
  }
});

on(tourNext, 'click', () => {
  state.tourCompleted[state.tourActiveIndex] = true;
  const next = state.tourCompleted.findIndex((done) => !done);
  if (next >= 0) state.tourActiveIndex = next;
  renderTour();
});

on(tourSkip, 'click', () => {
  const panel = document.querySelector('.tour-panel');
  if (panel) panel.hidden = true;
});

on(createSmallGroupBtn, 'click', () => {
  state.smallGroupCreated = true;
  showToast('Small group created from current insight set.');
  updateTourFromState();
  renderTour();
});

render();
