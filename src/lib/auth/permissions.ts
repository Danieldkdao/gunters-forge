import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

// Handles permissions across user roles

const statement = {
  ...defaultStatements,
  product: ["create", "update"],
  order: ["create", "read", "update", "cancel", "collect_cash"],
} as const;

const ac = createAccessControl(statement);

const user = ac.newRole({
  product: [],
  order: ["create", "read", "cancel"],
});

const admin = ac.newRole({
  product: ["create", "update"],
  order: ["create", "read", "update", "cancel", "collect_cash"],
  ...adminAc.statements,
});

export const roleOptions = {
  ac,
  roles: {
    admin,
    user,
  },
} as const;

type PermissionStatements = typeof statement;
export type Permissions = {
  -readonly [
    Resource in keyof PermissionStatements
  ]?: PermissionStatements[Resource][number][];
};
