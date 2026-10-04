// Test setup - runs before all tests

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.PORT = process.env.PORT || '5001';

// Global test utilities
global.testHelpers = {
  async cleanupTestUsers(pool) {
    await pool.query("DELETE FROM users WHERE username LIKE 'test%'");
  },
};
