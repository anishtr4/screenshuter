// MongoDB initialization script
db = db.getSiblingDB('screenshot-saas');

// Create collections with indexes
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ active: 1 });

db.createCollection('projects');
db.projects.createIndex({ userId: 1, createdAt: -1 });
db.projects.createIndex({ userId: 1, name: 1 }, { unique: true });

db.createCollection('screenshots');
db.screenshots.createIndex({ projectId: 1, createdAt: -1 });
db.screenshots.createIndex({ collectionId: 1, createdAt: -1 });
db.screenshots.createIndex({ status: 1 });
db.screenshots.createIndex({ type: 1 });

db.createCollection('collections');
db.collections.createIndex({ projectId: 1, createdAt: -1 });

db.createCollection('apitokens');
db.apitokens.createIndex({ userId: 1, createdAt: -1 });
db.apitokens.createIndex({ hashedToken: 1 }, { unique: true });
db.apitokens.createIndex({ active: 1 });

db.createCollection('configs');
db.configs.createIndex({ key: 1 }, { unique: true });

db.createCollection('agendajobs');
db.agendajobs.createIndex({ name: 1 });
db.agendajobs.createIndex({ nextRunAt: 1 });
db.agendajobs.createIndex({ lockedAt: 1 });

print('Database initialized successfully');
