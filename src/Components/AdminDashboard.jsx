import { useEffect, useMemo, useState } from "react";
import { CalendarClock, LayoutDashboard, Trophy } from "lucide-react";
import useTournamentStore from "../store/tournamentStore.js";

function AdminDashboard({ userId }) {
    const tournaments = useTournamentStore((state) => state.tournaments);
    const addTournament = useTournamentStore((state) => state.addTournament);
    const fetchTournaments = useTournamentStore((state) => state.fetchTournaments);
    const loading = useTournamentStore((state) => state.loading);
    const error = useTournamentStore((state) => state.error);
    const [createSuccess, setCreateSuccess] = useState("");
    const [activeTab, setActiveTab] = useState("tournaments");
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
            </div>
        </section>
    );
}

export default AdminDashboard;
