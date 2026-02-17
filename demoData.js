(function initDemoData(global) {
  const students = [
    'A. Nguyen', 'J. Rivera', 'M. Patel', 'L. Chen', 'S. Brooks', 'E. Johnson', 'R. Gomez', 'K. Ali', 'T. Brown', 'C. Davis',
    'N. Wilson', 'I. Martinez', 'P. Clark', 'H. Lewis', 'O. Walker', 'B. Young', 'D. Hall', 'F. Allen', 'V. King', 'G. Wright',
    'Q. Scott', 'U. Green', 'Y. Baker', 'Z. Adams', 'W. Nelson', 'X. Carter', 'A. Mitchell', 'J. Perez', 'M. Roberts', 'L. Turner'
  ].map((name, index) => ({ id: `student-${index + 1}`, name }));

  const assignments = [
    { id: 'a1', name: 'Skyline Express Launch', lessonObjective: 'Identify place value patterns', daysAgo: 26 },
    { id: 'a2', name: 'Skyline Express Group Poster', lessonObjective: 'Explain regrouping strategies', daysAgo: 22 },
    { id: 'a3', name: 'Independent Practice Set A', lessonObjective: 'Add within 100 using place value', daysAgo: 18 },
    { id: 'a4', name: 'Math Talk Evidence Board', lessonObjective: 'Justify two-step reasoning', daysAgo: 12 },
    { id: 'a5', name: 'Exit Ticket - Regrouping', lessonObjective: 'Add with regrouping', daysAgo: 7 },
    { id: 'a6', name: 'Error Analysis Sort', lessonObjective: 'Find and explain strategy patterns', daysAgo: 4 },
    { id: 'a7', name: 'Fluency Check', lessonObjective: 'Compute accurately under time constraints', daysAgo: 1 },
    { id: 'a8', name: 'Reflection Journal', lessonObjective: 'Show strategy and explain next steps', daysAgo: 0 }
  ];

  const standards = [
    'Add within 100',
    'Place value decomposition',
    'Regrouping strategies',
    'Explain mathematical reasoning',
    'Model with equations'
  ];

  const topics = ['Place Value', 'Addition Strategies', 'Error Analysis', 'Reasoning and Proof', 'Fluency'];

  const skylineImages = [
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

  const stickerTypes = [
    'using structure well',
    'applying a strategy',
    'good error correction',
    'solid explanation',
    'neat diagram'
  ];

  function seededRandom(seed) {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function weightedSticker(rand) {
    const n = rand();
    if (n < 0.34) return 'applying a strategy';
    if (n < 0.59) return 'using structure well';
    if (n < 0.75) return 'good error correction';
    if (n < 0.9) return 'solid explanation';
    return 'neat diagram';
  }

  function tagCount(rand) {
    const n = rand();
    if (n < 0.56) return 0;
    if (n < 0.88) return 1;
    if (n < 0.97) return 2;
    return 3;
  }

  function svgFallback(label, variant) {
    const hue = 200 + (variant % 120);
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='640' height='430' viewBox='0 0 640 430'>
        <rect width='640' height='430' fill='hsl(${hue} 50% 92%)'/>
        <rect x='24' y='20' width='592' height='390' rx='14' fill='white' stroke='#94a3b8'/>
        <text x='48' y='64' font-size='24' fill='#0f172a' font-family='Arial'>${label}</text>
        <line x1='48' y1='112' x2='576' y2='112' stroke='#64748b' stroke-width='3'/>
        <line x1='48' y1='154' x2='546' y2='154' stroke='#64748b' stroke-width='3'/>
        <line x1='48' y1='196' x2='566' y2='196' stroke='#64748b' stroke-width='3'/>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  function preseedTags(rand, idPrefix) {
    const count = tagCount(rand);
    const tags = [];
    for (let i = 0; i < count; i += 1) {
      tags.push({
        id: `${idPrefix}-tag-${i + 1}`,
        type: 'tag',
        category: weightedSticker(rand),
        x: 20 + rand() * 60,
        y: 20 + rand() * 60
      });
    }
    return tags;
  }

  function createDemoClassSet(sampleCount = 200) {
    const rand = seededRandom(42);
    const now = new Date();

    const scans = Array.from({ length: sampleCount }, (_, index) => {
      const student = students[Math.floor(rand() * students.length)];
      const assignment = assignments[Math.floor(rand() * assignments.length)];
      const standard = standards[Math.floor(rand() * standards.length)];
      const topic = topics[Math.floor(rand() * topics.length)];

      const date = new Date(now);
      date.setDate(date.getDate() - assignment.daysAgo - Math.floor(rand() * 7));
      date.setHours(8 + Math.floor(rand() * 8), Math.floor(rand() * 60), 0, 0);

      const isKeyExample = index < skylineImages.length;
      const imageUrl = skylineImages[index % skylineImages.length];

      return {
        id: `scan-${index + 1}`,
        studentId: student.id,
        student: student.name,
        assignmentId: assignment.id,
        assignment: assignment.name,
        lessonObjective: assignment.lessonObjective,
        standard,
        topic,
        capturedAt: date.toISOString().slice(0, 16),
        imageUrl,
        fallbackImageUrl: svgFallback(`${student.name} · ${assignment.name}`, index),
        isKeyExample,
        sprintDone: false,
        annotations: preseedTags(rand, `scan-${index + 1}`)
      };
    });

    return {
      unitName: 'Skyline Express Unit',
      scans,
      students,
      assignments,
      standards,
      topics,
      stickerTypes
    };
  }

  global.WorkSaverDemoData = { createDemoClassSet };
})(window);
