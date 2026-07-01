import { useEffect, useMemo, useState } from "react";
import { CalendarClock, LayoutDashboard, Store, Trash2, Trophy } from "lucide-react";
import useTournamentStore from "../store/tournamentStore.js";
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

function normalizeListing(rawListing) {
    const cardId = String(getFirst(rawListing?.cardId, rawListing?.CardId, rawListing?.riftboundId, rawListing?.RiftboundId, ""));
    const rawCard = rawListing?.card ?? rawListing?.Card ?? null;

    return {
        listingId: String(getFirst(rawListing?.listingId, rawListing?.ListingId, rawListing?.id, "")),
        cardId,
        sellerId: String(getFirst(rawListing?.userId, rawListing?.UserId, rawListing?.sellerId, rawListing?.SellerId, rawListing?.createdBy, "")),
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
        return payload.map(normalizeListing);
    }

    if (Array.isArray(payload?.items)) {
        return payload.items.map(normalizeListing);
    }

    if (Array.isArray(payload?.data)) {
        return payload.data.map(normalizeListing);
    }

    return [];
}

function AdminDashboard({ userId }) {
    const tournaments = useTournamentStore((state) => state.tournaments);
    const addTournament = useTournamentStore((state) => state.addTournament);
    const fetchTournaments = useTournamentStore((state) => state.fetchTournaments);
    const loading = useTournamentStore((state) => state.loading);
    const error = useTournamentStore((state) => state.error);
    const [createSuccess, setCreateSuccess] = useState("");
    const [activeTab, setActiveTab] = useState("tournaments");
    const [listings, setListings] = useState([]);
    const [isLoadingListings, setIsLoadingListings] = useState(false);
    const [listingsError, setListingsError] = useState("");
    const [listingActionMessage, setListingActionMessage] = useState("");
    const [deletingListingId, setDeletingListingId] = useState("");
    const [form, setForm] = useState({
        game: "Riftbound",
        format: "Standard",
        startDate: "",
        checkInTime: "",
        location: "",
        maxPlayers: "32",
        entryFee: "15",
        prizePool: "500",
        notes: "",
    });

    useEffect(() => {
        fetchTournaments();
    }, [fetchTournaments]);

    async function loadListings() {
        setIsLoadingListings(true);
        setListingsError("");
        setListingActionMessage("");

        try {
            const [listingsResult, cardsResult] = await Promise.allSettled([
                axiosInstance.get("/Listing/GetAllListings"),
                axiosInstance.get("/Card/GetAllCards"),
            ]);

            const normalizedListings =
                listingsResult.status === "fulfilled"
                    ? normalizeListingPayload(listingsResult.value?.data).filter((item) => item.listingId)
                    : [];

            const catalogCardsRaw =
                cardsResult.status === "fulfilled" && Array.isArray(cardsResult.value?.data)
                    ? cardsResult.value.data
                    : [];

            const cardsById = new Map();

            catalogCardsRaw.map(normalizeCatalogCard).forEach((card) => {
                if (!card.id) {
                    return;
                }

                cardsById.set(String(card.id), card);
                cardsById.set(String(card.cardId), card);
            });

            const mergedListings = normalizedListings.map((listing) => {
                const catalogCard = cardsById.get(String(listing.cardId));
                return {
                    ...listing,
                    card: catalogCard ?? listing.card,
                };
            });

            setListings(mergedListings);
        } catch {
            setListings([]);
            setListingsError("Could not load listings.");
        } finally {
            setIsLoadingListings(false);
        }
    }

    const upcomingCount = useMemo(
        () => tournaments.filter((item) => item.status !== "Completed").length,
        [tournaments]
    );

    function updateField(name, value) {
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (createSuccess) {
            setCreateSuccess("");
        }
    }

    async function createTournament(event) {
        event.preventDefault();

        try {
            await addTournament({
                ...form,
                maxPlayers: Number(form.maxPlayers || 0),
                entryFee: Number(form.entryFee || 0),
                prizePool: Number(form.prizePool || 0),
                createdBy: userId,
            });

            setForm({
                game: form.game,
                format: form.format,
                startDate: "",
                checkInTime: "",
                location: "",
                maxPlayers: form.maxPlayers,
                entryFee: form.entryFee,
                prizePool: form.prizePool,
                notes: "",
            });
            setCreateSuccess("Tournament created. It is now live on the Tournaments page.");
        } catch {
            setCreateSuccess("");
        }
    }

    async function deleteListing(listingId) {
        if (!listingId) {
            return;
        }

        setDeletingListingId(listingId);
        setListingsError("");
        setListingActionMessage("");

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

            setListings((prev) => prev.filter((item) => item.listingId !== listingId));
            setListingActionMessage(`Listing #${listingId} deleted.`);
        } catch {
            setListingsError("Could not delete listing.");
        } finally {
            setDeletingListingId("");
        }
    }

    return (
        <section className="admin-dashboard">
            <aside className="admin-dashboard-nav">
                <div className="admin-dashboard-nav-head">
                    <p className="dashboard-kicker">Dashboard</p>
                    <h1>Admin Panel</h1>
                    <p>You have administrative access.</p>
                    <p className="dashboard-meta">Admin ID: {userId ?? "Unavailable"}</p>
                </div>

                <nav className="admin-dashboard-nav-list" aria-label="Admin sections">
                    <button
                        type="button"
                        className={`admin-nav-tab ${activeTab === "tournaments" ? "is-active" : ""}`}
                        onClick={() => setActiveTab("tournaments")}
                    >
                        <LayoutDashboard size={16} />
                        Tournaments
                    </button>
                    <button
                        type="button"
                        className={`admin-nav-tab ${activeTab === "listings" ? "is-active" : ""}`}
                        onClick={() => {
                            setActiveTab("listings");
                            loadListings();
                        }}
                    >
                        <Store size={16} />
                        Listings
                    </button>
                </nav>
            </aside>

            <div className="admin-dashboard-content">
                {activeTab === "tournaments" && (
                    <>
                        <div className="admin-dashboard-stats">
                            <article>
                                <span>
                                    <Trophy size={16} />
                                    Tournaments
                                </span>
                                <strong>{tournaments.length}</strong>
                            </article>
                            <article>
                                <span>
                                    <CalendarClock size={16} />
                                    Upcoming
                                </span>
                                <strong>{upcomingCount}</strong>
                            </article>
                        </div>

                        <div className="admin-create-wrap">
                            <h2>Create tournament</h2>
                            <p>Publish a new event to the public tournament page.</p>
                            <form className="admin-tournament-form" onSubmit={createTournament}>
                                <label>
                                    Game
                                    <input
                                        type="text"
                                        value={form.game}
                                        onChange={(event) => updateField("game", event.target.value)}
                                        placeholder="Riftbound"
                                        required
                                    />
                                </label>

                                <label>
                                    Format
                                    <select
                                        value={form.format}
                                        onChange={(event) => updateField("format", event.target.value)}
                                    >
                                        <option value="Standard">Standard</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Sealed">Sealed</option>
                                        <option value="Commander">Commander</option>
                                    </select>
                                </label>

                                <label>
                                    Start date and time
                                    <input
                                        type="datetime-local"
                                        value={form.startDate}
                                        onChange={(event) => updateField("startDate", event.target.value)}
                                        required
                                    />
                                </label>

                                <label>
                                    Check-in time
                                    <input
                                        type="time"
                                        value={form.checkInTime}
                                        onChange={(event) => updateField("checkInTime", event.target.value)}
                                    />
                                </label>

                                <label>
                                    Location
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={(event) => updateField("location", event.target.value)}
                                        placeholder="Main Hall, Zagreb"
                                        required
                                    />
                                </label>

                                <label>
                                    Max players
                                    <input
                                        type="number"
                                        min="2"
                                        value={form.maxPlayers}
                                        onChange={(event) => updateField("maxPlayers", event.target.value)}
                                        required
                                    />
                                </label>

                                <label>
                                    Entry fee (USD)
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.entryFee}
                                        onChange={(event) => updateField("entryFee", event.target.value)}
                                        required
                                    />
                                </label>

                                <label>
                                    Prize pool (USD)
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.prizePool}
                                        onChange={(event) => updateField("prizePool", event.target.value)}
                                        required
                                    />
                                </label>

                                <label className="admin-form-span">
                                    Notes
                                    <textarea
                                        value={form.notes}
                                        onChange={(event) => updateField("notes", event.target.value)}
                                        placeholder="Optional tournament details"
                                        rows={3}
                                    />
                                </label>

                                <div className="admin-form-span admin-form-actions">
                                    <button type="submit">Create tournament</button>
                                </div>
                            </form>
                            {loading && <p className="admin-form-success">Syncing tournaments...</p>}
                            {error && <p className="admin-form-error">{error}</p>}
                            {createSuccess && <p className="admin-form-success">{createSuccess}</p>}
                        </div>
                    </>
                )}

                {activeTab === "listings" && (
                    <div className="admin-create-wrap">
                        <h2>Existing listings</h2>
                        <p>Review and remove current marketplace listings.</p>

                        {isLoadingListings && <p>Loading listings...</p>}
                        {!isLoadingListings && listingsError && <p className="admin-form-error">{listingsError}</p>}
                        {!isLoadingListings && listingActionMessage && (
                            <p className="admin-form-success">{listingActionMessage}</p>
                        )}

                        {!isLoadingListings && !listingsError && listings.length === 0 && (
                            <p>No listings found.</p>
                        )}

                        {!isLoadingListings && !listingsError && listings.length > 0 && (
                            <div className="dashboard-listings-grid">
                                {listings.map((listing) => (
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
                                            <p>Seller: {listing.sellerId || "Unknown"}</p>
                                            <p>
                                                ${listing.price.toFixed(2)} | Qty {listing.quantity} | {listing.condition}
                                            </p>
                                            {listing.notes && <p>Notes: {listing.notes}</p>}
                                        </div>
                                        <button
                                            type="button"
                                            className="dashboard-danger-button"
                                            onClick={() => deleteListing(listing.listingId)}
                                            disabled={deletingListingId === listing.listingId}
                                        >
                                            <Trash2 size={15} />
                                            {deletingListingId === listing.listingId ? "Deleting..." : "Delete"}
                                        </button>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

export default AdminDashboard;
