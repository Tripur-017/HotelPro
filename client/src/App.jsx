import React, { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "./api.js";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const dateLabel = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hotelpro_user") || "null"); } catch { return null; }
  });
  const [page, setPage] = useState("home");
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [bookingDates, setBookingDates] = useState({});
  const [roomForm, setRoomForm] = useState({ roomNumber: "", type: "Standard", description: "", pricePerNight: "2499", capacity: "2", features: "Wi-Fi, Air conditioning" });

  const notify = (message, kind = "success") => {
    setNotice({ message, kind });
    window.setTimeout(() => setNotice(null), 4500);
  };
  const saveSession = (payload) => {
    localStorage.setItem("hotelpro_token", payload.token);
    localStorage.setItem("hotelpro_user", JSON.stringify(payload.user));
    setUser(payload.user);
    setPage(payload.user.role === "admin" ? "admin" : "home");
  };
  const logout = () => {
    localStorage.removeItem("hotelpro_token");
    localStorage.removeItem("hotelpro_user");
    setUser(null); setBookings([]); setPage("home");
    notify("You have been logged out.");
  };

  async function loadRooms() {
    try { const { data } = await api.get("/rooms"); setRooms(data.rooms); }
    catch (error) { notify(getErrorMessage(error), "error"); }
  }
  async function loadMyBookings() {
    try { const { data } = await api.get("/bookings/my"); setBookings(data.bookings); }
    catch (error) { notify(getErrorMessage(error), "error"); }
  }
  async function loadAdmin() {
    try {
      const [bookingResponse, userResponse] = await Promise.all([api.get("/admin/bookings"), api.get("/admin/users")]);
      setAllBookings(bookingResponse.data.bookings); setUsers(userResponse.data.users);
    } catch (error) { notify(getErrorMessage(error), "error"); }
  }

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => {
    if (page === "bookings" && user) loadMyBookings();
    if (page === "admin" && user?.role === "admin") loadAdmin();
  }, [page, user]);

  const visibleRooms = useMemo(() => typeFilter === "All" ? rooms : rooms.filter((room) => room.type === typeFilter), [rooms, typeFilter]);

  async function submitAuth(event) {
    event.preventDefault(); setBusy(true);
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const body = authMode === "login"
        ? { email: authForm.email, password: authForm.password }
        : authForm;
      const { data } = await api.post(endpoint, body);
      saveSession(data);
      notify(authMode === "login" ? "Welcome back." : "Your account is ready.");
    } catch (error) { notify(getErrorMessage(error), "error"); }
    finally { setBusy(false); }
  }

  async function bookRoom(room) {
    if (!user) { setAuthMode("login"); setPage("auth"); notify("Please log in before booking.", "error"); return; }
    const dates = bookingDates[room._id] || {};
    if (!dates.checkIn || !dates.checkOut) { notify("Choose both check-in and check-out dates first.", "error"); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/bookings", { roomId: room._id, checkIn: dates.checkIn, checkOut: dates.checkOut });
      notify(`${data.message} Booking ID: ${data.booking.bookingId}`);
      setPage("bookings");
    } catch (error) { notify(getErrorMessage(error), "error"); }
    finally { setBusy(false); }
  }

  async function cancelBooking(id) {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      const { data } = await api.patch(`/bookings/${id}/cancel`);
      notify(data.message); await loadMyBookings();
      if (user?.role === "admin") await loadAdmin();
    } catch (error) { notify(getErrorMessage(error), "error"); }
  }

  async function addRoom(event) {
    event.preventDefault(); setBusy(true);
    try {
      await api.post("/rooms", roomForm);
      notify("Room added successfully.");
      setRoomForm({ roomNumber: "", type: "Standard", description: "", pricePerNight: "2499", capacity: "2", features: "Wi-Fi, Air conditioning" });
      await loadRooms();
    } catch (error) { notify(getErrorMessage(error), "error"); }
    finally { setBusy(false); }
  }

  async function deactivateRoom(id) {
    if (!window.confirm("Deactivate this room? It will no longer appear in public room listings.")) return;
    try { await api.patch(`/rooms/${id}/deactivate`); notify("Room deactivated."); await loadRooms(); }
    catch (error) { notify(getErrorMessage(error), "error"); }
  }

  const go = (next) => { setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const scrollToRooms = () => { setPage("home"); document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" }); };

  return <div className="app-shell">
    <div className="topline"><div className="container d-flex justify-content-between"><span>Thoughtful stays. Memorable moments.</span><span className="topline-right">A better way to stay <span className="tiny-dot">●</span></span></div></div>
    <header className="site-header">
      <nav className="container navbar navbar-expand-lg">
        <button className="brand-button" onClick={() => go("home")} aria-label="HotelPro home"><span className="brand-mark">H</span><span className="brand-word">hotelpro<span>.</span><small>STAY A LITTLE BETTER</small></span></button>
        <div className="nav-links">
          <button className={page === "home" ? "nav-link active" : "nav-link"} onClick={() => go("home")}>Home</button>
          <button className="nav-link" onClick={scrollToRooms}>Our rooms</button>
          {user && user.role === "customer" && <button className={page === "bookings" ? "nav-link active" : "nav-link"} onClick={() => go("bookings")}>My bookings</button>}
          {user?.role === "admin" && <button className={page === "admin" ? "nav-link active" : "nav-link"} onClick={() => go("admin")}>Admin</button>}
        </div>
        <div className="header-actions">
          {user ? <><span className="welcome-name">Hi, {user.name.split(" ")[0]}</span><button className="btn btn-outline-dark btn-sm rounded-pill px-3" onClick={logout}>Log out</button></>
            : <><button className="btn-login" onClick={() => { setAuthMode("login"); go("auth"); }}>Log in</button><button className="btn btn-dark rounded-pill px-4" onClick={() => { setAuthMode("register"); go("auth"); }}>Sign up <span aria-hidden="true">↗</span></button></>}
        </div>
      </nav>
    </header>

    {notice && <div className={`notice ${notice.kind === "error" ? "notice-error" : ""}`} role="status">{notice.kind === "error" ? "!" : "✓"} <span>{notice.message}</span><button onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div>}

    {page === "home" && <>
      <main>
        <section className="hero">
          <div className="hero-image" role="img" aria-label="Sunlit luxury hotel room"></div>
          <div className="hero-shade"></div>
          <div className="container hero-content">
            <div className="eyebrow light-eyebrow"><span className="eyebrow-line"></span> YOUR NEXT CHAPTER STARTS HERE</div>
            <h1>Find your place<br/>to <em>unwind.</em></h1>
            <p className="hero-copy">Thoughtfully designed spaces, warm hospitality, and little details that make every stay feel special.</p>
            <button className="btn btn-light rounded-pill hero-cta" onClick={scrollToRooms}>Explore our rooms <span>↗</span></button>
            <div className="hero-footnote"><span className="hero-foot-icon">✳</span> A stay that feels like you.</div>
          </div>
          <div className="hero-side-label">HOSPITALITY, REIMAGINED</div>
        </section>

        <section className="trust-strip"><div className="container trust-inner"><div><strong>01</strong><span>Thoughtful comfort</span></div><div><strong>02</strong><span>Warm hospitality</span></div><div><strong>03</strong><span>Easy reservations</span></div><div className="trust-note">YOUR COMFORT IS OUR CRAFT</div></div></section>

        <section className="section-pad rooms-section" id="rooms">
          <div className="container">
            <div className="section-heading-row"><div><div className="eyebrow"><span className="eyebrow-line"></span> YOUR HOME AWAY FROM HOME</div><h2>Rooms made for<br/><em>slowing down.</em></h2></div><p className="section-intro">Every room has its own character, with comfort at the heart of every detail. Find the space that feels right for you.</p></div>
            <div className="filter-row"><div className="filter-label">FIND YOUR FIT</div><div className="filter-pills">{["All", "Standard", "Deluxe", "Suite", "Family"].map(type => <button key={type} onClick={() => setTypeFilter(type)} className={typeFilter === type ? "filter-pill selected" : "filter-pill"}>{type}</button>)}</div><button className="text-refresh" onClick={loadRooms}>↻ Refresh rooms</button></div>
            {visibleRooms.length === 0 ? <div className="empty-state"><h3>No rooms to show just yet</h3><p>Check your backend connection or try another room type.</p><button className="btn btn-dark rounded-pill" onClick={loadRooms}>Try again</button></div> :
              <div className="row g-4">{visibleRooms.map((room, index) => <div className="col-md-6 col-xl-3" key={room._id}><article className="room-card">
                <div className={`room-photo room-photo-${index % 4}`}><span className="room-type-tag">{room.type}</span><span className="room-number">ROOM {room.roomNumber}</span></div>
                <div className="room-card-body"><div className="room-title-line"><h3>{room.type} room</h3><span className="capacity">♙ {room.capacity}</span></div><p className="room-description">{room.description}</p><div className="feature-list">{(room.features || []).slice(0, 3).map(feature => <span key={feature}>{feature}</span>)}</div>
                  <div className="room-price-row"><div><strong>{money(room.pricePerNight)}</strong><span> / night</span></div><span className="room-arrow">↗</span></div>
                  <div className="date-fields"><label>Check-in<input type="date" min={new Date().toISOString().slice(0, 10)} value={bookingDates[room._id]?.checkIn || ""} onChange={e => setBookingDates(old => ({ ...old, [room._id]: { ...old[room._id], checkIn: e.target.value } }))}/></label><label>Check-out<input type="date" min={bookingDates[room._id]?.checkIn || new Date().toISOString().slice(0, 10)} value={bookingDates[room._id]?.checkOut || ""} onChange={e => setBookingDates(old => ({ ...old, [room._id]: { ...old[room._id], checkOut: e.target.value } }))}/></label></div>
                  <button className="btn btn-book w-100" disabled={busy} onClick={() => bookRoom(room)}>{user ? "Book this room" : "Log in to book"} <span>↗</span></button>
                </div>
              </article></div>)}</div>}
          </div>
        </section>

        <section className="about-section"><div className="container about-grid"><div className="about-art"><div className="about-photo"></div><div className="about-stamp"><span>MADE FOR</span><strong>YOUR<br/>MOMENTS</strong><span>✳ HOTELPRO</span></div></div><div className="about-copy"><div className="eyebrow"><span className="eyebrow-line"></span> A DIFFERENT KIND OF STAY</div><h2>More than a room.<br/><em>A feeling.</em></h2><p>We believe the best stays are the ones that let you settle in, slow down, and feel at ease. From considered spaces to uncomplicated booking, HotelPro is here to make getting away feel effortless.</p><div className="about-values"><div><span>✳</span><strong>Comfort first</strong><small>Space to breathe and recharge.</small></div><div><span>✳</span><strong>Simple by design</strong><small>Booking without the fuss.</small></div></div><button className="btn btn-dark rounded-pill px-4 py-3 mt-4" onClick={scrollToRooms}>Find your room <span>↗</span></button></div></div></section>
      </main>
      <Footer />
    </>}

    {page === "auth" && <main className="auth-page"><div className="auth-visual"><div className="auth-visual-text"><div className="eyebrow light-eyebrow"><span className="eyebrow-line"></span> WELCOME TO HOTELPRO</div><h2>A little more<br/><em>room to be you.</em></h2><p>Your next favourite stay is closer than you think.</p></div></div><div className="auth-panel"><div className="auth-panel-inner"><div className="eyebrow"><span className="eyebrow-line"></span>{authMode === "login" ? "GOOD TO HAVE YOU BACK" : "LET'S GET YOU SETTLED"}</div><h1>{authMode === "login" ? "Welcome back." : "Create your account."}</h1><p className="muted-copy">{authMode === "login" ? "Sign in to manage your stays and reservations." : "Join us and make your next getaway effortless."}</p>
      <form onSubmit={submitAuth} className="auth-form">
        {authMode === "register" && <><label>Full name<input className="form-control" required maxLength="80" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Your name"/></label><label>Phone number <span className="optional">(optional)</span><input className="form-control" value={authForm.phone} onChange={e => setAuthForm({ ...authForm, phone: e.target.value })} placeholder="+91 98765 43210"/></label></>}
        <label>Email address<input className="form-control" type="email" required value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com"/></label>
        <label>Password<input className="form-control" type="password" required minLength="8" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="At least 8 characters"/></label>
        {authMode === "register" && <label>Confirm password<input className="form-control" type="password" required minLength="8" value={authForm.confirmPassword} onChange={e => setAuthForm({ ...authForm, confirmPassword: e.target.value })} placeholder="Enter password again"/></label>}
        <button className="btn btn-dark auth-submit w-100" disabled={busy}>{busy ? "Please wait…" : authMode === "login" ? "Log in to your account ↗" : "Create my account ↗"}</button>
      </form>
      <p className="auth-switch">{authMode === "login" ? "New to HotelPro?" : "Already have an account?"} <button onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthForm({ name: "", email: authForm.email, phone: "", password: "", confirmPassword: "" }); }}>{authMode === "login" ? "Create an account" : "Log in"}</button></p>
      <button className="back-home" onClick={() => go("home")}>← Back to homepage</button>
      </div></div></main>}

    {page === "bookings" && <main className="dashboard-page"><div className="container"><div className="eyebrow"><span className="eyebrow-line"></span> YOUR HOTELPRO ACCOUNT</div><div className="dashboard-title-row"><div><h1>My <em>bookings.</em></h1><p className="muted-copy">All your upcoming plans and past stays, in one place.</p></div><button className="btn btn-dark rounded-pill px-4" onClick={() => go("home")}>Find a room ↗</button></div>
      {bookings.length === 0 ? <div className="empty-state"><h3>Your next stay starts here.</h3><p>You don't have any bookings yet.</p><button className="btn btn-dark rounded-pill" onClick={() => go("home")}>Explore rooms</button></div> : <div className="booking-list">{bookings.map(b => <article className="booking-card" key={b._id}><div className="booking-icon">H.</div><div className="booking-main"><div className="booking-id">{b.bookingId}</div><h3>{b.room?.type || "Room"} · {b.room?.roomNumber || "—"}</h3><p>{dateLabel(b.checkIn)} — {dateLabel(b.checkOut)} <span>·</span> {b.numberOfNights} night(s)</p></div><div className="booking-amount"><strong>{money(b.totalAmount)}</strong><span className={`status status-${b.status}`}>{b.status}</span></div>{b.status === "confirmed" && <button className="btn btn-outline-dark rounded-pill cancel-btn" onClick={() => cancelBooking(b._id)}>Cancel booking</button>}</article>)}</div>}
      <div className="payment-note">Payment note: this capstone MVP does not process real payments. Reservations are recorded in the database without charging a card.</div>
      </div></main>}

    {page === "admin" && user?.role === "admin" && <main className="dashboard-page admin-page"><div className="container"><div className="eyebrow"><span className="eyebrow-line"></span> HOTELPRO CONTROL ROOM</div><div className="dashboard-title-row"><div><h1>Admin <em>dashboard.</em></h1><p className="muted-copy">Manage your rooms and keep an eye on reservations.</p></div><button className="btn btn-outline-dark rounded-pill px-4" onClick={loadAdmin}>↻ Refresh data</button></div>
      <div className="stats-grid"><div className="stat-card"><span>ACTIVE ROOMS</span><strong>{rooms.length}</strong><small>Listed for guests</small></div><div className="stat-card"><span>ALL BOOKINGS</span><strong>{allBookings.length}</strong><small>Including cancellations</small></div><div className="stat-card"><span>REGISTERED USERS</span><strong>{users.length}</strong><small>Customer and admin accounts</small></div><div className="stat-card"><span>CONFIRMED</span><strong>{allBookings.filter(b => b.status === "confirmed").length}</strong><small>Current reservations</small></div></div>
      <section className="admin-section"><div className="admin-section-heading"><div><div className="eyebrow">INVENTORY</div><h2>Add a room</h2></div></div><form className="room-form" onSubmit={addRoom}><label>Room number<input required className="form-control" value={roomForm.roomNumber} onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })} placeholder="e.g. 505"/></label><label>Room type<select className="form-select" value={roomForm.type} onChange={e => setRoomForm({ ...roomForm, type: e.target.value })}>{["Standard", "Deluxe", "Suite", "Family"].map(x => <option key={x}>{x}</option>)}</select></label><label>Price / night (₹)<input required type="number" min="1" className="form-control" value={roomForm.pricePerNight} onChange={e => setRoomForm({ ...roomForm, pricePerNight: e.target.value })}/></label><label>Capacity<input required type="number" min="1" max="12" className="form-control" value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })}/></label><label className="wide-field">Description<input required className="form-control" value={roomForm.description} onChange={e => setRoomForm({ ...roomForm, description: e.target.value })} placeholder="Describe the room"/></label><label className="wide-field">Features <span className="optional">(comma separated)</span><input className="form-control" value={roomForm.features} onChange={e => setRoomForm({ ...roomForm, features: e.target.value })}/></label><div className="wide-field"><button className="btn btn-dark rounded-pill px-4" disabled={busy}>+ Add room</button></div></form>
      <div className="admin-section-heading mt-5"><div><div className="eyebrow">ROOM INVENTORY</div><h2>Current rooms</h2></div></div><div className="table-responsive"><table className="table admin-table"><thead><tr><th>Room</th><th>Type</th><th>Price/night</th><th>Capacity</th><th></th></tr></thead><tbody>{rooms.map(r => <tr key={r._id}><td>{r.roomNumber}</td><td>{r.type}</td><td>{money(r.pricePerNight)}</td><td>{r.capacity}</td><td><button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => deactivateRoom(r._id)}>Deactivate</button></td></tr>)}</tbody></table></div></section>
      <section className="admin-section"><div className="admin-section-heading"><div><div className="eyebrow">RESERVATIONS</div><h2>All bookings</h2></div></div><div className="table-responsive"><table className="table admin-table"><thead><tr><th>Booking ID</th><th>Guest</th><th>Room</th><th>Dates</th><th>Amount</th><th>Status</th></tr></thead><tbody>{allBookings.map(b => <tr key={b._id}><td>{b.bookingId}</td><td>{b.user?.name || "—"}<small className="table-sub">{b.user?.email}</small></td><td>{b.room?.type} · {b.room?.roomNumber}</td><td>{dateLabel(b.checkIn)} — {dateLabel(b.checkOut)}</td><td>{money(b.totalAmount)}</td><td><span className={`status status-${b.status}`}>{b.status}</span></td></tr>)}</tbody></table></div></section>
      <section className="admin-section"><div className="admin-section-heading"><div><div className="eyebrow">ACCOUNTS</div><h2>Registered users</h2></div></div><div className="table-responsive"><table className="table admin-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th></tr></thead><tbody>{users.map(u => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.phone || "—"}</td><td><span className="role-pill">{u.role}</span></td><td>{dateLabel(u.createdAt)}</td></tr>)}</tbody></table></div></section>
      </div></main>}

    {page === "admin" && user?.role !== "admin" && <main className="dashboard-page"><div className="container empty-state"><h3>Administrator access required</h3><p>Log in with the configured administrator account.</p><button className="btn btn-dark rounded-pill" onClick={logout}>Log out</button></div></main>}
  </div>;
}

function Footer() {
  return <footer className="site-footer"><div className="container footer-top"><div><button className="brand-button footer-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><span className="brand-mark">H</span><span className="brand-word">hotelpro<span>.</span><small>STAY A LITTLE BETTER</small></span></button><p>Spaces that feel like yours.<br/>Stays that stay with you.</p></div><div className="footer-links"><div><strong>EXPLORE</strong><span>Our rooms</span><span>Our philosophy</span></div><div><strong>THE HOTELPRO WAY</strong><span>Thoughtful comfort</span><span>Easy reservations</span></div></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} HotelPro. College capstone project.</span><span>Made for moments that matter. ✳</span></div></footer>;
}

export default App;
