export const initialUsers = [
  {
    id: 'u1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: null,
    status: 'online',
    bio: 'Product Lead @ TechFlow • Real-time web & distributed systems',
  },
  {
    id: 'u2',
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    avatar: null,
    status: 'online',
    bio: 'Senior Cloud Architect • Kubernetes, Go & WebSockets',
  },
  {
    id: 'u3',
    name: 'David Miller',
    email: 'david@example.com',
    avatar: null,
    status: 'online',
    bio: 'Frontend Engineer • React, JavaScript & Tailwind CSS wizard',
  },
  {
    id: 'u4',
    name: 'Emma Watson',
    email: 'emma@example.com',
    avatar: null,
    status: 'away',
    lastSeen: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    bio: 'Staff Product Designer • Crafting micro-interactions and sleek UX',
  },
  {
    id: 'u5',
    name: 'Liam Smith',
    email: 'liam@example.com',
    avatar: null,
    status: 'online',
    bio: 'Staff Backend Engineer • High throughput Node.js & Redis cluster',
  },
  {
    id: 'u6',
    name: 'Olivia Brown',
    email: 'olivia@example.com',
    avatar: null,
    status: 'online',
    bio: 'Engineering Manager • Scaling distributed engineering squads',
  },
  {
    id: 'u7',
    name: 'Noah Davis',
    email: 'noah@example.com',
    avatar: null,
    status: 'busy',
    bio: 'DevOps & SRE Specialist • CI/CD automation & observability',
  },
  {
    id: 'u8',
    name: 'Sophia Garcia',
    email: 'sophia@example.com',
    avatar: null,
    status: 'online',
    bio: 'Mobile Lead • React Native, Swift & offline-first storage',
  },
  {
    id: 'u9',
    name: 'Lucas Martinez',
    email: 'lucas@example.com',
    avatar: null,
    status: 'away',
    lastSeen: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    bio: 'Full Stack Engineer • GraphQL & WebSockets specialist',
  },
  {
    id: 'u10',
    name: 'Mia Rodriguez',
    email: 'mia@example.com',
    avatar: null,
    status: 'online',
    bio: 'QA & Automation Architect • Playwright & Cypress test suites',
  },
  {
    id: 'u11',
    name: 'Ethan Wilson',
    email: 'ethan@example.com',
    avatar: null,
    status: 'offline',
    lastSeen: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    bio: 'Security Engineer • OAuth2, JWT & zero-trust network policies',
  },
  {
    id: 'u12',
    name: 'Isabella Anderson',
    email: 'isabella@example.com',
    avatar: null,
    status: 'online',
    bio: 'Data Scientist • Predictive analytics & user behavior telemetry',
  },
  {
    id: 'u13',
    name: 'Mason Thomas',
    email: 'mason@example.com',
    avatar: null,
    status: 'busy',
    bio: 'Performance Architect • Profiling memory leaks & frame drops',
  },
  {
    id: 'u14',
    name: 'Charlotte Jackson',
    email: 'charlotte@example.com',
    avatar: null,
    status: 'online',
    bio: 'Product Marketing • Launching tech products & community engagement',
  },
  {
    id: 'u15',
    name: 'James White',
    email: 'james@example.com',
    avatar: null,
    status: 'away',
    lastSeen: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    bio: 'Technical Writer • Developer documentation, SDK references & guides',
  },
  {
    id: 'u16',
    name: 'Harper Harris',
    email: 'harper@example.com',
    avatar: null,
    status: 'online',
    bio: 'Core Systems Engineer • Real-time protocol design & buffering',
  },
  {
    id: 'u17',
    name: 'Benjamin Martin',
    email: 'benjamin@example.com',
    avatar: null,
    status: 'offline',
    lastSeen: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    bio: 'Infrastructure Engineer • Terraform, Multi-region cloud & VPC routing',
  },
  {
    id: 'u18',
    name: 'Evelyn Thompson',
    email: 'evelyn@example.com',
    avatar: null,
    status: 'online',
    bio: 'Developer Advocate • Web standards, developer tooling & live coding',
  },
  {
    id: 'u19',
    name: 'Elijah Garcia',
    email: 'elijah@example.com',
    avatar: null,
    status: 'busy',
    bio: 'SRE Lead • Incident response, SLO/SLA management & resilience',
  },
  {
    id: 'u20',
    name: 'Abigail Martinez',
    email: 'abigail@example.com',
    avatar: null,
    status: 'online',
    bio: 'Design Systems Specialist • Accessibility, tokens & motion graphics',
  },
  {
    id: 'u21',
    name: 'Daniel Robinson',
    email: 'daniel@example.com',
    avatar: null,
    status: 'away',
    lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    bio: 'Solutions Architect • Enterprise integrations & event streams',
  },
  {
    id: 'u22',
    name: 'Chloe Clark',
    email: 'chloe@example.com',
    avatar: null,
    status: 'online',
    bio: 'Frontend Developer • CSS architecture & micro-animations',
  }
];

// Group channels
export const initialConversations = [
  {
    id: 'c1',
    type: 'group',
    name: '🚀 Product Launch Q4',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    description: 'Coordination channel for our upcoming real-time product release',
    participantIds: initialUsers.map(u => u.id),
    adminIds: ['u1', 'u3'],
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'c4',
    type: 'group',
    name: '🎨 Design Systems & UI',
    avatar: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=150&auto=format&fit=crop&q=80',
    description: 'Design review, components, dark mode color tokens & animations',
    participantIds: initialUsers.map(u => u.id),
    adminIds: ['u4'],
    updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  }
];

export const initialMessages = [
  // Group c1 messages — Product Launch Q4
  {
    id: 'm101',
    conversationId: 'c1',
    senderId: 'u6',
    text: 'Good morning team 🚀 Officially T-minus 14 days to the Q4 launch. All squads please confirm your deliverables are on track in this thread.',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'read',
    reactions: { '🙌': ['u1', 'u2', 'u3', 'u4'], '🚀': ['u5', 'u7'] },
  },
  {
    id: 'm102',
    conversationId: 'c1',
    senderId: 'u2',
    text: 'Backend is locked and loaded ✅ Infrastructure scaled to 3× capacity. Stress test hit 100k concurrent connections with sub-15ms latency. We are ready.',
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    status: 'read',
    replyTo: {
      id: 'm101',
      senderId: 'u6',
      senderName: 'Olivia Brown',
      text: 'Good morning team 🚀 Officially T-minus 14 days to the Q4 launch...',
    },
    reactions: { '🔥': ['u1', 'u3', 'u6'], '💪': ['u4', 'u5'] },
  },
  {
    id: 'm103',
    conversationId: 'c1',
    senderId: 'u4',
    text: 'Design sign-off complete! 🎨 Attached are the final Figma handoff specs and the dark mode glassmorphism preview. All tokens are exported.',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    status: 'read',
    attachments: [
      {
        id: 'att-1',
        name: 'Q4-Launch-Design-Handoff-v3.jpg',
        size: 842000,
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
      },
      {
        id: 'att-2',
        name: 'Design-Tokens-Spec-v3.pdf',
        size: 1450000,
        type: 'application/pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      }
    ],
    reactions: { '❤️': ['u1', 'u2', 'u3'], '✨': ['u6', 'u7'] },
  },
  {
    id: 'm104',
    conversationId: 'c1',
    senderId: 'u14',
    text: 'Marketing is ready to go! 📣 Press kit is finalized, social media posts are scheduled, and the landing page copy has been reviewed by legal. All green!',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'read',
    reactions: { '🎉': ['u1', 'u2', 'u3', 'u4'], '👏': ['u5', 'u6'] }
  },
  {
    id: 'm105',
    conversationId: 'c1',
    senderId: 'u1',
    text: 'Excellent work everyone 🙏 Go/no-go call is scheduled for Friday 3 PM. Please review the launch runbook beforehand. We are launching this 🚀',
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    status: 'read',
    reactions: { '🚀': ['u2', 'u3', 'u4', 'u5', 'u6', 'u7'] }
  },

  // Group c4 (Design Systems & UI) messages
  {
    id: 'm401',
    conversationId: 'c4',
    senderId: 'u4',
    text: 'Welcome to the Design Systems channel! We just finalized the typography scale and dark mode color tokens.',
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    status: 'read',
    reactions: { '✨': ['u1', 'u3'] }
  },
  {
    id: 'm402',
    conversationId: 'c4',
    senderId: 'u1',
    text: 'Looks super clean Emma. The contrast ratios in dark mode hit AAA accessibility criteria.',
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    status: 'read'
  },
  {
    id: 'm403',
    conversationId: 'c4',
    senderId: 'u3',
    text: 'I have wired the new CSS variables into our component library with smooth transition timing.',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'read',
    reactions: { '🚀': ['u4'] }
  }
];

// Sample dialogues for direct chats
const sampleDirectDialogues = [
  "Hey! Did you check out the new WebSocket reconnection backoff handling?",
  "The optimistic UI update makes sending feel instant, great job!",
  "Are we still on for the design review at 2 PM?",
  "Just pushed the latest PR for infinite scrolling pagination.",
  "Can you review the API payload structure when you have a chance?",
  "Working on the file upload progress bar animation now.",
  "The dark mode palette looks super clean with the violet accents!",
  "Heartbeat ping/pong interval is now calibrated to 25 seconds.",
  "Added support for emoji reactions and reply quote jumps.",
  "Let me know when the staging server is updated so I can run smoke tests.",
  "Checked the bundle size after code splitting — under 80KB gzipped!",
  "The typing indicator debounce logic works really smoothly now.",
  "Shared the updated system architecture diagram in the group channel.",
  "Delivered status checkmarks are now fully synced with recipient socket read events.",
  "Thanks for the quick feedback on the pull request!",
  "Let's sync up after standup regarding the group member management.",
  "I've verified the keyboard shortcut: Enter sends and Shift+Enter inserts newline.",
  "The audio chime on incoming messages is very satisfying!",
  "Testing live multi-tab communication right now, zero latency detected.",
  "All 10 project channels and direct chats are fully synchronized and ready for testing."
];

// Helper to seed 8 direct chats for each user so everyone starts with defaultly 10 chats (2 group + 8 direct)
const seedCohort = initialUsers.slice(0, 9);
let msgCounter = 500;

for (let i = 0; i < seedCohort.length; i++) {
  for (let j = i + 1; j < seedCohort.length; j++) {
    const userA = seedCohort[i];
    const userB = seedCohort[j];

    const convId = `c_direct_${[userA.id, userB.id].sort().join('_')}`;
    const minutesAgo = ((i * 3 + j) % 20 + 1) * 7;
    const updatedAt = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();

    const conv = {
      id: convId,
      type: 'direct',
      name: userB.name,
      avatar: userB.avatar,
      participantIds: [userA.id, userB.id],
      updatedAt,
    };

    initialConversations.push(conv);

    msgCounter++;
    const m1 = {
      id: `m_${msgCounter}`,
      conversationId: convId,
      senderId: userB.id,
      text: sampleDirectDialogues[(i + j) % sampleDirectDialogues.length],
      createdAt: new Date(Date.now() - (minutesAgo + 4) * 60 * 1000).toISOString(),
      status: 'read'
    };

    msgCounter++;
    const m2 = {
      id: `m_${msgCounter}`,
      conversationId: convId,
      senderId: (i + j) % 2 === 0 ? userA.id : userB.id,
      text: (i + j) % 2 === 0
        ? "Sounds awesome! Testing the real-time response right now."
        : `Hey, quick update: ${sampleDirectDialogues[(i + j + 2) % sampleDirectDialogues.length]}`,
      createdAt: updatedAt,
      status: 'read',
      reactions: (i + j) % 3 === 0 ? { '👍': [userA.id] } : undefined
    };

    initialMessages.push(m1, m2);
  }
}
