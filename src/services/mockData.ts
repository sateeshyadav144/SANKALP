import { StudentProfile, Budget, Expense, Subject, AttendanceRecord, Note, Diagram, Flashcard, CodeSnippet, SafetyResource } from '../types';

export const INITIAL_MOCK_USER: StudentProfile = {
  id: 'usr_demo_sankalp_2026',
  full_name: 'Aarav Sharma',
  roll_number: '21CS048',
  department: 'Computer Science & Engineering',
  semester: '6th Semester',
  email: 'student@campus.edu',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'CS Undergrad specializing in Distributed Systems & AI. Tech Lead at Campus Developer Club.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_MOCK_BUDGET: Budget = {
  id: 'bgt_001',
  user_id: INITIAL_MOCK_USER.id,
  month: new Date().toISOString().slice(0, 7), // current YYYY-MM
  monthly_limit: 6500,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp_001',
    user_id: INITIAL_MOCK_USER.id,
    title: 'Semester Textbooks (Operating Systems & DBMS)',
    amount: 1450,
    category: 'Books & Stationery',
    date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    payment_method: 'UPI',
    notes: 'Purchased from College Cooperative Store with 10% student discount',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp_002',
    user_id: INITIAL_MOCK_USER.id,
    title: 'Campus Food Court & Nescafe',
    amount: 320,
    category: 'Food & Canteen',
    date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
    payment_method: 'UPI',
    notes: 'Lunch & study group coffee',
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp_003',
    user_id: INITIAL_MOCK_USER.id,
    title: 'Metro Smart Card Recharge',
    amount: 800,
    category: 'Travel & Transit',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    payment_method: 'Card',
    notes: 'Monthly student commute pass',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp_004',
    user_id: INITIAL_MOCK_USER.id,
    title: 'Hostel High-Speed Fiber Internet Contribution',
    amount: 600,
    category: 'Utilities',
    date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString().split('T')[0],
    payment_method: 'UPI',
    notes: 'Quarterly split with wing mates',
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp_005',
    user_id: INITIAL_MOCK_USER.id,
    title: 'Arduino Kit & Sensor Module for IoT Lab',
    amount: 980,
    category: 'Books & Stationery',
    date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString().split('T')[0],
    payment_method: 'UPI',
    notes: 'Project work component',
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
  },
];

export const INITIAL_MOCK_SUBJECTS: Subject[] = [
  {
    id: 'sub_001',
    user_id: INITIAL_MOCK_USER.id,
    name: 'Operating Systems & Kernels',
    code: 'CS-301',
    instructor: 'Dr. V. Ramanujan',
    target_attendance_percentage: 75,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub_002',
    user_id: INITIAL_MOCK_USER.id,
    name: 'Design & Analysis of Algorithms',
    code: 'CS-302',
    instructor: 'Prof. Ananya Iyer',
    target_attendance_percentage: 80,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub_003',
    user_id: INITIAL_MOCK_USER.id,
    name: 'Database Engineering (PostgreSQL & NoSQL)',
    code: 'CS-303',
    instructor: 'Dr. Rajesh Nair',
    target_attendance_percentage: 75,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub_004',
    user_id: INITIAL_MOCK_USER.id,
    name: 'Computer Networks & Security',
    code: 'CS-304',
    instructor: 'Prof. K. Venkatesh',
    target_attendance_percentage: 75,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub_005',
    user_id: INITIAL_MOCK_USER.id,
    name: 'Artificial Intelligence & Machine Learning',
    code: 'CS-305',
    instructor: 'Dr. Meera Sen',
    target_attendance_percentage: 75,
    created_at: new Date().toISOString(),
  },
];

// Generate 30 days of realistic attendance history
export const generateInitialMockAttendance = (userId: string, subjects: Subject[]): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  subjects.forEach((sub, sIdx) => {
    // Generate 18 class meetings over the past 4 weeks
    for (let dayOffset = 25; dayOffset >= 1; dayOffset--) {
      // Classes only on weekdays (Mon-Fri)
      const d = new Date(today);
      d.setDate(today.getDate() - dayOffset);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Deterministic schedule based on subject index
      if ((dayOffset + sIdx) % 2 === 0) {
        // Attendance probability based on subject:
        // OS: ~88%, Algorithms: ~72% (warning trigger!), DB: ~92%, Networks: ~85%, AI: ~90%
        let isPresent = true;
        if (sIdx === 1) { // Algorithms has lower attendance for testing warning threshold
          isPresent = dayOffset % 3 !== 0;
        } else {
          isPresent = dayOffset % 7 !== 0;
        }

        records.push({
          id: `att_${sIdx}_${dayOffset}`,
          user_id: userId,
          subject_id: sub.id,
          date: d.toISOString().split('T')[0],
          status: isPresent ? 'present' : 'absent',
          notes: isPresent ? 'Regular lecture' : 'Sick leave / travel',
          created_at: d.toISOString(),
        });
      }
    }
  });

  return records;
};

export const INITIAL_MOCK_NOTES: Note[] = [
  {
    id: 'note_001',
    user_id: INITIAL_MOCK_USER.id,
    title: 'Virtual Memory & Page Replacement Algorithms',
    subject: 'Operating Systems & Kernels',
    content: `Virtual memory provides an illusion of a large contiguous address space by mapping virtual addresses to physical frames. When a page fault occurs, the OS kernel must fetch the requested page from disk swap space.
Key algorithms include:
1. FIFO (First-In, First-Out): Suffers from Belady's Anomaly where allocating more physical frames can paradoxically increase page faults.
2. LRU (Least Recently Used): Replaces the page that has not been accessed for the longest time. Requires hardware timestamp or stack support.
3. Optimal (OPT / Belady's Min): Replaces the page that will not be used for the longest period in the future. Theoretical benchmark, not realizable without future knowledge.
4. Clock / Second Chance Algorithm: Practical approximation of LRU using a reference bit and circular pointer queue.`,
    summary: 'Virtual memory decouples logical from physical address spaces via paging and page fault handlers. While FIFO exhibits Belady\'s Anomaly and Optimal is strictly a theoretical benchmark, practical kernels favor Clock/Second-Chance or LRU approximations to minimize expensive disk I/O penalties.',
    key_points: [
      'Paging eliminates external fragmentation through fixed-sized memory chunks.',
      'FIFO suffers from Belady’s anomaly where extra frames increase fault rates.',
      'LRU uses temporal locality but requires hardware stack/counter support.',
      'Clock algorithm offers efficient O(1) approximation using a single reference bit.'
    ],
    action_items: [
      'Implement Clock page replacement simulation in C for Lab 4.',
      'Review working set model and thrashing prevention formulas before midterms.'
    ],
    tags: ['OperatingSystems', 'VirtualMemory', 'Algorithms', 'Paging'],
    is_ai_generated: true,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'note_002',
    user_id: INITIAL_MOCK_USER.id,
    title: 'ACID Properties and Multi-Version Concurrency Control (MVCC)',
    subject: 'Database Engineering (PostgreSQL & NoSQL)',
    content: `Database transactions must guarantee ACID semantics:
- Atomicity: All or nothing execution via Write-Ahead Logging (WAL).
- Consistency: Preservation of database integrity constraints across commits.
- Isolation: Concurrent transactions do not observe intermediate dirty reads or anomalies.
- Durability: Once committed, state changes survive server crashes or power failures.

PostgreSQL implements MVCC instead of naive read-locks. Each tuple contains xmin and xmax system attributes. Readers never block writers, and writers never block readers.`,
    summary: 'ACID guarantees dependable transactional state in relational systems. PostgreSQL leverages MVCC via xmin/xmax transaction IDs and WAL journaling to achieve high concurrency without read-write locking contention.',
    key_points: [
      'Write-Ahead Logging (WAL) ensures durability prior to dirty page flush.',
      'MVCC stores row version tuples rather than locking physical rows.',
      'Isolation levels range from Read Committed to Serializable via SSI.'
    ],
    action_items: [
      'Experiment with EXPLAIN ANALYZE on index scans vs sequential scans.',
      'Test isolation anomalies under concurrent REPEATABLE READ transactions.'
    ],
    tags: ['Database', 'PostgreSQL', 'MVCC', 'ACID', 'Transactions'],
    is_ai_generated: true,
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  }
];

export const INITIAL_MOCK_DIAGRAMS: Diagram[] = [
  {
    id: 'diag_001',
    user_id: INITIAL_MOCK_USER.id,
    title: 'Campus Authentication & Service Architecture',
    subject: 'Computer Networks & Security',
    topic: 'OAuth2 & JWT Microservices',
    diagram_type: 'flowchart',
    description: 'Detailed flow of client credentials, token generation, API gateway routing, and isolated database RLS policies.',
    mermaid_code: `flowchart TD
    Client[Web/Mobile Client] -->|1. Credentials| Gateway[Sankalp API Gateway]
    Gateway -->|2. Verify| Auth[Supabase Auth Service]
    Auth -->|3. Signed JWT| Client
    Client -->|4. Bearer Token| Gateway
    Gateway -->|5. Token Relay| Service[Campus Services Engine]
    Service -->|6. RLS Query (auth.uid)| DB[(PostgreSQL + RLS)]
    DB -->|7. Isolated Student Data| Service
    Service -->|8. JSON Response| Client`,
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'diag_002',
    user_id: INITIAL_MOCK_USER.id,
    title: 'Operating System Process Lifecycle',
    subject: 'Operating Systems & Kernels',
    topic: '5-State Process Model',
    diagram_type: 'stateDiagram',
    description: 'Transition diagram illustrating states from New to Terminated under CPU scheduler preemptions.',
    mermaid_code: `stateDiagram-v2
    [*] --> New: fork() / create
    New --> Ready: Admitted to Scheduler
    Ready --> Running: Dispatch by CPU
    Running --> Ready: Timer Interrupt (Preempted)
    Running --> Waiting: I/O or Event Wait
    Waiting --> Ready: I/O Complete
    Running --> Terminated: exit() / return
    Terminated --> [*]`,
    created_at: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
  }
];

export const INITIAL_MOCK_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc_001',
    user_id: INITIAL_MOCK_USER.id,
    subject: 'Operating Systems & Kernels',
    topic: 'Virtual Memory',
    question: 'What is Belady\'s Anomaly, and which page replacement algorithm does it affect?',
    answer: 'Belady\'s Anomaly is the phenomenon where increasing the number of page frames results in an increase in the number of page faults. It commonly affects the FIFO (First-In-First-Out) algorithm, but cannot occur in stack-based algorithms like LRU.',
    hint: 'Think about FIFO queue behavior with 3 vs 4 frames.',
    difficulty: 'medium',
    times_reviewed: 4,
    times_correct: 3,
    last_reviewed_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'fc_002',
    user_id: INITIAL_MOCK_USER.id,
    subject: 'Design & Analysis of Algorithms',
    topic: 'Complexity Theory',
    question: 'What is the Master Theorem formula for recurrence T(n) = aT(n/b) + f(n)?',
    answer: 'Compare f(n) to n^(log_b(a)):\n1. If f(n) = O(n^(log_b(a) - ε)), then T(n) = Θ(n^(log_b(a)))\n2. If f(n) = Θ(n^(log_b(a)) * log^k(n)), then T(n) = Θ(n^(log_b(a)) * log^(k+1)(n))\n3. If f(n) = Ω(n^(log_b(a) + ε)) and regular, then T(n) = Θ(f(n))',
    hint: 'Consider the critical exponent log_b(a).',
    difficulty: 'hard',
    times_reviewed: 6,
    times_correct: 4,
    last_reviewed_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'fc_003',
    user_id: INITIAL_MOCK_USER.id,
    subject: 'Database Engineering (PostgreSQL & NoSQL)',
    topic: 'Transactions',
    question: 'What are the four ANSI SQL Transaction Isolation Levels in increasing order of strictness?',
    answer: '1. Read Uncommitted (allows dirty reads)\n2. Read Committed (prevents dirty reads)\n3. Repeatable Read (prevents non-repeatable reads)\n4. Serializable (prevents phantom reads and all concurrency anomalies)',
    hint: 'Starts with Read Uncommitted, ends with Serializable.',
    difficulty: 'easy',
    times_reviewed: 3,
    times_correct: 3,
    last_reviewed_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'fc_004',
    user_id: INITIAL_MOCK_USER.id,
    subject: 'Computer Networks & Security',
    topic: 'Transport Layer',
    question: 'Explain the TCP Three-Way Handshake connection establishment process.',
    answer: '1. Client -> Server: SYN (Synchronize sequence number X)\n2. Server -> Client: SYN-ACK (Server ACK X+1, SYN sequence number Y)\n3. Client -> Server: ACK (Client ACK Y+1)\nBoth parties have agreed upon initial sequence numbers and socket allocation.',
    hint: 'SYN -> SYN-ACK -> ACK',
    difficulty: 'easy',
    times_reviewed: 5,
    times_correct: 5,
    last_reviewed_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  }
];

export const INITIAL_MOCK_CODE_SNIPPETS: CodeSnippet[] = [
  {
    id: 'code_001',
    user_id: INITIAL_MOCK_USER.id,
    title: 'LRU Cache Implementation (JavaScript)',
    language: 'javascript',
    description: 'O(1) Get and Put cache eviction using Map insertion order and doubly-linked hash structure.',
    code: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    // Refresh position to most recently used
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict least recently used (first key)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

// Test Run
const lru = new LRUCache(2);
lru.put('CS301', 'Operating Systems');
lru.put('CS302', 'Algorithms');
console.log('Get CS301:', lru.get('CS301')); // returns Operating Systems
lru.put('CS303', 'Database Engineering'); // evicts CS302!
console.log('Get CS302 (evicted):', lru.get('CS302')); // returns -1
console.log('Get CS303:', lru.get('CS303'));
`,
    output: `Get CS301: Operating Systems\nGet CS302 (evicted): -1\nGet CS303: Database Engineering`,
    tags: ['DataStructures', 'LRU', 'JavaScript', 'InterviewPrep'],
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'code_002',
    user_id: INITIAL_MOCK_USER.id,
    title: 'Binary Search Tree Traversal (Python)',
    language: 'python',
    description: 'Recursive and iterative depth-first traversal of a binary search tree.',
    code: `class Node:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None

def inorder_traversal(root):
    res = []
    if root:
        res.extend(inorder_traversal(root.left))
        res.append(root.key)
        res.extend(inorder_traversal(root.right))
    return res

# Construct Tree
root = Node(50)
root.left = Node(30)
root.right = Node(70)
root.left.left = Node(20)
root.left.right = Node(40)

print("In-order traversal:", inorder_traversal(root))
`,
    output: `In-order traversal: [20, 30, 40, 50, 70]`,
    tags: ['Python', 'Trees', 'Algorithms'],
    created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
  }
];

export const INITIAL_MOCK_SAFETY: SafetyResource[] = [
  {
    id: 'safe_001',
    user_id: null,
    is_institutional: true,
    category: 'emergency',
    title: 'National Unified Emergency Hotline',
    description: 'Direct national emergency response dispatch for Police, Fire, and Ambulance emergencies.',
    phone: '112',
    email: 'emergency@gov.in',
    location: 'National Dispatcher',
    hours: '24/7 Available (Toll-Free)',
    is_verified: true,
  },
  {
    id: 'safe_002',
    user_id: null,
    is_institutional: true,
    category: 'emergency',
    title: 'Campus Security Main Gate Command Center',
    description: 'On-campus emergency squad, quick response patrol, and perimeter gate control.',
    phone: '+91 98765 43210',
    email: 'security.hq@campus.edu',
    location: 'Main Security Block, North Gate',
    hours: '24/7 Available',
    is_verified: true,
  },
  {
    id: 'safe_003',
    user_id: null,
    is_institutional: true,
    category: 'medical',
    title: 'Student Health & Wellness Clinic',
    description: 'Free outpatient medical consultation, first aid, emergency doctor, and dedicated campus ambulance.',
    phone: '+91 98765 43211',
    email: 'healthcenter@campus.edu',
    location: 'Student Amenities Complex, Level 1',
    hours: '24/7 Emergency Care',
    is_verified: true,
  },
  {
    id: 'safe_004',
    user_id: null,
    is_institutional: true,
    category: 'mental_health',
    title: 'Campus Mental Health & Student Counseling',
    description: 'Confidential psychological counselors, stress relief therapy, exam anxiety guidance, and peer mentors.',
    phone: '+91 98765 43212',
    email: 'counseling.cell@campus.edu',
    location: 'Faculty Enclave, Wing B, Suite 204',
    hours: 'Mon-Sat: 8:30 AM - 7:30 PM',
    is_verified: true,
  },
  {
    id: 'safe_005',
    user_id: null,
    is_institutional: true,
    category: 'helpline',
    title: 'National Anti-Ragging Toll-Free Helpline',
    description: 'Zero tolerance anti-ragging reporting desk monitored directly by UGC and institutional authorities.',
    phone: '1800-180-5522',
    email: 'helpline@antiragging.in',
    location: 'New Delhi UGC Central Monitoring',
    hours: '24/7 Available (Toll-Free)',
    is_verified: true,
  },
  {
    id: 'safe_006',
    user_id: null,
    is_institutional: true,
    category: 'helpline',
    title: 'Women Safety & ICC Cell (Internal Complaints)',
    description: 'Dedicated committee ensuring harassment-free campus space, rapid escorts, and grievance redressal.',
    phone: '+91 98765 43213',
    email: 'womencell@campus.edu',
    location: 'Administration Building, Room 102',
    hours: '24/7 Rapid Assistance',
    is_verified: true,
  },
  {
    id: 'safe_007',
    user_id: INITIAL_MOCK_USER.id,
    is_institutional: false,
    category: 'personal',
    title: 'Father (Emergency Contact)',
    description: 'Primary family guardian contact.',
    phone: '+91 98111 22334',
    email: 'ramesh.sharma@example.com',
    location: 'Home Residence, New Delhi',
    hours: 'Personal Contact',
    is_verified: true,
  },
  {
    id: 'safe_008',
    user_id: INITIAL_MOCK_USER.id,
    is_institutional: false,
    category: 'personal',
    title: 'Hostel Roommate (Vikram Patel)',
    description: 'Room 304, Block C Hostel roommate for immediate on-campus reach.',
    phone: '+91 98222 33445',
    email: 'vikram.p@campus.edu',
    location: 'Hostel Block C, Room 304',
    hours: 'On-Campus',
    is_verified: true,
  }
];
