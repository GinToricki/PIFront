import {useMemo, useState} from "react";
import {CircleDollarSign, Plus, Search, Sparkles, X} from "lucide-react";
import Navbar from "../Components/Navbar.jsx";
import "../styles/marketplace.css";

const cardCatalog = [
    {
        cardId: "rb-001",
        name: "Astra, Dawn Vanguard",
        setLabel: "Riftfall Core",
        rarity: "Epic",
        imageUrl: "",
    },
    {
        cardId: "rb-014",
        name: "Gloom Harbor Corsair",
        setLabel: "Tides of Ruin",
        rarity: "Rare",
        imageUrl: "",
    },
    {
        cardId: "rb-031",
        name: "Ironbark Sentinel",
        setLabel: "Wildspire Siege",
        rarity: "Uncommon",
        imageUrl: "",
    },
    {
        cardId: "rb-048",
        name: "Hexglass Adept",
        setLabel: "Riftfall Core",
        rarity: "Rare",
        imageUrl: "",
    },
    {
        cardId: "rb-059",
        name: "Vera, Skybreaker",
        setLabel: "Stormwake Prelude",
        rarity: "Showcase",
        imageUrl: "",
    },
    {
        cardId: "rb-073",
        name: "Nightcoil Drake",
        setLabel: "Tides of Ruin",
        rarity: "Common",
        imageUrl: "",
    },
];

function Marketplace() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCardId, setSelectedCardId] = useState("");
    const [newListing, setNewListing] = useState({
        price: "",
        quantity: 1,
        condition: "Near Mint",
        notes: "",
    });
    const [listings, setListings] = useState([]);

    const selectedCard = useMemo(
        () => cardCatalog.find((card) => card.cardId === selectedCardId),
        [selectedCardId]
    );

    const filteredCatalog = useMemo(() => {
        const search = searchQuery.trim().toLowerCase();
        if (!search) {
            return cardCatalog;
        }

        return cardCatalog.filter((card) =>
            [card.name, card.setLabel, card.rarity].some((value) =>
                String(value).toLowerCase().includes(search)
            )
        );
    }, [searchQuery]);

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

    function createListing(e) {
        e.preventDefault();

        if (!selectedCard) {
            return;
        }

        setListings((prev) => [
            {
                listingId: `lst-${Date.now()}`,
                card: selectedCard,
                price: Number(newListing.price || 0),
                quantity: Number(newListing.quantity || 1),
                condition: newListing.condition,
                notes: newListing.notes.trim(),
            },
            ...prev,
        ]);

        closeCreateModal();
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
                                                <span className="rarity-pill">{listing.card.rarity}</span>
                                                <span className="collector-number">{listing.condition}</span>
                                            </div>

                                            <h3>{listing.card.name}</h3>
                                            <p className="card-meta">{listing.card.setLabel}</p>

                                            <div className="listing-metrics">
                                                <p>
                                                    <CircleDollarSign size={16} />
                                                    ${listing.price.toFixed(2)}
                                                </p>
                                                <p>Qty {listing.quantity}</p>
                                            </div>

                                            {listing.notes && <p className="card-text">{listing.notes}</p>}
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
                                            key={card.cardId}
                                            type="button"
                                            className={`picker-card ${selectedCardId === card.cardId ? "is-selected" : ""}`}
                                            onClick={() => setSelectedCardId(card.cardId)}
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
                                                <p>{card.setLabel}</p>
                                                <span className="rarity-pill">{card.rarity}</span>
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
                                                <span>{selectedCard.setLabel}</span>
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
