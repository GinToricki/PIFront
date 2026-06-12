import { create} from "zustand";

const useAuthStore = create((set) => ({
    token: null,
    role: null,
    user: null,

    setAuth: (token, role, user) => set({token, role, user}),
    logout: () => set({token: null, role: null, user: null}),
}))

export default useAuthStore;