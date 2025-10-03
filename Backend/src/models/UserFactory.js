// Factory Pattern: create different user role objects without specifying exact class:contentReference[oaicite:1]{index=1}.
// Define classes for different user roles to encapsulate role-specific behaviors:
class UserBase {
  constructor(name, email) { this.name = name; this.email = email; }
  // Default permissions (to be overridden by subclasses)
  getPermissions() { return []; }
}
class EmployeeUser extends UserBase {
  getPermissions() {
    return ["VIEW_SHIFTS", "REQUEST_LEAVE", "PROPOSE_SWAP"];
  }
}
class TeamLeadUser extends UserBase {
  getPermissions() {
    return ["VIEW_SHIFTS", "REQUEST_LEAVE", "APPROVE_LEAVE", "VIEW_TEAM_REQUESTS"];
  }
}
class ManagerUser extends UserBase {
  getPermissions() {
    return ["VIEW_SHIFTS", "ASSIGN_SHIFT", "APPROVE_LEAVE", "APPROVE_SWAP", "MANAGE_USERS"];
  }
}

class UserFactory {
  /** Factory Method: returns an instance of a user subclass based on role */
  static createUser(name, email, role) {
    switch(role) {
      case "TeamLead": return new TeamLeadUser(name, email);
      case "Manager":  return new ManagerUser(name, email);
      default:         return new EmployeeUser(name, email);
    }
  }
}

module.exports = UserFactory;
