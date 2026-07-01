import { create } from "zustand";
import { persist } from "zustand/middleware";
import useCartStore from "./cartStore";

function normalizeRoles(rawRoles) {
    if (Array.isArray(rawRoles)) {
        return rawRoles.filter(Boolean);
    }

    if (rawRoles) {
        return [rawRoles];
    }

    return [];
}

function toNonNegativeNumber(value, fallback = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.max(0, parsed);
}

function resolveFunds(user, fallbackValue = 0) {
    const directFunds = toNonNegativeNumber(
        user?.funds ?? user?.balance ?? user?.wallet ?? user?.walletBalance,
        Number.NaN
    );

    if (Number.isFinite(directFunds)) {
        return directFunds;
    }

    return toNonNegativeNumber(fallbackValue, 0);
}

const useAuthStore = create(
    persist(
        (set) => ({
            token: null,
            userId: null,
            role: null,
            roles: [],
            user: null,
            funds: 0,

            setAuth: ({ token, userId, roles, user, funds }) => {
                const normalizedRoles = normalizeRoles(roles);
                const resolvedUserId =
                    userId ?? user?.userId ?? user?.id ?? null;
                const resolvedFunds = resolveFunds(user, funds);
                const resolvedUser =
                    user ??
                    (resolvedUserId != null ? { userId: resolvedUserId } : null);

                set({
                    token: token ?? null,
                    userId: resolvedUserId,
                    roles: normalizedRoles,
                    role: normalizedRoles[0] ?? null,
                    user: resolvedUser
                        ? {
                              ...resolvedUser,
                              funds: resolvedFunds,
                          }
                        : null,
                    funds: resolvedFunds,
                });
            },
            setFunds: (amount) =>
                set((state) => {
                    const nextFunds = toNonNegativeNumber(amount, state.funds);
                    return {
                        funds: nextFunds,
                        user: state.user
                            ? {
                                  ...state.user,
                                  funds: nextFunds,
                              }
                            : state.user,
                    };
                }),
            addFunds: (amount) =>
                set((state) => {
                    const increment = toNonNegativeNumber(amount, 0);
                    const nextFunds = Number((state.funds + increment).toFixed(2));
                    return {
                        funds: nextFunds,
                        user: state.user
                            ? {
                                  ...state.user,
                                  funds: nextFunds,
                              }
                            : state.user,
                    };
                }),
            deductFunds: (amount) =>
                set((state) => {
                    const decrement = toNonNegativeNumber(amount, 0);
                    const nextFunds = Number(Math.max(0, state.funds - decrement).toFixed(2));
                    return {
                        funds: nextFunds,
                        user: state.user
                            ? {
                                  ...state.user,
                                  funds: nextFunds,
                              }
                            : state.user,
                    };
                }),
            logout: () => {
                useCartStore.getState().clearCart();
                set({
                    token: null,
                    userId: null,
                    role: null,
                    roles: [],
                    user: null,
                    funds: 0,
                });
            },
        }),
        {
            name: "auth-store",
        }
    )
);

export default useAuthStore;
