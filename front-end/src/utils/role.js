export function hasAdminRole(user) {
    if (!user) return false;

    const rawRoles = [
        ...(Array.isArray(user.roles) ? user.roles : []),
        ...(Array.isArray(user.authorities) ? user.authorities : []),
        user.role,
        user.scope,
    ].filter(Boolean);

    const roles = rawRoles.flatMap((item) => {
        if (typeof item === "string") {
            return item.split(/\s+/);
        }

        if (typeof item === "object") {
            return [item.name, item.authority, item.role].filter(Boolean);
        }

        return [];
    });

    return roles.some((role) =>
        ["ADMIN", "ROLE_ADMIN"].includes(String(role).toUpperCase())
    );
}