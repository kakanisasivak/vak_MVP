// seed-demo.js — Vak AI Technologies Demo Data Seeder
// ─────────────────────────────────────────────────────────────────────────────
// Creates a complete demo environment:
//   Institution → Capability Target → Clusters → Nodes → Engagement → Learners
//
// Run: node seed-demo.js
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const { getDb, initDb } = require('./db/init');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ─── Demo credentials (printed at end) ───────────────────────────────────────
const INSTITUTION_EMAIL    = 'demo@vak.ai';
const INSTITUTION_PASSWORD = 'Demo@123';

initDb();
const db = getDb();

// ─── Wipe existing demo data (idempotent re-runs) ────────────────────────────
const existing = db.prepare("SELECT id FROM institutions WHERE contact_email = ?").get(INSTITUTION_EMAIL);
if (existing) {
  const instId = existing.id;
  // Delete in FK-safe order
  db.prepare("DELETE FROM mastery_logs WHERE engagement_id IN (SELECT id FROM engagements WHERE institution_id = ?)").run(instId);
  db.prepare("DELETE FROM node_mastery WHERE engagement_learner_id IN (SELECT el.id FROM engagement_learners el JOIN engagements e ON e.id = el.engagement_id WHERE e.institution_id = ?)").run(instId);
  db.prepare("DELETE FROM mastery_checks WHERE engagement_learner_id IN (SELECT el.id FROM engagement_learners el JOIN engagements e ON e.id = el.engagement_id WHERE e.institution_id = ?)").run(instId);
  db.prepare("DELETE FROM session_messages WHERE session_id IN (SELECT ls.id FROM learning_sessions ls JOIN engagement_learners el ON el.id = ls.engagement_learner_id JOIN engagements e ON e.id = el.engagement_id WHERE e.institution_id = ?)").run(instId);
  db.prepare("DELETE FROM learning_sessions WHERE engagement_learner_id IN (SELECT el.id FROM engagement_learners el JOIN engagements e ON e.id = el.engagement_id WHERE e.institution_id = ?)").run(instId);
  db.prepare("DELETE FROM engagement_learners WHERE engagement_id IN (SELECT id FROM engagements WHERE institution_id = ?)").run(instId);
  db.prepare("DELETE FROM engagements WHERE institution_id = ?").run(instId);
  db.prepare("DELETE FROM skill_nodes WHERE cluster_id IN (SELECT sc.id FROM skill_clusters sc JOIN capability_targets ct ON ct.id = sc.capability_target_id WHERE ct.institution_id = ?)").run(instId);
  db.prepare("DELETE FROM skill_clusters WHERE capability_target_id IN (SELECT id FROM capability_targets WHERE institution_id = ?)").run(instId);
  db.prepare("DELETE FROM capability_targets WHERE institution_id = ?").run(instId);
  db.prepare("DELETE FROM learners WHERE institution_id = ?").run(instId);
  db.prepare("DELETE FROM institutions WHERE id = ?").run(instId);
  console.log('♻️  Cleared existing demo data');
}

// ─── 1. Institution ───────────────────────────────────────────────────────────
const instId = uuidv4();
db.prepare(`
  INSERT INTO institutions (id, name, type, contact_name, contact_email, contact_phone, city, password_hash)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  instId,
  'Vak Demo Institute',
  'coding_bootcamp',
  'Sasi Kakani',
  INSTITUTION_EMAIL,
  '+91-9000000000',
  'Hyderabad',
  bcrypt.hashSync(INSTITUTION_PASSWORD, 10)
);

// ─── 2. Learners ──────────────────────────────────────────────────────────────
const learner1Id = uuidv4();
const learner2Id = uuidv4();

db.prepare(`
  INSERT INTO learners (id, institution_id, name, email, learner_ref, language, profile_type)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(learner1Id, instId, 'Arjun Sharma', 'arjun@demo.com', 'HINDI001', 'hindi', 'bootcamp_participant');

db.prepare(`
  INSERT INTO learners (id, institution_id, name, email, learner_ref, language, profile_type)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(learner2Id, instId, 'Priya Reddy', 'priya@demo.com', 'TELUGU001', 'telugu', 'college_student');

// ─── 3. Capability Target (Path A — pre-structured) ──────────────────────────
const ctId = uuidv4();
const extractedTargets = JSON.stringify({
  title: 'Python Programming Fundamentals',
  clusters: [
    {
      label: 'Variables & Data Types',
      description: 'Understanding how Python stores and handles data',
      required_proficiency: 'beginner',
      priority: 'high',
      mastery_threshold: 0.70
    },
    {
      label: 'Control Flow',
      description: 'if/else conditions and loops',
      required_proficiency: 'beginner',
      priority: 'high',
      mastery_threshold: 0.70
    }
  ]
});

db.prepare(`
  INSERT INTO capability_targets (id, institution_id, version, title, path, raw_input, extracted_targets, confirmed, confirmed_at, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
`).run(ctId, instId, '1.0', 'Python Programming Fundamentals', 'A',
  'Teach Python fundamentals to beginner learners in Hindi and Telugu.',
  extractedTargets, 1, 'active');

// ─── 4. Skill Clusters ────────────────────────────────────────────────────────
const cluster1Id = uuidv4();
const cluster2Id = uuidv4();

db.prepare(`
  INSERT INTO skill_clusters (id, capability_target_id, cluster_label, cluster_ref, required_proficiency, mastery_threshold, priority, sequence_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(cluster1Id, ctId, 'Variables & Data Types', 'CLU-01', 'beginner', 0.70, 'high', 1);

db.prepare(`
  INSERT INTO skill_clusters (id, capability_target_id, cluster_label, cluster_ref, required_proficiency, mastery_threshold, priority, sequence_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(cluster2Id, ctId, 'Control Flow', 'CLU-02', 'beginner', 0.70, 'high', 2);

// ─── 5. Skill Nodes ───────────────────────────────────────────────────────────
const node1Id = uuidv4();
const node2Id = uuidv4();
const node3Id = uuidv4();
const node4Id = uuidv4();
const node5Id = uuidv4();

// Cluster 1 nodes
db.prepare(`
  INSERT INTO skill_nodes (id, cluster_id, node_label, description, sequence_order, difficulty_level, node_type)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(node1Id, cluster1Id, 'What is a variable?', 'Understanding variables as named containers for data', 1, 1, 'concept');

db.prepare(`
  INSERT INTO skill_nodes (id, cluster_id, node_label, description, sequence_order, difficulty_level, node_type)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(node2Id, cluster1Id, 'Integers and Floats', 'Numeric data types and when to use each', 2, 1, 'concept');

db.prepare(`
  INSERT INTO skill_nodes (id, cluster_id, node_label, description, sequence_order, difficulty_level, node_type)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(node3Id, cluster1Id, 'Strings and String Operations', 'Text data type and basic string manipulation', 3, 2, 'applied');

// Cluster 2 nodes
db.prepare(`
  INSERT INTO skill_nodes (id, cluster_id, node_label, description, sequence_order, difficulty_level, node_type)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(node4Id, cluster2Id, 'if / elif / else conditions', 'Making decisions in code based on conditions', 1, 2, 'concept');

db.prepare(`
  INSERT INTO skill_nodes (id, cluster_id, node_label, description, sequence_order, difficulty_level, node_type)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(node5Id, cluster2Id, 'for loops and while loops', 'Repeating actions and iterating over sequences', 2, 2, 'applied');

// ─── 6. Engagements ──────────────────────────────────────────────────────────
const engagementHindiId = uuidv4();
const engagementTeluguId = uuidv4();

db.prepare(`
  INSERT INTO engagements (id, institution_id, capability_target_id, title, language, status, started_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
`).run(engagementHindiId, instId, ctId, 'Python Batch — Hindi (Demo)', 'hindi', 'active');

db.prepare(`
  INSERT INTO engagements (id, institution_id, capability_target_id, title, language, status, started_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
`).run(engagementTeluguId, instId, ctId, 'Python Batch — Telugu (Demo)', 'telugu', 'active');

// ─── 7. Enrol learners into engagements ──────────────────────────────────────
const el1Id = uuidv4();
const el2Id = uuidv4();

db.prepare(`
  INSERT INTO engagement_learners (id, engagement_id, learner_id, current_node_id, current_cluster_id, overall_status)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(el1Id, engagementHindiId, learner1Id, node1Id, cluster1Id, 'in_progress');

db.prepare(`
  INSERT INTO engagement_learners (id, engagement_id, learner_id, current_node_id, current_cluster_id, overall_status)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(el2Id, engagementTeluguId, learner2Id, node1Id, cluster1Id, 'in_progress');

db.close();

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n✅ Demo data seeded successfully!\n');
console.log('═══════════════════════════════════════════════════════');
console.log('  INSTITUTION LOGIN');
console.log('───────────────────────────────────────────────────────');
console.log('  URL      : http://localhost:3000/login');
console.log('  Email    : demo@vak.ai');
console.log('  Password : Demo@123');
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  LEARNER LOGIN — Hindi');
console.log('───────────────────────────────────────────────────────');
console.log('  URL           : http://localhost:3000/learner-login');
console.log('  Learner Ref   : HINDI001');
console.log('  Engagement ID :', engagementHindiId);
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  LEARNER LOGIN — Telugu');
console.log('───────────────────────────────────────────────────────');
console.log('  URL           : http://localhost:3000/learner-login');
console.log('  Learner Ref   : TELUGU001');
console.log('  Engagement ID :', engagementTeluguId);
console.log('═══════════════════════════════════════════════════════\n');
