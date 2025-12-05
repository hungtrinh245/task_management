// Permission constants for role-based access control

export const ROLES = {
  MANAGER: "manager",
  EMPLOYEE: "employee",
};

// Define which fields each role can edit
export const EDITABLE_FIELDS = {
  manager: {
    basic: ["title", "description", "director", "genre", "dueDate"],
    classification: ["status", "priority", "tags"],
    assignment: ["assignee"],
    approval: ["approvalStatus"],
    details: ["subtasks", "comments", "attachments"],
  },
  employee: {
    basic: [], // employees cannot edit basic info
    classification: ["status"], // only status, not priority/tags
    assignment: [], // employees cannot assign
    approval: [], // employees cannot approve
    details: ["subtasks", "comments", "attachments"], // can update progress
  },
};

// Helper function to check if field is editable
export const isFieldEditable = (role, fieldCategory, fieldName) => {
  const roleFields = EDITABLE_FIELDS[role];
  if (!roleFields) return false;
  return roleFields[fieldCategory]?.includes(fieldName) || false;
};

// Helper function to get all editable fields for a role
export const getEditableFields = (role) => {
  const roleFields = EDITABLE_FIELDS[role];
  if (!roleFields) return [];
  return Object.values(roleFields).flat();
};

// Read-only fields for specific roles
export const READ_ONLY_SECTIONS = {
  manager: [], // managers can edit everything
  employee: [
    "title",
    "description",
    "director",
    "genre",
    "dueDate",
    "priority",
    "tags",
    "assignee",
    "approvalStatus",
  ],
};
