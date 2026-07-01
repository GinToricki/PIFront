import Navbar from "../Components/Navbar.jsx";
import useAuthStore from "../store/authStore.js";
import MemberDashboard from "../Components/MemberDashboard.jsx";
import AdminDashboard from "../Components/AdminDashboard.jsx";
import "../styles/dashboard.css";

function Dashboard() {
    const token = useAuthStore((state) => state.token);
    const storedRole = useAuthStore((state) => state.role);
    const storedRoles = useAuthStore((state) => state.roles);
    const userId = useAuthStore((state) => state.userId);

    const roles = Array.isArray(storedRoles) && storedRoles.length > 0
        ? storedRoles
        : storedRole
            ? [storedRole]
            : [];

    const loweredRoles = roles.map((roleValue) => String(roleValue).toLowerCase());
    const isAdmin = loweredRoles.includes("admin");
    const isMember = loweredRoles.includes("member");

    return (
        <>
            <Navbar />
            <div className="dashboard-page">
                <div className="dashboard-shell container">
                    {!token && (
                        <section>
                            <p className="dashboard-kicker">Dashboard</p>
                            <h1>Not logged in</h1>
                            <p>Log in to view your member or admin dashboard.</p>
                        </section>
                    )}

                    {token && isAdmin && <AdminDashboard userId={userId} />}

                    {token && !isAdmin && isMember && <MemberDashboard userId={userId} />}

                    {token && !isAdmin && !isMember && (
                        <section>
                            <p className="dashboard-kicker">Dashboard</p>
                            <h1>Role not recognized</h1>
                            <p>This account is logged in, but no member/admin role was found.</p>
                            <p className="dashboard-meta">
                                Role values: {roles.length > 0 ? roles.join(", ") : "None returned"}
                            </p>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}

export default Dashboard;
