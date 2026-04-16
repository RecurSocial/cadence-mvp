export type UserRole = 'owner' | 'admin' | 'staff';

const ROLE_LEVEL: Record<UserRole, number> = {
  owner: 3,
  admin: 2,
  staff: 1,
};

function hasMinRole(userRole: UserRole | null, required: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[required];
}

export function canApproveReject(role: UserRole | null): boolean {
  return hasMinRole(role, 'admin');
}

export function canPublishDirectly(role: UserRole | null): boolean {
  return hasMinRole(role, 'admin');
}

export function canDeletePost(role: UserRole | null): boolean {
  return hasMinRole(role, 'admin');
}

export function canManageUsers(role: UserRole | null): boolean {
  return hasMinRole(role, 'admin');
}

export function canManagePractitioners(role: UserRole | null): boolean {
  return hasMinRole(role, 'admin');
}

export function canConnectSocial(role: UserRole | null): boolean {
  return hasMinRole(role, 'admin');
}

export function canManageBilling(role: UserRole | null): boolean {
  return role === 'owner';
}

export function canDeleteOrg(role: UserRole | null): boolean {
  return role === 'owner';
}

export function canChangeRoles(role: UserRole | null): boolean {
  return role === 'owner';
}

export function canEditPost(role: UserRole | null, isAuthor: boolean, postStatus?: string): boolean {
  if (hasMinRole(role, 'admin')) return true;
  if (role === 'staff' && isAuthor) {
    return !postStatus || postStatus === 'draft' || postStatus === 'pending_review';
  }
  return false;
}

export function canInviteRole(inviterRole: UserRole | null, targetRole: UserRole): boolean {
  if (!inviterRole) return false;
  if (targetRole === 'owner') return inviterRole === 'owner';
  return hasMinRole(inviterRole, 'admin');
}
