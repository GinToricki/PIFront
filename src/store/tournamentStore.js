import { create } from "zustand";
import axiosInstance from "../Common/axiosInstance.jsx";

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toIsoString(value) {
    if (!value) {
        return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    return parsed.toISOString();
}

function normalizeTournament(rawTournament) {
    const game = String(rawTournament.game ?? rawTournament.Game ?? "").trim();
    const format = String(rawTournament.format ?? rawTournament.Format ?? "").trim();
    const startDate = toIsoString(rawTournament.startDateTime ?? rawTournament.StartDateTime ?? rawTournament.startDate ?? "");
    const checkInTime = toIsoString(rawTournament.checkInTime ?? rawTournament.CheckInTime ?? "");
    const notes = String(rawTournament.notes ?? rawTournament.Notes ?? rawTournament.description ?? "").trim();

    return {
        id: rawTournament.tournamentId ?? rawTournament.TournamentId ?? rawTournament.id ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        name: `${game} ${format}`.trim() || "Tournament",
        game: game || "Riftbound",
        format: format || "Standard",
        location: String(rawTournament.location ?? rawTournament.Location ?? "TBD").trim(),
        maxPlayers: Math.max(2, toNumber(rawTournament.maxPlayers ?? rawTournament.MaxPlayers, 2)),
        entryFee: Math.max(0, toNumber(rawTournament.entryFee ?? rawTournament.EntryFee, 0)),
        prizePool: Math.max(0, toNumber(rawTournament.prizePool ?? rawTournament.PrizePool, 0)),
        startDate,
        checkInTime,
        status: startDate && new Date(startDate).getTime() < Date.now() ? "Completed" : "Upcoming",
        description: notes,
        notes,
    };
}

function buildCheckInDateTime(startDate, checkInTime) {
    if (!startDate) {
        return "";
    }

    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
        return "";
    }

    if (!checkInTime) {
        return start.toISOString();
    }

    const [hoursRaw, minutesRaw] = String(checkInTime).split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return start.toISOString();
    }

    const checkIn = new Date(start);
    checkIn.setHours(hours, minutes, 0, 0);
    return checkIn.toISOString();
}

function buildTournamentRequest(rawTournament, fallbackId = 0) {
    return {
        tournamentId: toNumber(rawTournament.id ?? rawTournament.tournamentId, fallbackId),
        game: String(rawTournament.game || "").trim(),
        format: String(rawTournament.format || "").trim(),
        startDateTime: toIsoString(rawTournament.startDate),
        checkInTime: buildCheckInDateTime(rawTournament.startDate, rawTournament.checkInTime),
        location: String(rawTournament.location || "").trim(),
        maxPlayers: Math.max(2, toNumber(rawTournament.maxPlayers, 2)),
        entryFee: Math.max(0, toNumber(rawTournament.entryFee, 0)),
        prizePool: Math.max(0, toNumber(rawTournament.prizePool, 0)),
        notes: String(rawTournament.notes || "").trim() || null,
    };
}

const useTournamentStore = create(
    (set, get) => ({
        tournaments: [],
        loading: false,
        error: "",
        fetchTournaments: async () => {
            set({ loading: true, error: "" });

            try {
                const response = await axiosInstance.get("/Tournament/GetAllTournaments");
                const payload = Array.isArray(response.data) ? response.data : [];

                set({
                    tournaments: payload.map((item) => normalizeTournament(item)),
                    loading: false,
                });
            } catch (error) {
                const message = error?.response?.data?.message || "Failed to load tournaments.";
                set({ loading: false, error: message });
            }
        },
        addTournament: async (rawTournament) => {
            set({ error: "" });

            const requestBody = buildTournamentRequest(rawTournament, 0);

            await axiosInstance.post("/Tournament/AddTournament", requestBody);
            await get().fetchTournaments();
        },
        updateTournament: async (rawTournament) => {
            set({ error: "" });

            const tournamentId = toNumber(rawTournament.id ?? rawTournament.tournamentId, 0);
            if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
                throw new Error("Invalid tournament ID.");
            }

            const requestBody = buildTournamentRequest(rawTournament, tournamentId);
            await axiosInstance.post("/Tournament/UpdateTournament", requestBody);
            await get().fetchTournaments();
        },
        deleteTournament: async (tournamentIdRaw) => {
            set({ error: "" });

            const tournamentId = toNumber(tournamentIdRaw, 0);
            if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
                throw new Error("Invalid tournament ID.");
            }

            await axiosInstance.post(`/Tournament/DeleteTournament/${tournamentId}`);
            await get().fetchTournaments();
        },
    })
);

export default useTournamentStore;
