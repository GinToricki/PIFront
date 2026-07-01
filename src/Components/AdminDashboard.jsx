function AdminDashboard({ userId }) {
    return (
        <section>
            <p className="dashboard-kicker">Dashboard</p>
            <h1>Admin Dashboard</h1>
            <p>You have administrative access.</p>
            <p className="dashboard-meta">Admin ID: {userId ?? "Unavailable"}</p>
        </section>
    );
}

export default AdminDashboard;
