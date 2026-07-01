import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import { useNavigate } from "react-router";
import Calendar from "react-calendar";
import Navbar from "../Components/Navbar.jsx";
import useTournamentStore from "../store/tournamentStore.js";
import "react-calendar/dist/Calendar.css";
import "../styles/tournaments.css";

function formatDateTime(value) {
    if (!value) {
        return "Date TBD";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "Date TBD";
    }

    return parsed.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

function toDateKey(value) {
    if (!value) {
        return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateLabel(value) {
    if (!value) {
        return "All dates";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "All dates";
    }

    return parsed.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

function TournamentPage() {
    const navigate = useNavigate();
    const tournaments = useTournamentStore((state) => state.tournaments);
    const fetchTournaments = useTournamentStore((state) => state.fetchTournaments);
    const loading = useTournamentStore((state) => state.loading);
    const error = useTournamentStore((state) => state.error);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        fetchTournaments();
    }, [fetchTournaments]);

    const sortedTournaments = useMemo(() => {
        return [...tournaments].sort((a, b) => {
            const first = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
            const second = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
            return first - second;
        });
    }, [tournaments]);

    const stats = useMemo(() => {
        const total = sortedTournaments.length;
        const upcoming = sortedTournaments.filter((item) => item.status !== "Completed").length;
        const totalPrize = sortedTournaments.reduce((sum, item) => sum + Number(item.prizePool || 0), 0);
        const totalSeats = sortedTournaments.reduce((sum, item) => sum + Number(item.maxPlayers || 0), 0);

        return [
            { label: "Total Tournaments", value: total.toLocaleString() },
            { label: "Upcoming", value: upcoming.toLocaleString() },
            { label: "Combined Prize Pool", value: formatCurrency(totalPrize) },
            { label: "Player Capacity", value: totalSeats.toLocaleString() },
        ];
    }, [sortedTournaments]);

    const tournamentsByDate = useMemo(() => {
        const map = new Map();

        sortedTournaments.forEach((item) => {
            const key = toDateKey(item.startDate);
            if (!key) {
                return;
            }

            map.set(key, (map.get(key) || 0) + 1);
        });

        return map;
    }, [sortedTournaments]);

    const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);

    const visibleTournaments = useMemo(() => {
        if (!selectedDateKey) {
            return sortedTournaments;
        }

        return sortedTournaments.filter((item) => toDateKey(item.startDate) === selectedDateKey);
    }, [selectedDateKey, sortedTournaments]);

    return (
        <>
            <Navbar active="tournaments" />
            <main className="tournament-page">
                <section className="tournament-hero">
                    <div className="container-fluid tournament-shell">
                        <p className="tournament-kicker">Events</p>
                        <h1>Compete in Community Tournaments</h1>
                        <p className="tournament-lead">
                            Follow upcoming events, formats, and prize pools all in one clean schedule view.
                        </p>
                        <div className="tournament-stat-grid">
                            {stats.map((item) => (
                                <article className="tournament-stat" key={item.label}>
                                    <p>{item.label}</p>
                                    <strong>{item.value}</strong>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="tournament-list-section">
                    <div className="container-fluid tournament-shell">
                        <div className="tournament-tools-grid">
                            <aside className="tournament-calendar-panel">
                                <div className="tournament-panel-head">
                                    <h2>Calendar</h2>
                                    <button
                                        type="button"
                                        className="tournament-admin-link"
                                        onClick={() => navigate("/Dashboard")}
                                    >
                                        Create From Admin Dashboard
                                    </button>
                                </div>

                                <Calendar
                                    className="tournament-calendar"
                                    locale="en-US"
                                    onClickDay={(value) => setSelectedDate(value)}
                                    value={selectedDate}
                                    tileClassName={({ date, view }) =>
                                        view === "month" && tournamentsByDate.has(toDateKey(date)) ? "has-event" : undefined
                                    }
                                    tileContent={({ date, view }) => {
                                        if (view !== "month") {
                                            return null;
                                        }

                                        const count = tournamentsByDate.get(toDateKey(date));
                                        if (!count) {
                                            return null;
                                        }

                                        return <span className="tournament-event-dot">{count}</span>;
                                    }}
                                />

                                <div className="tournament-selected-meta">
                                    <p>
                                        Viewing: <strong>{formatDateLabel(selectedDate)}</strong>
                                    </p>
                                    <button
                                        type="button"
                                        className="tournament-clear-date"
                                        onClick={() => setSelectedDate(null)}
                                        disabled={!selectedDate}
                                    >
                                        Clear date filter
                                    </button>
                                </div>
                            </aside>

                            <div>
                                <div className="tournament-list-header">
                                    <h2>Schedule</h2>
                                    <span>{visibleTournaments.length} events</span>
                                </div>

                                {loading && (
                                    <div className="tournament-empty">
                                        <h3>Loading tournaments...</h3>
                                    </div>
                                )}

                                {error && (
                                    <div className="tournament-empty">
                                        <h3>Could not load tournaments</h3>
                                        <p>{error}</p>
                                    </div>
                                )}

                                {!loading && !error && sortedTournaments.length === 0 && (
                                    <div className="tournament-empty">
                                        <h3>No tournaments created yet</h3>
                                        <p>Create your first event in the admin dashboard to publish it here.</p>
                                    </div>
                                )}

                                {!loading && !error && sortedTournaments.length > 0 && visibleTournaments.length === 0 && (
                                    <div className="tournament-empty">
                                        <h3>No events on this date</h3>
                                        <p>Select another day in the calendar to see tournaments.</p>
                                    </div>
                                )}

                                {!loading && !error && visibleTournaments.length > 0 && (
                                    <div className="tournament-grid">
                                        {visibleTournaments.map((tournament) => (
                                            <article className="tournament-card" key={tournament.id}>
                                                <div className="tournament-card-top">
                                                    <span className={`tournament-status ${tournament.status === "Completed" ? "is-completed" : ""}`}>
                                                        {tournament.status}
                                                    </span>
                                                    <span className="tournament-format">{tournament.format}</span>
                                                </div>
                                                <h3>{tournament.name}</h3>
                                                <p className="tournament-game">{tournament.game}</p>

                                                <div className="tournament-meta-list">
                                                    <p>
                                                        <CalendarDays size={16} />
                                                        {formatDateTime(tournament.startDate)}
                                                    </p>
                                                    <p>
                                                        <MapPin size={16} />
                                                        {tournament.location || "TBD"}
                                                    </p>
                                                    <p>
                                                        <Users size={16} />
                                                        Up to {tournament.maxPlayers} players
                                                    </p>
                                                    <p>
                                                        <Trophy size={16} />
                                                        Prize pool {formatCurrency(tournament.prizePool)}
                                                    </p>
                                                </div>

                                                <div className="tournament-finance">
                                                    <span>Entry</span>
                                                    <strong>{formatCurrency(tournament.entryFee)}</strong>
                                                </div>

                                                {tournament.description && (
                                                    <p className="tournament-description">{tournament.description}</p>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

export default TournamentPage;
