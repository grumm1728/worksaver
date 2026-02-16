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
    { id: 'a6', name: 'Error Analysis Sort', lessonObjective: 'Find and fix misconception patterns', daysAgo: 4 },
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

  function seededRandom(seed) {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function svgThumbnail(label, variant) {
    const colors = ['#dbeafe', '#fef3c7', '#dcfce7', '#ede9fe', '#fee2e2'];
    const accent = colors[variant % colors.length];
    const lineA = 24 + (variant % 5) * 12;
    const lineB = 40 + (variant % 6) * 10;
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='640' height='430' viewBox='0 0 640 430'>
        <rect width='640' height='430' fill='${accent}'/>
        <rect x='28' y='22' width='584' height='386' rx='14' fill='white' stroke='#94a3b8' />
        <text x='54' y='72' font-size='24' fill='#1e293b' font-family='Arial'>${label}</text>
        <line x1='54' y1='${lineA + 84}' x2='560' y2='${lineA + 84}' stroke='#64748b' stroke-width='3'/>
        <line x1='54' y1='${lineB + 120}' x2='510' y2='${lineB + 120}' stroke='#64748b' stroke-width='3'/>
        <line x1='54' y1='${lineA + 160}' x2='582' y2='${lineA + 160}' stroke='#64748b' stroke-width='3'/>
        <rect x='54' y='300' width='130' height='72' fill='none' stroke='#334155' stroke-width='3'/>
        <rect x='188' y='300' width='150' height='72' fill='none' stroke='#334155' stroke-width='3'/>
        <rect x='342' y='300' width='102' height='72' fill='none' stroke='#334155' stroke-width='3'/>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  function createDemoClassSet(sampleCount = 200) {
    const rand = seededRandom(42);
    const now = new Date();

    const scans = Array.from({ length: sampleCount }, (_, index) => {
      const student = students[Math.floor(rand() * students.length)];
      const assignment = assignments[Math.floor(rand() * assignments.length)];
      const standard = standards[Math.floor(rand() * standards.length)];
      const extraNoiseDays = Math.floor(rand() * 6);
      const date = new Date(now);
      date.setDate(date.getDate() - assignment.daysAgo - extraNoiseDays);
      date.setHours(8 + Math.floor(rand() * 8), Math.floor(rand() * 60), 0, 0);

      const useProvided = index < providedWorkSampleFiles.length;
      const imageUrl = useProvided ? providedWorkSampleFiles[index] : svgThumbnail(`${student.name} · ${assignment.name}`, index);

      return {
        id: `scan-${index + 1}`,
        studentId: student.id,
        student: student.name,
        assignmentId: assignment.id,
        assignment: assignment.name,
        lessonObjective: assignment.lessonObjective,
        standard,
        capturedAt: date.toISOString().slice(0, 16),
        imageUrl,
        fallbackImageUrl: svgThumbnail(`Fallback ${student.name}`, index + 1000),
        isKeyExample: useProvided,
        annotations: []
      };
    });

    return { scans, students, assignments, standards };
  }

  global.WorkSaverDemoData = {
    createDemoClassSet
  };
})(window);
