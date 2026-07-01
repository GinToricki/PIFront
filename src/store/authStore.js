import { create } from "zustand";
import { persist } from "zustand/middleware";

function normalizeRoles(rawRoles) {
    if (Array.isArray(rawRoles)) {
        return rawRoles.filter(Boolean);
    }

    if (rawRoles) {
        return [rawRoles];
    }

    return [];
}

const useAuthStore = create(
    persist(
        (set) => ({
            token: null,
            userId: null,
            role: null,
            roles: [],
            user: null,

            setAuth: ({ token, userId, roles, user }) => {
                const normalizedRoles = normalizeRoles(roles);
                const resolvedUserId =
                    userId ?? user?.userId ?? user?.id ?? null;

                set({
                    token: token ?? null,
                    userId: resolvedUserId,
                    roles: normalizedRoles,
                    role: normalizedRoles[0] ?? null,
                    user: user ?? (resolvedUserId != null ? { userId: resolvedUserId } : null),
                });
            },
            logout: () =>
                set({
                    token: null,
                    userId: null,
                    role: null,
                    roles: [],
                    user: null,
                }),
        }),
        {
            name: "auth-store",
        }
    )
);

export default useAuthStore;
