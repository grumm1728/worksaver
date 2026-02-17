const stickerConfig = {
  'Place value confusion': { color: '#f97316', kind: 'misconception', suggestion: 'Use base-ten blocks and compare two worked examples to reinforce quantity meaning.' },
  'Regrouping error': { color: '#ef4444', kind: 'misconception', suggestion: 'Pull a small group for a quick re-teach with number-bond regrouping steps.' },
  "Didn't show work": { color: '#f59e0b', kind: 'misconception', suggestion: 'Model sentence frames and require one equation + one explanation line before checking answers.' },
  'Answer-only': { color: '#a855f7', kind: 'misconception', suggestion: 'Prompt students to annotate each step and highlight where each number came from.' },
  'Great strategy': { color: '#10b981', kind: 'praise', suggestion: 'Use this work as a peer exemplar and ask the student to explain the strategy aloud.' }
};

const labels = {
  misconception: 'Misconception',
  lessonObjective: 'Lesson / Objective',
  standard: 'Standard',
  topic: 'Topic',
  assignment: 'Assignment',
  student: 'Student'
};

const tourSteps = [
  'Click “Load demo class”.',
  'Click a group in the cluster view.',
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
  unitName: '',
  tourCompleted: [false, false, false, false, false],
  tourActiveIndex: 0,
  smallGroupCreated: false,
  sprint: {
    active: false,
    target: 5,
    done: 0
  }
};

const loadDemoBtn = document.getElementById('loadDemoBtn');
const resetBtn = document.getElementById('resetBtn');
const beginSprintBtn = document.getElementById('beginSprintBtn');
const groupTabs = document.getElementById('groupTabs');
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
const groupStickerSummary = document.getElementById('groupStickerSummary');
const groupGallery = document.getElementById('groupGallery');

const focusModal = document.getElementById('focusModal');
const closeModal = document.getElementById('closeModal');
const focusImage = document.getElementById('focusImage');
const annotationLayer = document.getElementById('annotationLayer');
const metaForm = document.getElementById('metaForm');
const imageCanvas = document.getElementById('imageCanvas');
const stickerButtons = document.getElementById('stickerButtons');
const undoTag = document.getElementById('undoTag');

const sprintBanner = document.getElementById('sprintBanner');
const sprintCounter = document.getElementById('sprintCounter');
const sprintDateLabel = document.getElementById('sprintDateLabel');
const sprintDoneBtn = document.getElementById('sprintDoneBtn');
const stopSprintBtn = document.getElementById('stopSprintBtn');

const sprintCompleteModal = document.getElementById('sprintCompleteModal');
const sprintDoMore = document.getElementById('sprintDoMore');
const sprintClose = document.getElementById('sprintClose');

const sprintEdgeModal = document.getElementById('sprintEdgeModal');
const sprintEdgeText = document.getElementById('sprintEdgeText');
const sprintResetProgress = document.getElementById('sprintResetProgress');
const sprintEdgeClose = document.getElementById('sprintEdgeClose');

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
  }, 1300);
}

function setImageSource(imageElement, scan) {
  imageElement.src = scan.imageUrl;
  imageElement.onerror = () => {
    if (scan.fallbackImageUrl && imageElement.src !== scan.fallbackImageUrl) imageElement.src = scan.fallbackImageUrl;
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
  const tag = (scan.annotations || []).find((item) => item.type === 'tag' && stickerConfig[item.category]?.kind !== 'praise');
  return tag ? tag.category : 'Untagged';
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

function countStickers(items) {
  const counts = {};
  items.forEach((scan) => {
    (scan.annotations || []).forEach((tag) => {
      if (tag.type !== 'tag') return;
      counts[tag.category] = (counts[tag.category] || 0) + 1;
    });
  });
  return counts;
}

function topStickerCounts(items, limit = 3) {
  return Object.entries(countStickers(items)).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function setTourStepComplete(index, value = true) {
  state.tourCompleted[index] = value;
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

function updateTourFromState() {
  if (state.demoLoaded) setTourStepComplete(0);
  if (groupModal.open) setTourStepComplete(1);
  const regroupingCount = state.scans.flatMap((scan) => scan.annotations || []).filter((item) => item.type === 'tag' && item.category === 'Regrouping error').length;
  if (regroupingCount >= 3) setTourStepComplete(2);
  if (Object.keys(countStickers(state.scans)).length > 0) setTourStepComplete(3);
  if (state.smallGroupCreated) setTourStepComplete(4);
}

function setActiveTabVisual() {
  if (!groupTabs) return;
  [...groupTabs.querySelectorAll('button[data-group]')].forEach((btn) => btn.classList.toggle('active', btn.dataset.group === state.sortKey));
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
    student: 'Student board view: alphabetic group cards with sample count + dotmap.',
    assignment: 'Assignment timeline: click a lane chip to review that assignment set.',
    lessonObjective: 'Lesson objective clusters: click any cluster to inspect and tag.',
    standard: 'Standard clusters: surface where misconceptions cluster by standard.',
    topic: 'Topic clusters: scan quickly for patterns in misconceptions and strategies.',
    misconception: 'Misconception clusters: quickly move from errors to small-group decisions.'
  };
  viewHint.textContent = text[state.sortKey] || '';
}

function applyBackdropTheme() {
  clusterPlane.classList.remove('theme-bulletin', 'theme-desk', 'theme-chalkboard');
  if (state.sortKey === 'student') clusterPlane.classList.add('theme-bulletin');
  else if (state.sortKey === 'assignment') clusterPlane.classList.add('theme-desk');
  else clusterPlane.classList.add('theme-chalkboard');
}

function createDotmap(total) {
  const dotmap = document.createElement('div');
  dotmap.className = 'dotmap';
  const cap = Math.min(total, 64);
  for (let i = 0; i < cap; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dotmap.appendChild(dot);
  }
  return dotmap;
}

function createStickerSummaryRow(items) {
  const row = document.createElement('div');
  row.className = 'cluster-mini-summary';
  const top = topStickerCounts(items);
  top.forEach(([name, count]) => {
    const pill = document.createElement('span');
    pill.className = 'mini-pill';
    pill.style.setProperty('--pill-color', stickerConfig[name]?.color || '#94a3b8');
    pill.textContent = `${name}: ${count}`;
    row.appendChild(pill);
  });
  return row;
}

function createGroupCard(groupName, items, className = '') {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = className || 'group-card';
  card.innerHTML = `<h3>${groupName}</h3><p>${items.length} samples</p>`;
  card.append(createDotmap(items.length));
  card.append(createStickerSummaryRow(items));
  card.addEventListener('click', () => openGroupModal(groupName));
  return card;
}

function openGroupModal(groupName) {
  state.activeCluster = groupName;
  renderGroupModal();
  groupModal.showModal();
  updateTourFromState();
  renderTour();
}

function renderStudentGrid(groups) {
  clusterPlane.innerHTML = '';
  clusterPlane.classList.add('student-grid-view');
  [...groups].sort(([a], [b]) => a.localeCompare(b)).forEach(([groupName, items]) => {
    const card = createGroupCard(groupName, items, 'student-tile');
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

  const laneLabels = ['Today', '1-7 days ago', '8-30 days ago', '31+ days ago (school year)'];
  const lanes = new Map(laneLabels.map((label) => [label, []]));
  const now = new Date();

  groups.forEach(([groupName, items]) => {
    const recent = items.reduce((latest, scan) => {
      const when = new Date(scan.capturedAt);
      return when > latest ? when : latest;
    }, new Date(0));

    const daysAgo = Math.floor((now - recent) / (1000 * 60 * 60 * 24));
    lanes.get(assignmentBucket(daysAgo)).push({ groupName, items });
  });

  laneLabels.forEach((label) => {
    const lane = document.createElement('section');
    lane.className = 'timeline-lane';
    lane.innerHTML = `<h3>${label}</h3>`;
    const track = document.createElement('div');
    track.className = 'timeline-track';
    lanes.get(label).forEach(({ groupName, items }) => {
      const chip = createGroupCard(groupName, items, 'timeline-chip');
      track.appendChild(chip);
    });
    lane.appendChild(track);
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

    const centroid = createGroupCard(groupName, items, 'cluster-centroid');
    centroid.style.left = `${centerX}%`;
    centroid.style.top = `${centerY}%`;

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
  groupStickerSummary.textContent = '';
  topStickerCounts(items, 4).forEach(([name, count]) => {
    const badge = document.createElement('span');
    badge.className = 'mini-pill';
    badge.style.setProperty('--pill-color', stickerConfig[name]?.color || '#94a3b8');
    badge.textContent = `${name} (${count})`;
    groupStickerSummary.appendChild(badge);
  });

  groupGallery.textContent = '';
  orderedItems(items).forEach((scan) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const button = card.querySelector('.card-button');
    setImageSource(card.querySelector('img'), scan);
    card.querySelector('.student').textContent = scan.student;
    card.querySelector('.assignment').textContent = scan.assignment;
    card.querySelector('.objective').textContent = scan.lessonObjective;
    card.querySelector('.standard').textContent = `${scan.standard} · ${scan.topic || ''}`;
    card.querySelector('.date').textContent = new Date(scan.capturedAt).toLocaleString();
    button.addEventListener('click', () => openFocus(scan.id));
    groupGallery.appendChild(card);
  });
}

function drawAnnotation(annotation) {
  const element = document.createElement('div');
  element.className = 'sticker';
  element.style.left = `${annotation.x}%`;
  element.style.top = `${annotation.y}%`;
  element.style.borderColor = stickerConfig[annotation.category]?.color || '#64748b';
  element.style.background = `${stickerConfig[annotation.category]?.color || '#64748b'}22`;
  element.textContent = annotation.category;
  annotationLayer.appendChild(element);
}

function renderAnnotations() {
  annotationLayer.textContent = '';
  const scan = selectedScan();
  if (!scan) return;
  (scan.annotations || []).filter((item) => item.type === 'tag').forEach(drawAnnotation);
}

function updateSprintBanner(scan) {
  if (!sprintBanner) return;
  const active = state.sprint.active;
  sprintBanner.hidden = !active;
  if (!active || !scan) return;
  sprintCounter.textContent = `Sprint: ${state.sprint.done + 1} / ${state.sprint.target}`;
  sprintDateLabel.textContent = `Sample date: ${new Date(scan.capturedAt).toLocaleDateString()}`;
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
  metaForm.topic.value = scan.topic || '';
  metaForm.capturedAt.value = scan.capturedAt;
  updateSprintBanner(scan);
  renderAnnotations();
  focusModal.showModal();
}

function updateInsights() {
  const set = currentSetForInsights();
  const tags = set.flatMap((scan) => (scan.annotations || []).filter((item) => item.type === 'tag').map((item) => ({ ...item, student: scan.student })));
  const misconceptionTags = tags.filter((tag) => stickerConfig[tag.category]?.kind !== 'praise');

  if (!misconceptionTags.length) {
    insightTop.textContent = 'Top misconception this set: —';
    insightMove.textContent = 'Suggested next move: Tag 3+ samples to generate an instructional move.';
    insightStudents.textContent = '';
    insightGroup.textContent = 'Suggested grouping: —';
    reteachNote.value = '';
    exportGroupCsv.href = '#';
    return;
  }

  const counts = misconceptionTags.reduce((acc, tag) => {
    acc[tag.category] = (acc[tag.category] || 0) + 1;
    return acc;
  }, {});

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const studentList = [...new Set(misconceptionTags.filter((tag) => tag.category === top).map((tag) => tag.student))];

  insightTop.textContent = `Top misconception this set: ${top}`;
  insightMove.textContent = `Suggested next move: ${stickerConfig[top].suggestion}`;
  insightStudents.textContent = '';
  studentList.forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    insightStudents.appendChild(li);
  });

  insightGroup.textContent = `Suggested grouping: Small group (${studentList.length} students)`;
  reteachNote.value = `Tomorrow: reteach ${top.toLowerCase()} using guided practice + quick check with ${studentList.length} students.`;
  const csv = `student\n${studentList.join('\n')}`;
  exportGroupCsv.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function renderStickerButtons() {
  if (!stickerButtons) return;
  stickerButtons.textContent = '';
  Object.entries(stickerConfig).forEach(([name, config]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `sticker-btn ${config.kind} ${state.activeSticker === name ? 'selected' : ''}`;
    btn.innerHTML = `<span class="dot" style="--dot:${config.color}"></span><span>${name}</span><span class="check">✓</span>`;
    btn.addEventListener('click', () => {
      state.activeSticker = name;
      renderStickerButtons();
    });
    stickerButtons.appendChild(btn);
  });
}

function render() {
  const required = [summary, emptyState, viewControls, sidePanels, clusterPlane, groupBySelect];
  if (required.some((node) => !node)) return;

  const groups = groupScans();
  updateHeaderAndEmptyState(groups);
  setActiveTabVisual();
  updateViewHint();
  updateTourFromState();
  renderTour();
  renderStickerButtons();
  updateInsights();

  if (!state.scans.length) {
    clusterPlane.textContent = '';
    return;
  }

  renderOverview(groups);

  if (groupModal.open) {
    if (groups.some(([name]) => name === state.activeCluster)) renderGroupModal();
    else groupModal.close();
  }
}

function setGrouping(groupKey) {
  state.sortKey = groupKey;
  groupBySelect.value = groupKey;
  state.activeCluster = null;
  if (groupModal.open) groupModal.close();
  render();
}

function loadDemoData() {
  const data = window.WorkSaverDemoData.createDemoClassSet(200);
  state.scans = data.scans;
  state.unitName = data.unitName;
  state.demoLoaded = true;
  state.sortKey = 'lessonObjective';
  state.smallGroupCreated = false;
  state.sprint = { active: false, target: 5, done: 0 };
  state.tourActiveIndex = 1;

  loadDemoBtn.disabled = true;
  loadDemoBtn.textContent = 'Demo loaded ✓';

  showToast(`Loaded 200 samples · ${state.unitName}`);
  setGrouping('lessonObjective');
}

function resetAll() {
  state.scans = [];
  state.sortKey = 'misconception';
  state.selectedId = null;
  state.activeCluster = null;
  state.activeSticker = null;
  state.tagHistory = [];
  state.demoLoaded = false;
  state.smallGroupCreated = false;
  state.tourCompleted = [false, false, false, false, false];
  state.tourActiveIndex = 0;
  state.sprint = { active: false, target: 5, done: 0 };

  loadDemoBtn.disabled = false;
  loadDemoBtn.textContent = 'Load demo class';

  if (groupModal.open) groupModal.close();
  if (focusModal.open) focusModal.close();
  if (sprintCompleteModal.open) sprintCompleteModal.close();
  if (sprintEdgeModal.open) sprintEdgeModal.close();

  showToast('Reset complete.');
  render();
}

function availableSprintSamples() {
  return state.scans.filter((scan) => !scan.sprintDone);
}

function openRandomSprintSample() {
  const available = availableSprintSamples();
  if (!available.length) {
    sprintEdgeText.textContent = 'No uncompleted samples remain for sprint. Reset sprint progress to continue.';
    sprintEdgeModal.showModal();
    return;
  }

  const sample = available[Math.floor(Math.random() * available.length)];
  openFocus(sample.id);
}

function beginSprint() {
  if (!state.scans.length) {
    showToast('Load demo class first.');
    return;
  }

  const remaining = availableSprintSamples().length;
  if (remaining < state.sprint.target) {
    sprintEdgeText.textContent = `Only ${remaining} uncompleted samples remain. Reset sprint progress or close.`;
    sprintEdgeModal.showModal();
    return;
  }

  state.sprint.active = true;
  state.sprint.done = 0;
  openRandomSprintSample();
}

function sprintDoneStep() {
  if (!state.sprint.active) return;
  const scan = selectedScan();
  if (!scan) return;

  scan.sprintDone = true;
  state.sprint.done += 1;

  if (state.sprint.done >= state.sprint.target) {
    focusModal.close();
    sprintCompleteModal.showModal();
    return;
  }

  const remaining = availableSprintSamples().length;
  const needed = state.sprint.target - state.sprint.done;
  if (remaining < needed) {
    focusModal.close();
    sprintEdgeText.textContent = `Only ${remaining} samples remain, but ${needed} more are needed for this sprint.`;
    sprintEdgeModal.showModal();
    return;
  }

  openRandomSprintSample();
}

function stopSprint() {
  state.sprint.active = false;
  if (focusModal.open) focusModal.close();
  showToast('Sprint stopped.');
  render();
}

on(loadDemoBtn, 'click', loadDemoData);
on(resetBtn, 'click', resetAll);
on(beginSprintBtn, 'click', beginSprint);

on(groupTabs, 'click', (event) => {
  const btn = event.target.closest('button[data-group]');
  if (!btn) return;
  setGrouping(btn.dataset.group);
});

on(groupBySelect, 'change', () => setGrouping(groupBySelect.value));
on(shuffleToggle, 'change', () => {
  state.shuffle = shuffleToggle.checked;
  if (groupModal.open) renderGroupModal();
  render();
});

on(closeGroupModal, 'click', () => groupModal.close());
on(closeModal, 'click', () => focusModal.close());
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
  scan.topic = formData.get('topic');
  scan.capturedAt = formData.get('capturedAt');

  render();
  showToast('Metadata saved.');
});

on(imageCanvas, 'pointerdown', (event) => {
  const scan = selectedScan();
  if (!scan || !state.activeSticker) return;

  const rect = annotationLayer.getBoundingClientRect();
  const tag = {
    id: crypto.randomUUID(),
    type: 'tag',
    category: state.activeSticker,
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100
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

on(document, 'keydown', (event) => {
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
  render();
});

on(sprintDoneBtn, 'click', sprintDoneStep);
on(stopSprintBtn, 'click', stopSprint);
on(sprintDoMore, 'click', () => {
  if (sprintCompleteModal.open) sprintCompleteModal.close();
  state.sprint.active = true;
  state.sprint.done = 0;
  openRandomSprintSample();
});
on(sprintClose, 'click', () => {
  if (sprintCompleteModal.open) sprintCompleteModal.close();
  stopSprint();
});
on(sprintResetProgress, 'click', () => {
  state.scans.forEach((scan) => {
    scan.sprintDone = false;
  });
  if (sprintEdgeModal.open) sprintEdgeModal.close();
  showToast('Sprint progress reset.');
  beginSprint();
});
on(sprintEdgeClose, 'click', () => {
  if (sprintEdgeModal.open) sprintEdgeModal.close();
});

render();
