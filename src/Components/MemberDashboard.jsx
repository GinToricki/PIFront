import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Pencil, Store, Trash2, Wallet, X } from "lucide-react";
import axiosInstance from "../Common/axiosInstance.jsx";

const rarityLabels = {
    1: "Common",
    2: "Uncommon",
    3: "Rare",
    4: "Epic",
    5: "Overnumbered",
    6: "Showcase",
    7: "Promo",
};

function getFirst(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }

    return null;
}

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function getRarityLabel(value) {
    if (value == null) {
        return "Unknown";
    }

    if (rarityLabels[value]) {
        return rarityLabels[value];
    }

    return String(value);
}

function normalizeBoughtListing(rawItem) {
    const listing = rawItem?.listing ?? rawItem?.Listing ?? {};

    const listingId = getFirst(listing.listingId, listing.ListingId, rawItem?.listingId, rawItem?.ListingId);
    const cardId = getFirst(listing.cardId, listing.CardId, rawItem?.cardId, rawItem?.CardId);

    return {
        listingId: listingId != null ? String(listingId) : "",
        cardId: cardId != null ? String(cardId) : "",
        condition: String(getFirst(listing.condition, listing.Condition, "Near Mint")),
        notes: String(getFirst(listing.notes, listing.Notes, "")),
        unitPrice: toNumber(getFirst(listing.price, listing.Price), 0),
        purchasedQuantity: Math.max(1, toNumber(getFirst(rawItem?.quantity, rawItem?.Quantity), 1)),
    };
}

function normalizeCard(rawCard) {
    return {
        name: String(getFirst(rawCard?.name, rawCard?.Name, "Unknown card")),
        imageUrl: String(getFirst(rawCard?.imageUrl, rawCard?.ImageUrl, "")),
        setLabel: String(getFirst(rawCard?.setLabel, rawCard?.SetLabel, rawCard?.setId, rawCard?.SetId, "Unknown set")),
    };
}

function normalizeCatalogCard(rawCard) {
    const id = String(getFirst(rawCard?.cardId, rawCard?.CardId, rawCard?.riftboundId, rawCard?.RiftboundId, ""));

    return {
        id,
        cardId: id,
        name: String(getFirst(rawCard?.name, rawCard?.Name, "Unknown card")),
        imageUrl: String(getFirst(rawCard?.imageUrl, rawCard?.ImageUrl, "")),
        displaySet: String(getFirst(rawCard?.setLabel, rawCard?.SetLabel, rawCard?.setId, rawCard?.SetId, "Unknown set")),
        rarityLabel: getRarityLabel(getFirst(rawCard?.rarity, rawCard?.Rarity)),
    };
}

function normalizeOwnedListing(rawListing) {
    const cardId = String(getFirst(rawListing?.cardId, rawListing?.CardId, rawListing?.riftboundId, rawListing?.RiftboundId, ""));
    const rawCard = rawListing?.card ?? rawListing?.Card ?? null;

    return {
        listingId: String(getFirst(rawListing?.listingId, rawListing?.ListingId, rawListing?.id, "")),
        ownerId: String(getFirst(rawListing?.userId, rawListing?.UserId, rawListing?.sellerId, rawListing?.SellerId, rawListing?.createdBy, "")),
        cardId,
        price: toNumber(getFirst(rawListing?.price, rawListing?.Price, rawListing?.unitPrice, rawListing?.UnitPrice), 0),
        quantity: Math.max(1, toNumber(getFirst(rawListing?.quantity, rawListing?.Quantity, rawListing?.availableQuantity, rawListing?.AvailableQuantity), 1)),
        condition: String(getFirst(rawListing?.condition, rawListing?.Condition, "Near Mint")),
        notes: String(getFirst(rawListing?.notes, rawListing?.Notes, "")),
        card: {
            id: cardId,
            cardId,
            name: String(getFirst(rawCard?.name, rawCard?.Name, rawListing?.cardName, rawListing?.CardName, "Unknown card")),
            imageUrl: String(getFirst(rawCard?.imageUrl, rawCard?.ImageUrl, "")),
            displaySet: String(getFirst(rawCard?.setLabel, rawCard?.SetLabel, rawListing?.setLabel, rawListing?.SetLabel, rawListing?.setId, rawListing?.SetId, "Unknown set")),
            rarityLabel: getRarityLabel(getFirst(rawCard?.rarity, rawCard?.Rarity, rawListing?.rarity, rawListing?.Rarity)),
        },
    };
}

function normalizeListingPayload(payload) {
    if (Array.isArray(payload)) {
        return payload.map(normalizeOwnedListing);
    }

    if (Array.isArray(payload?.items)) {
        return payload.items.map(normalizeOwnedListing);
    }

    if (Array.isArray(payload?.data)) {
        return payload.data.map(normalizeOwnedListing);
    }

    return [];
}

function MemberDashboard({ userId }) {
    const [activeTab, setActiveTab] = useState("purchase-history");
    const [fundAmount, setFundAmount] = useState("20");
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState("");
    const [myListings, setMyListings] = useState([]);
    const [isLoadingListings, setIsLoadingListings] = useState(false);
    const [myListingsError, setMyListingsError] = useState("");
    const [myListingsSuccess, setMyListingsSuccess] = useState("");
    const [editingListingId, setEditingListingId] = useState("");
    const [deletingListingId, setDeletingListingId] = useState("");
    const [editForm, setEditForm] = useState({
        price: "",
        quantity: "",
        condition: "Near Mint",
        notes: "",
    });

    const parsedFundAmount = useMemo(() => Number(fundAmount || 0), [fundAmount]);

    useEffect(() => {
        let isDisposed = false;

        if (!userId) {
            return;
        }

        setIsLoadingHistory(true);
        setHistoryError("");

        async function loadHistory() {
            try {
                const response = await axiosInstance.get("/Listing/GetBoughtListings", {
                    params: { userId },
                });

                const payload = response?.data;
                let entries = [];

                if (Array.isArray(payload)) {
                    entries = payload;
                } else if (Array.isArray(payload?.items)) {
                    entries = payload.items;
                } else if (Array.isArray(payload?.data)) {
                    entries = payload.data;
                }

                const normalizedEntries = entries.map(normalizeBoughtListing);
                const uniqueCardIds = [...new Set(normalizedEntries.map((item) => item.cardId).filter(Boolean))];

                const cardResponses = await Promise.all(
                    uniqueCardIds.map(async (cardId) => {
                        try {
                            const cardResponse = await axiosInstance.get("/Card/GetCardById", {
                                params: { cardId },
                            });

                            return [cardId, normalizeCard(cardResponse?.data)];
                        } catch {
                            return [cardId, normalizeCard(null)];
                        }
                    })
                );

                const cardsById = new Map(cardResponses);

                const mergedHistory = normalizedEntries.map((entry) => {
                    const card = cardsById.get(entry.cardId) ?? normalizeCard(null);
                    return {
                        ...entry,
                        cardName: card.name,
                        cardImageUrl: card.imageUrl,
                        cardSetLabel: card.setLabel,
                        lineTotal: entry.unitPrice * entry.purchasedQuantity,
                    };
                });

                if (isDisposed) {
                    return;
                }

                setPurchaseHistory(mergedHistory);
            } catch (error) {
                console.error(error);
                if (!isDisposed) {
                    setPurchaseHistory([]);
                    setHistoryError("Could not load purchase history.");
                }
            } finally {
                if (!isDisposed) {
                    setIsLoadingHistory(false);
                }
            }
        }

        loadHistory();

        return () => {
            isDisposed = true;
        };
    }, [userId]);

    const effectiveHistoryError = !userId ? "Missing user ID. Please log in again." : historyError;

    async function loadMyListings() {
        if (!userId) {
            setMyListings([]);
            setMyListingsError("Missing user ID. Please log in again.");
            return;
        }

        setIsLoadingListings(true);
        setMyListingsError("");
        setMyListingsSuccess("");

        try {
            let entries = [];

            try {
                let userListingsResponse;
                try {
                    userListingsResponse = await axiosInstance.get("/Listing/GetUserListing", {
                        params: { userId },
                    });
                } catch {
                    userListingsResponse = await axiosInstance.get("/Listing/GetUserListings", {
                        params: { userId },
                    });
                }
                entries = normalizeListingPayload(userListingsResponse?.data);
            } catch {
                const allListingsResponse = await axiosInstance.get("/Listing/GetAllListings");
                const allListings = normalizeListingPayload(allListingsResponse?.data);
                entries = allListings.filter((item) => String(item.ownerId) === String(userId));
            }

            let catalogCardsRaw = [];

            try {
                const cardsResponse = await axiosInstance.get("/Card/GetAllCards");
                if (Array.isArray(cardsResponse?.data)) {
                    catalogCardsRaw = cardsResponse.data;
                }
            } catch {
                catalogCardsRaw = [];
            }

            const cardsById = new Map();
            catalogCardsRaw.map(normalizeCatalogCard).forEach((card) => {
                if (!card.id) {
                    return;
                }

                cardsById.set(String(card.id), card);
                cardsById.set(String(card.cardId), card);
            });

            const mergedListings = entries
                .filter((item) => item.listingId)
                .map((listing) => {
                    const catalogCard = cardsById.get(String(listing.cardId));
                    return {
                        ...listing,
                        card: catalogCard ?? listing.card,
                    };
                });

            setMyListings(mergedListings);
        } catch {
            setMyListings([]);
            setMyListingsError("Could not load your listings.");
        } finally {
            setIsLoadingListings(false);
        }
    }

    function startEditingListing(listing) {
        setEditingListingId(listing.listingId);
        setEditForm({
            price: String(listing.price ?? ""),
            quantity: String(listing.quantity ?? 1),
            condition: listing.condition || "Near Mint",
            notes: listing.notes || "",
        });
        setMyListingsError("");
        setMyListingsSuccess("");
    }

    function cancelEditingListing() {
        setEditingListingId("");
        setEditForm({
            price: "",
            quantity: "",
            condition: "Near Mint",
            notes: "",
        });
    }

    async function saveListingUpdate(listingId) {
        if (!listingId) {
            return;
        }

        setMyListingsError("");
        setMyListingsSuccess("");

        const payload = {
            listingId,
            ListingId: listingId,
            price: Number(editForm.price || 0),
            quantity: Math.max(1, Number(editForm.quantity || 1)),
            condition: editForm.condition,
            notes: editForm.notes,
        };

        try {
            try {
                await axiosInstance.put("/Listing/UpdateListing", payload);
            } catch {
                await axiosInstance.post("/Listing/UpdateListing", payload);
            }

            setMyListings((prev) =>
                prev.map((listing) =>
                    listing.listingId === listingId
                        ? {
                              ...listing,
                              price: payload.price,
                              quantity: payload.quantity,
                              condition: payload.condition,
                              notes: payload.notes,
                          }
                        : listing
                )
            );
            setMyListingsSuccess(`Listing #${listingId} updated.`);
            cancelEditingListing();
        } catch {
            setMyListingsError("Could not update listing.");
        }
    }

    async function deleteMyListing(listingId) {
        if (!listingId) {
            return;
        }

        setDeletingListingId(listingId);
        setMyListingsError("");
        setMyListingsSuccess("");

        try {
            try {
                await axiosInstance.delete("/Listing/DeleteListing", {
                    params: {
                        listingId,
                        ListingId: listingId,
                    },
                });
            } catch {
                await axiosInstance.post("/Listing/DeleteListing", {
                    listingId,
                    ListingId: listingId,
                });
            }

            setMyListings((prev) => prev.filter((listing) => listing.listingId !== listingId));
            setMyListingsSuccess(`Listing #${listingId} deleted.`);
            if (editingListingId === listingId) {
                cancelEditingListing();
            }
        } catch {
            setMyListingsError("Could not delete listing.");
        } finally {
            setDeletingListingId("");
        }
    }

    return (
        <section className="member-dashboard">
            <aside className="member-dashboard-nav" aria-label="Member dashboard sections">
                <p className="dashboard-kicker">Dashboard</p>
                <h1>Member</h1>
                <p className="dashboard-meta">User ID: {userId ?? "Unavailable"}</p>

                <button
                    type="button"
                    className={`member-nav-tab ${activeTab === "purchase-history" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("purchase-history")}
                >
                    <Clock3 size={16} />
                    Purchase History
                </button>

                <button
                    type="button"
                    className={`member-nav-tab ${activeTab === "my-listings" ? "is-active" : ""}`}
                    onClick={() => {
                        setActiveTab("my-listings");
                        loadMyListings();
                    }}
                >
                    <Store size={16} />
                    My Listings
                </button>

                <button
                    type="button"
                    className={`member-nav-tab ${activeTab === "add-funds" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("add-funds")}
                >
                    <Wallet size={16} />
                    Add funds
                </button>
            </aside>

            <div className="member-dashboard-content">
                {activeTab === "purchase-history" && (
                    <div>
                        <h2>Purchase History</h2>
                        <p>Orders loaded from your account purchases.</p>

                        {isLoadingHistory && <p>Loading purchase history...</p>}
                        {!isLoadingHistory && effectiveHistoryError && <p>{effectiveHistoryError}</p>}

                        {!isLoadingHistory && !effectiveHistoryError && purchaseHistory.length === 0 && (
                            <p>No purchases found yet.</p>
                        )}

                        {!isLoadingHistory && !effectiveHistoryError && purchaseHistory.length > 0 && (
                            <div className="member-purchase-list">
                                {purchaseHistory.map((purchase, index) => (
                                    <article
                                        key={purchase.listingId || `purchase-${index}`}
                                        className="member-purchase-item"
                                    >
                                        <div className="member-purchase-media">
                                            {purchase.cardImageUrl ? (
                                                <img src={purchase.cardImageUrl} alt={purchase.cardName} />
                                            ) : (
                                                <div className="member-purchase-placeholder">No image</div>
                                            )}
                                        </div>
                                        <div className="member-purchase-main">
                                            <strong>{purchase.cardName}</strong>
                                            <p>{purchase.cardSetLabel}</p>
                                            <p>Listing #{purchase.listingId || "Unknown"}</p>
                                            <p>Condition: {purchase.condition}</p>
                                            {purchase.notes && <p>Notes: {purchase.notes}</p>}
                                        </div>
                                        <div className="member-purchase-totals">
                                            <strong>${purchase.lineTotal.toFixed(2)}</strong>
                                            <p>
                                                Qty {purchase.purchasedQuantity} x ${purchase.unitPrice.toFixed(2)}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "my-listings" && (
                    <div>
                        <h2>My Listings</h2>
                        <p>Update or remove the listings you created.</p>

                        {isLoadingListings && <p>Loading your listings...</p>}
                        {!isLoadingListings && myListingsError && <p>{myListingsError}</p>}
                        {!isLoadingListings && myListingsSuccess && <p className="admin-form-success">{myListingsSuccess}</p>}

                        {!isLoadingListings && !myListingsError && myListings.length === 0 && <p>You have no active listings.</p>}

                        {!isLoadingListings && !myListingsError && myListings.length > 0 && (
                            <div className="dashboard-listings-grid">
                                {myListings.map((listing) => (
                                    <article key={listing.listingId} className="dashboard-listing-item">
                                        <div className="dashboard-listing-card-head">
                                            <div className="dashboard-listing-media">
                                                {listing.card?.imageUrl ? (
                                                    <img src={listing.card.imageUrl} alt={listing.card.name} />
                                                ) : (
                                                    <div className="member-purchase-placeholder">No image</div>
                                                )}
                                            </div>
                                            <div className="dashboard-listing-main">
                                                <div className="dashboard-listing-topline">
                                                    <span className="dashboard-rarity-pill">
                                                        {listing.card?.rarityLabel || "Unknown"}
                                                    </span>
                                                    <span>{listing.condition}</span>
                                                </div>
                                                <strong>{listing.card?.name || "Unknown card"}</strong>
                                                <p>{listing.card?.displaySet || "Unknown set"}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p>Listing #{listing.listingId}</p>
                                            <p>Card ID: {listing.cardId || "Unknown"}</p>
                                            <p>
                                                ${listing.price.toFixed(2)} | Qty {listing.quantity} | {listing.condition}
                                            </p>
                                            {listing.notes && <p>Notes: {listing.notes}</p>}
                                        </div>

                                        <div className="dashboard-listing-actions">
                                            <button
                                                type="button"
                                                className="dashboard-secondary-button"
                                                onClick={() => startEditingListing(listing)}
                                            >
                                                <Pencil size={15} />
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="dashboard-danger-button"
                                                onClick={() => deleteMyListing(listing.listingId)}
                                                disabled={deletingListingId === listing.listingId}
                                            >
                                                <Trash2 size={15} />
                                                {deletingListingId === listing.listingId ? "Deleting..." : "Delete"}
                                            </button>
                                        </div>

                                        {editingListingId === listing.listingId && (
                                            <form
                                                className="dashboard-listing-edit-form"
                                                onSubmit={(event) => {
                                                    event.preventDefault();
                                                    saveListingUpdate(listing.listingId);
                                                }}
                                            >
                                                <label>
                                                    Price (USD)
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={editForm.price}
                                                        onChange={(event) =>
                                                            setEditForm((prev) => ({ ...prev, price: event.target.value }))
                                                        }
                                                        required
                                                    />
                                                </label>

                                                <label>
                                                    Quantity
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={editForm.quantity}
                                                        onChange={(event) =>
                                                            setEditForm((prev) => ({ ...prev, quantity: event.target.value }))
                                                        }
                                                        required
                                                    />
                                                </label>

                                                <label>
                                                    Condition
                                                    <select
                                                        value={editForm.condition}
                                                        onChange={(event) =>
                                                            setEditForm((prev) => ({ ...prev, condition: event.target.value }))
                                                        }
                                                    >
                                                        <option value="Near Mint">Near Mint</option>
                                                        <option value="Lightly Played">Lightly Played</option>
                                                        <option value="Moderately Played">Moderately Played</option>
                                                        <option value="Heavily Played">Heavily Played</option>
                                                    </select>
                                                </label>

                                                <label className="dashboard-listing-edit-notes">
                                                    Notes
                                                    <textarea
                                                        rows={2}
                                                        value={editForm.notes}
                                                        onChange={(event) =>
                                                            setEditForm((prev) => ({ ...prev, notes: event.target.value }))
                                                        }
                                                    />
                                                </label>

                                                <div className="dashboard-listing-edit-actions">
                                                    <button type="submit" className="dashboard-secondary-button">
                                                        <Check size={15} />
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="dashboard-secondary-button"
                                                        onClick={cancelEditingListing}
                                                    >
                                                        <X size={15} />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "add-funds" && (
                    <div>
                        <h2>Add funds</h2>
                        <p>Top up your marketplace balance.</p>
                        <form className="member-funds-form" onSubmit={(e) => e.preventDefault()}>
                            <label htmlFor="fundAmountInput">Amount (USD)</label>
                            <input
                                id="fundAmountInput"
                                type="number"
                                min="1"
                                step="0.01"
                                value={fundAmount}
                                onChange={(e) => setFundAmount(e.target.value)}
                            />
                            <button type="submit" disabled={parsedFundAmount <= 0}>
                                Add funds
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </section>
    );
}

export default MemberDashboard;
