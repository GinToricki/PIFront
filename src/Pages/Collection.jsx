import Navbar from "../Components/Navbar.jsx";
import axiosInstance from "../Common/axiosInstance.jsx";
import {useEffect, useMemo, useState} from "react";
import { Search, SlidersHorizontal, ChevronDown, Sparkles, Plus, Minus, Save } from "lucide-react";
import useAuthStore from "../store/authStore.js";
import "../styles/collection.css";

const rarityLabels = {
    1: "Common",
    2: "Uncommon",
    3: "Rare",
    4: "Epic",
    5: "Overnumbered",
    6: "Showcase",
    7: "Promo",
};

const rarityLookup = Object.fromEntries(
    Object.entries(rarityLabels).map(([value, label]) => [label.toLowerCase(), value])
);

function getRarityLabel(value) {
    if (value == null) {
        return "Unknown";
    }

    if (rarityLabels[value]) {
        return rarityLabels[value];
    }

    const stringValue = String(value);
    const lookup = rarityLookup[stringValue.toLowerCase()];

    return lookup ? rarityLabels[lookup] : stringValue;
}

function isRarityMatch(cardRarity, selectedRarity) {
    if (selectedRarity === "all") {
        return true;
    }

    if (String(cardRarity ?? "") === selectedRarity) {
        return true;
    }

    const lookup = rarityLookup[String(cardRarity ?? "").toLowerCase()];

    return lookup === selectedRarity;
}

function Collection() {
    const userId = useAuthStore((state) => state.userId);
    const [cards, setCards] = useState([]);
    const [deckName, setDeckName] = useState("");
    const [deckEntries, setDeckEntries] = useState({});
    const [deckStatus, setDeckStatus] = useState({ type: "", message: "" });
    const [isSavingDeck, setIsSavingDeck] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        rarity: "all",
        setId: "all",
        cardType: "all",
        domain: "all",
        alternateArt: false,
        overnumbered: false,
        signature: false,
        sortBy: "name",
    });

    useEffect(() => {
        axiosInstance
            .get("/Card/GetAllCards")
            .then((response) => {
                if (response) {
                    setCards(response.data);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    const setOptions = useMemo(() => {
        return [...new Set(cards.map((card) => card.setLabel || card.setId).filter(Boolean))].sort();
    }, [cards]);

    const typeOptions = useMemo(() => {
        return [...new Set(cards.map((card) => card.cardType).filter(Boolean))].sort();
    }, [cards]);

    const domainOptions = useMemo(() => {
        return [...new Set(cards.map((card) => card.domain).filter(Boolean))].sort();
    }, [cards]);

    const filteredCards = useMemo(() => {
        const search = filters.search.trim().toLowerCase();

        const nextCards = cards.filter((card) => {
            const setValue = card.setLabel || card.setId || "";
            const domainValue = card.domain || "";

            const matchesSearch =
                !search ||
                [card.name, card.cleanName, card.riftboundId, card.textPlain, setValue]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(search));

            const matchesRarity = isRarityMatch(card.rarity, filters.rarity);
            const matchesSet = filters.setId === "all" || setValue === filters.setId;
            const matchesType = filters.cardType === "all" || card.cardType === filters.cardType;
            const matchesDomain = filters.domain === "all" || domainValue === filters.domain;
            const matchesAlternateArt = !filters.alternateArt || card.alternateArt;
            const matchesOvernumbered = !filters.overnumbered || card.overnumbered;
            const matchesSignature = !filters.signature || card.signature;

            return (
                matchesSearch &&
                matchesRarity &&
                matchesSet &&
                matchesType &&
                matchesDomain &&
                matchesAlternateArt &&
                matchesOvernumbered &&
                matchesSignature
            );
        });

        const sorters = {
            name: (a, b) => (a.name || "").localeCompare(b.name || ""),
            set: (a, b) => (a.setLabel || a.setId || "").localeCompare(b.setLabel || b.setId || ""),
            rarity: (a, b) => Number(a.rarity ?? 0) - Number(b.rarity ?? 0),
            number: (a, b) => Number(a.collectorNumber ?? 0) - Number(b.collectorNumber ?? 0),
        };

        return [...nextCards].sort(sorters[filters.sortBy] || sorters.name);
    }, [cards, filters]);

    const totalCards = cards.length;
    const visibleCards = filteredCards.length;
    const deckCardCount = Object.values(deckEntries).reduce((sum, qty) => sum + Number(qty || 0), 0);

    const cardsById = useMemo(() => {
        const map = new Map();

        cards.forEach((card) => {
            const id = String(card.cardId ?? card.riftboundId ?? "");
            if (id) {
                map.set(id, card);
            }
        });

        return map;
    }, [cards]);

    const selectedDeckCards = useMemo(() => {
        return Object.entries(deckEntries)
            .filter(([, quantity]) => quantity > 0)
            .map(([cardId, quantity]) => {
                const card = cardsById.get(cardId);
                return {
                    cardId,
                    quantity,
                    name: card?.name || "Unknown card",
                    setLabel: card?.setLabel || card?.setId || "Unknown set",
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [cardsById, deckEntries]);

    function updateFilter(name, value) {
        setFilters((prev) => ({...prev, [name]: value}));
    }

    function addCardToDeck(card) {
        const id = String(card.cardId ?? card.riftboundId ?? "");
        if (!id) {
            return;
        }

        setDeckStatus({ type: "", message: "" });
        setDeckEntries((prev) => ({ ...prev, [id]: Number(prev[id] || 0) + 1 }));
    }

    function decreaseCardQuantity(cardId) {
        setDeckEntries((prev) => {
            const nextQuantity = Number(prev[cardId] || 0) - 1;
            const next = { ...prev };

            if (nextQuantity <= 0) {
                delete next[cardId];
            } else {
                next[cardId] = nextQuantity;
            }

            return next;
        });
    }

    function increaseCardQuantity(cardId) {
        setDeckEntries((prev) => ({ ...prev, [cardId]: Number(prev[cardId] || 0) + 1 }));
    }

    function clearDeckBuilder() {
        setDeckName("");
        setDeckEntries({});
        setDeckStatus({ type: "", message: "" });
    }

    async function saveDeck() {
        const trimmedDeckName = deckName.trim();

        if (!userId) {
            setDeckStatus({ type: "error", message: "Missing user ID. Please log in again." });
            return;
        }

        if (!trimmedDeckName) {
            setDeckStatus({ type: "error", message: "Enter a deck name before saving." });
            return;
        }

        if (selectedDeckCards.length === 0) {
            setDeckStatus({ type: "error", message: "Add at least one card to the deck." });
            return;
        }

        const deckList = selectedDeckCards.map((item) => `${item.cardId}:${item.quantity}`).join(";");

        setDeckStatus({ type: "", message: "" });
        setIsSavingDeck(true);

        try {
            await axiosInstance.post("/Deck/AddDeck", {
                UserId: userId,
                userId,
                DeckName: trimmedDeckName,
                deckName: trimmedDeckName,
                DeckList: deckList,
                deckList,
            });

            setDeckStatus({ type: "success", message: `Saved deck "${trimmedDeckName}".` });
            setDeckEntries({});
            setDeckName("");
        } catch (error) {
            const message = error?.response?.data?.message || "Failed to save deck.";
            setDeckStatus({ type: "error", message });
        } finally {
            setIsSavingDeck(false);
        }
    }

    function clearFilters() {
        setFilters({
            search: "",
            rarity: "all",
            setId: "all",
            cardType: "all",
            domain: "all",
            alternateArt: false,
            overnumbered: false,
            signature: false,
            sortBy: "name",
        });
    }

    return (
        <>
            <Navbar active={"collection"} />
            <div className="collection-page">
                <div className="collection-shell container-fluid">
                    <div className="collection-header">
                        <div>
                            <p className="collection-kicker">Collection</p>
                            <h1>Your cards, organized</h1>
                            <p className="collection-subtitle">
                                Browse the collection with live filters for rarity, set, type, and card flags.
                            </p>
                        </div>
                        <div className="collection-stats">
                            <div>
                                <span>Total cards</span>
                                <strong>{totalCards}</strong>
                            </div>
                            <div>
                                <span>Visible</span>
                                <strong>{visibleCards}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 align-items-start">
                        <div className="col-12 col-lg-3">
                            <aside className="collection-filters">
                                <div className="filter-title">
                                    <SlidersHorizontal size={18} />
                                    <span>Filters</span>
                                </div>

                                <label className="filter-field">
                                    <span className="filter-label">Search</span>
                                    <div className="filter-input-wrap">
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            value={filters.search}
                                            onChange={(e) => updateFilter("search", e.target.value)}
                                            placeholder="Name, id, text..."
                                        />
                                    </div>
                                </label>

                                <label className="filter-field">
                                    <span className="filter-label">Sort by</span>
                                    <div className="select-wrap">
                                        <select
                                            value={filters.sortBy}
                                            onChange={(e) => updateFilter("sortBy", e.target.value)}
                                        >
                                            <option value="name">Name</option>
                                            <option value="set">Set</option>
                                            <option value="rarity">Rarity</option>
                                            <option value="number">Collector number</option>
                                        </select>
                                        <ChevronDown size={16} />
                                    </div>
                                </label>

                                <label className="filter-field">
                                    <span className="filter-label">Rarity</span>
                                    <div className="select-wrap">
                                        <select
                                            value={filters.rarity}
                                            onChange={(e) => updateFilter("rarity", e.target.value)}
                                        >
                                            <option value="all">All rarities</option>
                                            {Object.entries(rarityLabels).map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} />
                                    </div>
                                </label>

                                <label className="filter-field">
                                    <span className="filter-label">Set</span>
                                    <div className="select-wrap">
                                        <select
                                            value={filters.setId}
                                            onChange={(e) => updateFilter("setId", e.target.value)}
                                        >
                                            <option value="all">All sets</option>
                                            {setOptions.map((setName) => (
                                                <option key={setName} value={setName}>
                                                    {setName}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} />
                                    </div>
                                </label>

                                <label className="filter-field">
                                    <span className="filter-label">Type</span>
                                    <div className="select-wrap">
                                        <select
                                            value={filters.cardType}
                                            onChange={(e) => updateFilter("cardType", e.target.value)}
                                        >
                                            <option value="all">All types</option>
                                            {typeOptions.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} />
                                    </div>
                                </label>

                                <label className="filter-field">
                                    <span className="filter-label">Domain</span>
                                    <div className="select-wrap">
                                        <select
                                            value={filters.domain}
                                            onChange={(e) => updateFilter("domain", e.target.value)}
                                        >
                                            <option value="all">All domains</option>
                                            {domainOptions.map((domain) => (
                                                <option key={domain} value={domain}>
                                                    {domain}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} />
                                    </div>
                                </label>

                                <div className="filter-toggles">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={filters.alternateArt}
                                            onChange={(e) => updateFilter("alternateArt", e.target.checked)}
                                        />
                                        Alternate art
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={filters.overnumbered}
                                            onChange={(e) => updateFilter("overnumbered", e.target.checked)}
                                        />
                                        Overnumbered
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={filters.signature}
                                            onChange={(e) => updateFilter("signature", e.target.checked)}
                                        />
                                        Signature
                                    </label>
                                </div>

                                <button type="button" className="clear-filters" onClick={clearFilters}>
                                    <Sparkles size={16} />
                                    Clear filters
                                </button>

                                <div className="deck-builder">
                                    <div className="deck-builder-header">
                                        <h3>Deck Builder</h3>
                                        <span>{deckCardCount} cards</span>
                                    </div>

                                    <label className="filter-field">
                                        <span className="filter-label">Deck name</span>
                                        <div className="filter-input-wrap">
                                            <input
                                                type="text"
                                                value={deckName}
                                                onChange={(e) => setDeckName(e.target.value)}
                                                placeholder="Enter deck name"
                                            />
                                        </div>
                                    </label>

                                    <div className="deck-list">
                                        {selectedDeckCards.length === 0 && (
                                            <p className="deck-empty">Add cards from the list to start building.</p>
                                        )}

                                        {selectedDeckCards.map((entry) => (
                                            <div className="deck-item" key={entry.cardId}>
                                                <div className="deck-item-info">
                                                    <strong>{entry.name}</strong>
                                                    <span>{entry.setLabel}</span>
                                                </div>
                                                <div className="deck-item-actions">
                                                    <button
                                                        type="button"
                                                        className="icon-button"
                                                        onClick={() => decreaseCardQuantity(entry.cardId)}
                                                        aria-label={`Decrease ${entry.name}`}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span>{entry.quantity}</span>
                                                    <button
                                                        type="button"
                                                        className="icon-button"
                                                        onClick={() => increaseCardQuantity(entry.cardId)}
                                                        aria-label={`Increase ${entry.name}`}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {deckStatus.message && (
                                        <p className={`deck-status ${deckStatus.type === "error" ? "is-error" : "is-success"}`}>
                                            {deckStatus.message}
                                        </p>
                                    )}

                                    <div className="deck-actions">
                                        <button type="button" className="secondary-button" onClick={clearDeckBuilder}>
                                            Reset
                                        </button>
                                        <button
                                            type="button"
                                            className="save-deck-button"
                                            onClick={saveDeck}
                                            disabled={isSavingDeck}
                                        >
                                            <Save size={15} />
                                            {isSavingDeck ? "Saving..." : "Save deck"}
                                        </button>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        <div className="col-12 col-lg-9">
                            <div className="collection-results">
                                <div className="results-header">
                                    <h2>Cards</h2>
                                    <span>{visibleCards} shown</span>
                                </div>

                                <div className="cards-grid">
                                    {filteredCards.map((card) => {
                                        const rarityLabel = getRarityLabel(card.rarity);
                                        const displaySet = card.setLabel || card.setId || "Unknown set";
                                        const displayStats = [
                                            card.energy != null ? `E ${card.energy}` : null,
                                            card.might != null ? `M ${card.might}` : null,
                                            card.power != null ? `P ${card.power}` : null,
                                        ].filter(Boolean);

                                        return (
                                            <article className="card-tile" key={card.cardId || card.riftboundId}>
                                                <div className="card-art">
                                                    {card.imageUrl ? (
                                                        <img src={card.imageUrl} alt={card.accessibilityText || card.name} />
                                                    ) : (
                                                        <div className="card-art-placeholder">
                                                            <span>No image</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="card-body">
                                                    <div className="card-topline">
                                                        <span className="rarity-pill">{rarityLabel}</span>
                                                        <span className="collector-number">
                                                            #{card.collectorNumber ?? "?"}
                                                        </span>
                                                    </div>

                                                    <h3>{card.name}</h3>
                                                    <p className="card-meta">{displaySet}</p>
                                                    <p className="card-type">
                                                        {card.cardType}
                                                        {card.domain ? ` · ${card.domain}` : ""}
                                                    </p>

                                                    {card.textPlain && <p className="card-text">{card.textPlain}</p>}

                                                    {displayStats.length > 0 && (
                                                        <div className="stat-chips">
                                                            {displayStats.map((stat) => (
                                                                <span key={stat}>{stat}</span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="card-flags">
                                                        {card.alternateArt && <span>Alt art</span>}
                                                        {card.overnumbered && <span>Overnumbered</span>}
                                                        {card.signature && <span>Signature</span>}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="add-to-deck-button"
                                                        onClick={() => addCardToDeck(card)}
                                                    >
                                                        <Plus size={15} />
                                                        Add to deck
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                {filteredCards.length === 0 && (
                                    <div className="empty-state">
                                        <h3>No cards match these filters</h3>
                                        <p>Clear the filters or widen the search to bring cards back into view.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Collection;
