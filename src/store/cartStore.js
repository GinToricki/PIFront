import {create} from "zustand";
import {persist} from "zustand/middleware";

const useCartStore = create(
    persist(
        (set) => ({
            items: [],

            addItem: (item) =>
                set((state) => {
                    const maxAvailable = Math.max(1, Number(item.availableQuantity) || 1);
                    const existingIndex = state.items.findIndex(
                        (entry) => entry.listingId === item.listingId
                    );

                    if (existingIndex === -1) {
                        return {
                            items: [
                                ...state.items,
                                {...item, availableQuantity: maxAvailable, quantity: 1},
                            ],
                        };
                    }

                    const existingItem = state.items[existingIndex];
                    const nextQuantity = Math.min(
                        existingItem.quantity + 1,
                        Number(existingItem.availableQuantity || maxAvailable)
                    );

                    return {
                        items: state.items.map((entry, index) =>
                            index === existingIndex
                                ? {
                                    ...entry,
                                    ...item,
                                    availableQuantity: maxAvailable,
                                    quantity: nextQuantity,
                                }
                                : entry
                        ),
                    };
                }),

            removeItem: (listingId) =>
                set((state) => ({
                    items: state.items.filter((item) => item.listingId !== listingId),
                })),

            updateQuantity: (listingId, quantity) =>
                set((state) => ({
                    items: state.items.map((item) => {
                        if (item.listingId !== listingId) {
                            return item;
                        }

                        const maxAvailable = Math.max(1, Number(item.availableQuantity) || 1);
                        const nextQuantity = Math.min(
                            maxAvailable,
                            Math.max(1, Number(quantity) || 1)
                        );

                        return {...item, quantity: nextQuantity};
                    }),
                })),

            clearCart: () => set({items: []}),
        }),
        {
            name: "tcg-marketplace-cart",
        }
    )
);

export default useCartStore;
