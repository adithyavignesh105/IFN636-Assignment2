const request = require('supertest');
const app = require('../src/app');

describe("Auth API", () => {
  it("should return 401 for protected route without token", async () => {
    const res = await request(app).get("/api/shifts");
    expect(res.statusCode).toBe(401);
  });
  // Additional tests can simulate login and then access protected routes using token
});

describe("Business Logic", () => {
  it("Factory creates correct user types with permissions", () => {
    const UserFactory = require('../src/models/UserFactory');
    const manager = UserFactory.createUser("Alice", "alice@test.com", "Manager");
    const employee = UserFactory.createUser("Bob", "bob@test.com", "Employee");
    expect(manager.getPermissions()).toContain("ASSIGN_SHIFT");
    expect(employee.getPermissions()).not.toContain("ASSIGN_SHIFT");
    expect(employee.getPermissions()).toContain("REQUEST_LEAVE");
  });
});
