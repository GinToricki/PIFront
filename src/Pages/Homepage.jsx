import {useEffect, useMemo, useState} from "react";
import {ArrowRight, ChevronRight, Layers, Package, Star, TrendingUp} from "lucide-react";
import {useNavigate} from "react-router";
import Navbar from "../Components/Navbar.jsx";
import HomeHeroScene from "../Components/HomeHeroScene.jsx";
import axiosInstance from "../Common/axiosInstance.jsx";
import "../styles/homepage.css";

const rarityLabels = {
    1: "Common",
    2: "Uncommon",
    3: "Rare",
    4: "Epic",
    5: "Overnumbered",
    6: "Showcase",
    7: "Promo",
};

function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 2}).format(
        Number(value || 0)
    );
}

function getRarityLabel(value) {
    if (value == null) {
        return "Unknown";
    }
    return rarityLabels[value] || String(value);
}

function normalizeCards(payload) {
    if (!Array.isArray(payload)) {
        return [];
    }

    return payload
        .map((card) => {
            const cardId = String(card.cardId ?? card.riftboundId ?? "");
            return {
                id: cardId,
                name: card.name || "Unnamed Card",
                type: card.cardType || "Unknown Type",
                rarity: getRarityLabel(card.rarity),
                imageUrl: card.imageUrl || "",
                setLabel: card.setLabel || card.setId || "Unknown Set",
                power: card.power,
                might: card.might,
                energy: card.energy,
                domain: card.domain || "",
            };
        })
        .filter((card) => card.id);
}

function pickRandomItems(items, count) {
    if (!Array.isArray(items) || items.length === 0 || count <= 0) {
        return [];
    }

    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled.slice(0, count);
}

function normalizeListings(payload) {
    let source = payload;
    if (Array.isArray(payload?.items)) {
        source = payload.items;
    } else if (Array.isArray(payload?.data)) {
        source = payload.data;
    }

    if (!Array.isArray(source)) {
        return [];
    }

    return source
        .map((listing) => ({
            id: String(listing.listingId ?? listing.id ?? ""),
            cardId: String(listing.cardId ?? listing.riftboundId ?? listing.card?.cardId ?? listing.card?.riftboundId ?? ""),
            price: Number(listing.price ?? listing.unitPrice ?? 0),
            quantity: Number(listing.quantity ?? listing.availableQuantity ?? 0),
            condition: listing.condition || "Unknown",
            createdAt: listing.createdAt || listing.updatedAt || null,
        }))
        .filter((listing) => listing.id);
}

function Homepage() {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        Promise.allSettled([axiosInstance.get("/Card/GetAllCards"), axiosInstance.get("/Listing/GetAllListings")])
            .then(([cardsResult, listingsResult]) => {
                if (!isMounted) {
                    return;
                }

                if (cardsResult.status === "fulfilled") {
                    setCards(normalizeCards(cardsResult.value?.data));
                }

                if (listingsResult.status === "fulfilled") {
                    setListings(normalizeListings(listingsResult.value?.data));
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const cardsById = useMemo(() => {
        const map = new Map();
        cards.forEach((card) => {
            map.set(String(card.id), card);
        });
        return map;
    }, [cards]);

    const featuredListings = useMemo(() => {
        return [...listings]
            .filter((listing) => listing.price > 0)
            .sort((a, b) => b.price - a.price)
            .slice(0, 6)
            .map((listing) => {
                const card = cardsById.get(String(listing.cardId));
                return {
                    listingId: listing.id,
                    name: card?.name || "Unknown Card",
                    type: card?.type || "Unknown Type",
                    rarity: card?.rarity || "Unknown",
                    imageUrl: card?.imageUrl || "",
                    price: listing.price,
                    quantity: listing.quantity,
                    condition: listing.condition,
                };
            });
    }, [listings, cardsById]);

    const heroImages = useMemo(
        () => pickRandomItems(cards.filter((card) => card.imageUrl), 8).map((card) => card.imageUrl),
        [cards]
    );

    const liveListings = useMemo(() => {
        const sorted = [...listings].sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return Number(b.id) - Number(a.id);
        });

        return sorted.slice(0, 8).map((listing) => {
            const card = cardsById.get(String(listing.cardId));
            return {
                id: listing.id,
                cardName: card?.name || "Unknown Card",
                setLabel: card?.setLabel || "Unknown Set",
                price: listing.price,
                quantity: listing.quantity,
                condition: listing.condition,
            };
        });
    }, [listings, cardsById]);

    const stats = useMemo(() => {
        const totalCards = cards.length;
        const totalListings = listings.length;
        const uniqueSets = new Set(cards.map((card) => card.setLabel).filter(Boolean)).size;
        const averageListingPrice =
            totalListings > 0
                ? listings.reduce((sum, listing) => sum + Number(listing.price || 0), 0) / totalListings
                : 0;

        return [
            {label: "Cards in catalog", value: totalCards.toLocaleString(), Icon: Package},
            {label: "Active listings", value: totalListings.toLocaleString(), Icon: TrendingUp},
            {label: "Sets supported", value: uniqueSets.toLocaleString(), Icon: Layers},
            {label: "Avg listing price", value: formatCurrency(averageListingPrice), Icon: Star},
        ];
    }, [cards, listings]);

    return (
        <>
            <Navbar />
            <main className="home-page">
                <section className="home-hero">
                    <HomeHeroScene images={heroImages} />
                    <div className="home-hero-overlay" />

                    <div className="container-fluid home-hero-shell">
                        <div className="home-hero-copy">
                            <p className="home-kicker">Powered by your live marketplace data</p>
                            <h1>Trade Smarter With Your Own Card Universe</h1>
                            <p className="home-hero-lead">
                                {isLoading
                                    ? "Loading your catalog and listings..."
                                    : `Your marketplace currently tracks ${cards.length.toLocaleString()} cards across ${new Set(
                                          cards.map((card) => card.setLabel).filter(Boolean)
                                      ).size.toLocaleString()} sets.`}
                            </p>

                            <div className="home-hero-actions">
                                <button type="button" className="home-btn home-btn-primary" onClick={() => navigate("/Marketplace")}>
                                    Browse Marketplace
                                    <ArrowRight size={16} />
                                </button>
                                <button type="button" className="home-btn home-btn-secondary" onClick={() => navigate("/Collection")}>
                                    Explore Collection
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="home-stats-strip">
                    <div className="container-fluid home-section-shell">
                        <div className="home-stats-grid">
                            {stats.map(({label, value, Icon}) => (
                                <article className="home-stat-tile" key={label}>
                                    <span className="home-stat-icon">
                                        <Icon size={20} />
                                    </span>
                                    <div>
                                        <strong>{value}</strong>
                                        <p>{label}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="home-section">
                    <div className="container-fluid home-section-shell">
                        <div className="home-section-header">
                            <div>
                                <p className="home-kicker">From Your Marketplace</p>
                                <h2>Top Listings by Price</h2>
                            </div>
                            <button type="button" className="home-text-link" onClick={() => navigate("/Marketplace")}>
                                View marketplace
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="home-card-grid">
                            {featuredListings.length === 0 && (
                                <p className="home-empty">No listings yet. Add listings in Marketplace to power this section.</p>
                            )}

                            {featuredListings.map((item) => (
                                <article className="home-card" key={item.listingId}>
                                    <div className="home-card-media">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} />
                                        ) : (
                                            <div className="home-card-fallback">No image</div>
                                        )}
                                        <span className="home-rarity">{item.rarity}</span>
                                    </div>
                                    <div className="home-card-body">
                                        <p>{item.type}</p>
                                        <h3>{item.name}</h3>
                                        <div className="home-card-price">
                                            <strong>{formatCurrency(item.price)}</strong>
                                            <span className="is-positive">Qty {item.quantity || 0}</span>
                                        </div>
                                        <button type="button" className="home-buy-btn" onClick={() => navigate("/Marketplace")}>
                                            {item.condition}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="home-section">
                    <div className="container-fluid home-section-shell">
                        <div className="home-live-grid">
                            <div className="home-live-copy">
                                <p className="home-kicker">Realtime Listings</p>
                                <h2>Latest Marketplace Activity</h2>
                                <p>
                                    This feed is pulled from your listing data and updates as new cards are posted.
                                </p>
                                <button type="button" className="home-btn home-btn-primary" onClick={() => navigate("/Marketplace")}>
                                    Open Marketplace
                                    <ArrowRight size={16} />
                                </button>
                            </div>

                            <div className="home-live-panel">
                                <header>
                                    <span />
                                    Latest listing updates
                                </header>
                                {liveListings.length === 0 && <p className="home-empty home-live-empty">No listing activity yet.</p>}
                                {liveListings.map((item) => (
                                    <div className="home-live-item" key={item.id}>
                                        <div className="home-avatar">{item.cardName[0] || "C"}</div>
                                        <div className="home-live-main">
                                            <p>{item.cardName}</p>
                                            <span>
                                                {item.setLabel} · {item.condition}
                                            </span>
                                        </div>
                                        <strong className="home-live-price">{formatCurrency(item.price)}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

export default Homepage;
