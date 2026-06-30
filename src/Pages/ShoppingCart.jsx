import Navbar from "../Components/Navbar.jsx";
import useCartStore from "../store/cartStore.js";
import {CircleDollarSign, Trash2} from "lucide-react";
import "../styles/shoppingCart.css";

function ShoppingCart() {
    const items = useCartStore((state) => state.items);
    const removeItem = useCartStore((state) => state.removeItem);
    const clearCart = useCartStore((state) => state.clearCart);
    const updateQuantity = useCartStore((state) => state.updateQuantity);

    const totalItems = items.reduce((total, item) => total + Number(item.quantity || 0), 0);
    const subtotal = items.reduce(
        (total, item) => total + Number(item.unitPrice || 0) * Number(item.quantity || 1),
        0
    );
    const canPurchase = items.length > 0;

    function purchaseItems() {
        if (!canPurchase) {
            return;
        }

        clearCart();
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
                                    Purchase
                                </button>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}

export default ShoppingCart;
