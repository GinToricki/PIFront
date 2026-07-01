import {useCallback, useEffect, useMemo, useState} from "react";
import {CircleDollarSign, Plus, Search, Sparkles, X} from "lucide-react";
import Navbar from "../Components/Navbar.jsx";
import "../styles/marketplace.css";
import axiosInstance from "../Common/axiosInstance.jsx";
import useCartStore from "../store/cartStore.js";
import useAuthStore from "../store/authStore.js";

const rarityLabels = {
    1: "Common",
    2: "Uncommon",
    3: "Rare",
    4: "Epic",
    5: "Overnumbered",
    6: "Showcase",
    7: "Promo",
};

function getRarityLabel(value) {
    if (value == null) {
        return "Unknown";
    }

    if (rarityLabels[value]) {
        return rarityLabels[value];
    }

    return String(value);
}

function Marketplace() {
    const addToCart = useCartStore((state) => state.addItem);
    const userId = useAuthStore((state) => state.userId);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCardId, setSelectedCardId] = useState("");
    const [newListing, setNewListing] = useState({
        price: "",
        quantity: 1,
        condition: "Near Mint",
        notes: "",
    });
    const [rawListings, setRawListings] = useState([]);
    const [cards, setCards] = useState([]);

    useEffect(() => {
        axiosInstance
            .get("/Card/GetAllCards")
            .then((response) => {
                if (response) {
                    setCards(response.data || []);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    const loadListings = useCallback(() => {
        axiosInstance
            .get("/Listing/GetAllListings")
            .then((response) => {
                const payload = response?.data;

                if (Array.isArray(payload)) {
                    setRawListings(payload);
                    return;
                }

                if (Array.isArray(payload?.items)) {
                    setRawListings(payload.items);
                    return;
                }

                if (Array.isArray(payload?.data)) {
                    setRawListings(payload.data);
                    return;
                }

                setRawListings([]);
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    const cardCatalog = useMemo(() => {
        return cards
            .map((card) => {
                const id = String(card.cardId ?? card.riftboundId ?? "");

                return {
                    ...card,
                    id,
                    displaySet: card.setLabel || card.setId || "Unknown set",
                    rarityLabel: getRarityLabel(card.rarity),
                };
            })
            .filter((card) => card.id);
    }, [cards]);

    const selectedCard = useMemo(
        () => cardCatalog.find((card) => card.id === selectedCardId),
        [cardCatalog, selectedCardId]
    );

    const cardsById = useMemo(() => {
        const map = new Map();

        cardCatalog.forEach((card) => {
            if (card.id) {
                map.set(String(card.id), card);
            }
            if (card.cardId) {
                map.set(String(card.cardId), card);
            }
            if (card.riftboundId) {
                map.set(String(card.riftboundId), card);
            }
        });

        return map;
    }, [cardCatalog]);

    const listings = useMemo(() => {
        return rawListings
            .map((listing) => {
                const listingId = String(listing.listingId ?? listing.id ?? "");
                const cardId = String(
                    listing.cardId ??
                        listing.riftboundId ??
                        listing.card?.cardId ??
                        listing.card?.riftboundId ??
                        ""
                );

                const listingCard = listing.card
                    ? {
                        ...listing.card,
                        id: String(listing.card.cardId ?? listing.card.riftboundId ?? cardId),
                        displaySet: listing.card.setLabel || listing.card.setId || "Unknown set",
                        rarityLabel: getRarityLabel(listing.card.rarity),
                    }
                    : null;

                const card = listingCard ||
                    cardsById.get(cardId) || {
                        id: cardId,
                        cardId,
                        riftboundId: cardId,
                        name: listing.cardName || "Unknown card",
                        imageUrl: "",
                        displaySet: listing.setLabel || listing.setId || "Unknown set",
                        rarityLabel: getRarityLabel(listing.rarity),
                    };

                return {
                    listingId,
                    card,
                    price: Number(listing.price ?? listing.unitPrice ?? 0),
                    quantity: Math.max(1, Number(listing.quantity ?? listing.availableQuantity ?? 1)),
                    condition: listing.condition || "Near Mint",
                    notes: String(listing.notes || "").trim(),
                };
            })
            .filter((listing) => listing.listingId);
    }, [cardsById, rawListings]);

    const filteredCatalog = useMemo(() => {
        const search = searchQuery.trim().toLowerCase();
        if (!search) {
            return cardCatalog;
        }

        return cardCatalog.filter((card) =>
            [card.name, card.displaySet, card.rarityLabel].some((value) =>
                String(value).toLowerCase().includes(search)
            )
        );
    }, [cardCatalog, searchQuery]);

    const totalCards = cardCatalog.length;
    const activeListings = listings.length;

    function resetCreateModal() {
        setSearchQuery("");
        setSelectedCardId("");
        setNewListing({
            price: "",
            quantity: 1,
            condition: "Near Mint",
            notes: "",
        });
    }

    function openCreateModal() {
        resetCreateModal();
        setIsCreateModalOpen(true);
    }

    function closeCreateModal() {
        setIsCreateModalOpen(false);
    }

    function updateListingForm(name, value) {
        setNewListing((prev) => ({...prev, [name]: value}));
    }

    async function createListing(e) {
        e.preventDefault();

        if (!selectedCard) {
            return;
        }

        try {
            await axiosInstance.post("/Listing/AddListing", {
                cardId: selectedCard.cardId ?? selectedCard.riftboundId,
                price: newListing.price,
                quantity: newListing.quantity,
                condition: newListing.condition,
                notes: newListing.notes,
                userId,
                UserId: userId,
            });

            loadListings();
            closeCreateModal();
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <>
            <Navbar active={"marketplace"} />

            <div className="marketplace-page">
                <div className="marketplace-shell container-fluid">
                    <div className="marketplace-header">
                        <div>
                            <p className="marketplace-kicker">Marketplace</p>
                            <h1>List cards for sale</h1>
                            <p className="marketplace-subtitle">
                                Create listings directly from your card catalog and manage pricing in one place.
                            </p>
                        </div>
                        <div className="marketplace-actions">
                            <div className="marketplace-stats">
                                <div>
                                    <span>Cards available</span>
                                    <strong>{totalCards}</strong>
                                </div>
                                <div>
                                    <span>Active listings</span>
                                    <strong>{activeListings}</strong>
                                </div>
                            </div>
                            <button type="button" className="create-listing-button" onClick={openCreateModal}>
                                <Plus size={17} />
                                Create listing
                            </button>
                        </div>
                    </div>

                    <section className="marketplace-results">
                        <div className="results-header">
                            <h2>Listings</h2>
                            <span>{activeListings} published</span>
                        </div>

                        {listings.length === 0 && (
                            <div className="empty-state">
                                <h3>No listings yet</h3>
                                <p>Create your first listing to make cards visible in the marketplace.</p>
                                <button type="button" className="create-listing-button" onClick={openCreateModal}>
                                    <Sparkles size={16} />
                                    Add first listing
                                </button>
                            </div>
                        )}

                        {listings.length > 0 && (
                            <div className="cards-grid">
                                {listings.map((listing) => (
                                    <article className="card-tile listing-tile" key={listing.listingId}>
                                        <div className="card-art">
                                            {listing.card.imageUrl ? (
                                                <img src={listing.card.imageUrl} alt={listing.card.name} />
                                            ) : (
                                                <div className="card-art-placeholder">
                                                    <span>No image</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-body">
                                            <div className="card-topline">
                                                <span className="rarity-pill">{listing.card.rarityLabel}</span>
                                                <span className="collector-number">{listing.condition}</span>
                                            </div>

                                            <h3>{listing.card.name}</h3>
                                            <p className="card-meta">{listing.card.displaySet}</p>

                                            <div className="listing-metrics">
                                                <p>
                                                    <CircleDollarSign size={16} />
                                                    ${listing.price.toFixed(2)}
                                                </p>
                                                <p>Qty {listing.quantity}</p>
                                            </div>

                                            {listing.notes && <p className="card-text">{listing.notes}</p>}

                                            <button
                                                type="button"
                                                className="buy-button"
                                                onClick={() =>
                                                    addToCart({
                                                        listingId: listing.listingId,
                                                        cardId: listing.card.cardId ?? listing.card.riftboundId,
                                                        name: listing.card.name,
                                                        imageUrl: listing.card.imageUrl,
                                                        setLabel: listing.card.displaySet,
                                                        rarity: listing.card.rarityLabel,
                                                        condition: listing.condition,
                                                        unitPrice: listing.price,
                                                        availableQuantity: listing.quantity,
                                                    })
                                                }
                                            >
                                                Buy
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="listing-modal-overlay" role="presentation" onClick={closeCreateModal}>
                    <div
                        className="listing-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-listing-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="listing-modal-header">
                            <div>
                                <p className="marketplace-kicker">New listing</p>
                                <h2 id="create-listing-title">Choose a card and set details</h2>
                            </div>
                            <button type="button" className="icon-button" onClick={closeCreateModal} aria-label="Close modal">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="listing-modal-content">
                            <div className="listing-card-picker">
                                <label className="filter-field">
                                    <span className="filter-label">Card search</span>
                                    <div className="filter-input-wrap">
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by card, set, rarity..."
                                        />
                                    </div>
                                </label>

                                <div className="picker-grid">
                                    {filteredCatalog.map((card) => (
                                        <button
                                            key={card.id}
                                            type="button"
                                            className={`picker-card ${selectedCardId === card.id ? "is-selected" : ""}`}
                                            onClick={() => setSelectedCardId(card.id)}
                                        >
                                            <div className="picker-card-art">
                                                {card.imageUrl ? (
                                                    <img src={card.imageUrl} alt={card.name} />
                                                ) : (
                                                    <div className="card-art-placeholder">
                                                        <span>No image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="picker-card-body">
                                                <h3>{card.name}</h3>
                                                <p>{card.displaySet}</p>
                                                <span className="rarity-pill">{card.rarityLabel}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form className="listing-form" onSubmit={createListing}>
                                <label className="filter-field">
                                    <span className="filter-label">Selected card</span>
                                    <div className="selected-card-readout">
                                        {selectedCard ? (
                                            <>
                                                <strong>{selectedCard.name}</strong>
                                                <span>{selectedCard.displaySet}</span>
                                            </>
                                        ) : (
                                            <span>Choose a card from the left</span>
                                        )}
                                    </div>
                                </label>

                                <label className="filter-field">
                                    <span className="filter-label">Price (USD)</span>
                                    <div className="filter-input-wrap">
                                        <CircleDollarSign size={16} />
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={newListing.price}
                                            onChange={(e) => updateListingForm("price", e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </label>

                                <label className="filter-field">
                                    <span className="filter-label">Quantity</span>
                                    <div className="filter-input-wrap">
                                        <input
                                            type="number"
                                            min="1"
                                            value={newListing.quantity}
                                            onChange={(e) => updateListingForm("quantity", e.target.value)}
                                            required
                                        />
                                    </div>
                                </label>

                                <label className="filter-field">
                                    <span className="filter-label">Condition</span>
                                    <div className="select-wrap">
                                        <select
                                            value={newListing.condition}
                                            onChange={(e) => updateListingForm("condition", e.target.value)}
                                        >
                                            <option value="Near Mint">Near Mint</option>
                                            <option value="Lightly Played">Lightly Played</option>
                                            <option value="Moderately Played">Moderately Played</option>
                                            <option value="Heavily Played">Heavily Played</option>
                                        </select>
                                    </div>
                                </label>

                                <label className="filter-field">
                                    <span className="filter-label">Notes</span>
                                    <textarea
                                        value={newListing.notes}
                                        onChange={(e) => updateListingForm("notes", e.target.value)}
                                        placeholder="Optional note for buyers"
                                    />
                                </label>

                                <div className="listing-form-actions">
                                    <button type="button" className="secondary-button" onClick={closeCreateModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="create-listing-button" disabled={!selectedCard}>
                                        Publish listing
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Marketplace;
