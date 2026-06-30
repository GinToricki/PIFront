import {useMemo, useState} from "react";
import Navbar from "../Components/Navbar.jsx";
import useCartStore from "../store/cartStore.js";
import {CircleDollarSign, Trash2} from "lucide-react";
import "../styles/shoppingCart.css";
import useAuthStore from "../store/authStore.js";
import axiosInstance from "../Common/axiosInstance.jsx";

function decodeJwt(token) {
    if (!token || typeof token !== "string") {
        return null;
    }

    try {
        const tokenParts = token.split(".");
        if (tokenParts.length < 2) {
            return null;
        }

        const payload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
        const decoded = atob(payload);

        return JSON.parse(decoded);
    } catch (_error) {
        return null;
    }
}

function resolveUserId(user, tokenValue) {
    if (user?.userId != null) {
        return user.userId;
    }

    if (user?.id != null) {
        return user.id;
    }

    const tokenPayload = decodeJwt(tokenValue);
    if (!tokenPayload) {
        return null;
    }

    return (
        tokenPayload.userId ??
        tokenPayload.userid ??
        tokenPayload.nameid ??
        tokenPayload.sub ??
        tokenPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
        null
    );
}

function ShoppingCart() {
    const items = useCartStore((state) => state.items);
    const removeItem = useCartStore((state) => state.removeItem);
    const clearCart = useCartStore((state) => state.clearCart);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const authToken = useAuthStore((state) => state.token);
    const authUser = useAuthStore((state) => state.user);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseError, setPurchaseError] = useState("");

    const totalItems = items.reduce((total, item) => total + Number(item.quantity || 0), 0);
    const subtotal = items.reduce(
        (total, item) => total + Number(item.unitPrice || 0) * Number(item.quantity || 1),
        0
    );
    const rawToken = typeof authToken === "string" ? authToken : authToken?.token;
    const userId = useMemo(() => resolveUserId(authUser, rawToken), [authUser, rawToken]);
    const canPurchase = items.length > 0 && !!userId && !isPurchasing;

    async function purchaseItems() {
        if (!canPurchase) {
            if (!userId) {
                setPurchaseError("You must be logged in before purchasing.");
            }
            return;
        }

        setPurchaseError("");
        setIsPurchasing(true);

        try {
            await Promise.all(
                items.map((item) =>
                    axiosInstance.post("/Listing/BuyListing", {
                        userId,
                        ListingId: item.listingId,
                        Quantity: Number(item.quantity || 1),
                    })
                )
            );

            clearCart();
        } catch (error) {
            console.error(error);
            setPurchaseError("Purchase failed. Please try again.");
        } finally {
            setIsPurchasing(false);
        }
    }

    return (
        <>
            <Navbar active={"cart"} />
            <div className="shopping-cart-page">
                <div className="shopping-cart-shell container-fluid">
                    <div className="shopping-cart-header">
                        <div>
                            <p className="shopping-cart-kicker">Shopping Cart</p>
                            <h1>Review your selected listings</h1>
                        </div>
                        <div className="shopping-cart-summary">
                            <div>
                                <span>Items</span>
                                <strong>{totalItems}</strong>
                            </div>
                            <div>
                                <span>Subtotal</span>
                                <strong>${subtotal.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>

                    {items.length === 0 && (
                        <div className="shopping-cart-empty">
                            <h3>Your cart is empty</h3>
                            <p>Add a listing from Marketplace to see it here.</p>
                        </div>
                    )}

                    {items.length > 0 && (
                        <section className="shopping-cart-results">
                            <div className="shopping-cart-actions">
                                <button type="button" className="secondary-button" onClick={clearCart}>
                                    Clear cart
                                </button>
                            </div>

                            <div className="shopping-cart-list">
                                {items.map((item) => (
                                    <article className="shopping-cart-item" key={item.listingId}>
                                        <div className="shopping-cart-item-art">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} />
                                            ) : (
                                                <div className="card-art-placeholder">
                                                    <span>No image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="shopping-cart-item-body">
                                            <h3>{item.name}</h3>
                                            <p>{item.setLabel}</p>
                                            <span className="rarity-pill">{item.rarity}</span>
                                            <p className="shopping-cart-condition">{item.condition}</p>
                                        </div>

                                        <div className="shopping-cart-item-controls">
                                            <label>
                                                Qty
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={Math.max(1, Number(item.availableQuantity) || 1)}
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateQuantity(item.listingId, e.target.value)
                                                    }
                                                />
                                            </label>
                                            <small>{Math.max(1, Number(item.availableQuantity) || 1)} available</small>
                                            <p>
                                                <CircleDollarSign size={16} />
                                                {(Number(item.unitPrice || 0) * Number(item.quantity || 1)).toFixed(2)}
                                            </p>
                                            <button
                                                type="button"
                                                className="icon-button"
                                                aria-label="Remove item"
                                                onClick={() => removeItem(item.listingId)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            <div className="shopping-cart-checkout">
                                <button
                                    type="button"
                                    className="purchase-button"
                                    onClick={purchaseItems}
                                    disabled={!canPurchase}
                                >
                                    {isPurchasing ? "Purchasing..." : "Purchase"}
                                </button>
                            </div>
                            {purchaseError && <p className="purchase-error">{purchaseError}</p>}
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}

export default ShoppingCart;
