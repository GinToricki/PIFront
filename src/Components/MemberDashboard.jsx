import { useEffect, useMemo, useState } from "react";
import { Clock3, Wallet } from "lucide-react";
import axiosInstance from "../Common/axiosInstance.jsx";

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

function MemberDashboard({ userId }) {
    const [activeTab, setActiveTab] = useState("purchase-history");
    const [fundAmount, setFundAmount] = useState("20");
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState("");

    const parsedFundAmount = useMemo(() => Number(fundAmount || 0), [fundAmount]);

    useEffect(() => {
        let isDisposed = false;

        if (!userId) {
            setPurchaseHistory([]);
            setHistoryError("Missing user ID. Please log in again.");
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
                        } catch (_error) {
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
                        {!isLoadingHistory && historyError && <p>{historyError}</p>}

                        {!isLoadingHistory && !historyError && purchaseHistory.length === 0 && (
                            <p>No purchases found yet.</p>
                        )}

                        {!isLoadingHistory && !historyError && purchaseHistory.length > 0 && (
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
