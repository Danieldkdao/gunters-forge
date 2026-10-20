import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

// Handles permissions across user roles

const statement = {
  ...defaultStatements,
  product: ["create", "update"],
} as const;

const ac = createAccessControl(statement);

const user = ac.newRole({
  product: [],
});

const admin = ac.newRole({
  product: ["create", "update"],
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
