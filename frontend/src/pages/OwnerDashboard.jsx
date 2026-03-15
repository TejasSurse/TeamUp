import { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

const OwnerDashboard = () => {
    const { user, token, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [turfs, setTurfs] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dateFilter, setDateFilter] = useState('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [editTurf, setEditTurf] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', address: '', city: '', pricePerHour: '', sportTypes: '', images: null });
    const [manualData, setManualData] = useState({ turfId: '', date: '', startTime: '', endTime: '', numberOfPlayers: 2 });
    const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookedSlotsForDaily, setBookedSlotsForDaily] = useState([]);

    // Notification Sound
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
    const prevPendingCount = useRef(0);

    useEffect(() => {
        if (!user || user.role !== 'TurfOwner') { navigate('/login'); return; }
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [turfRes, bookingRes] = await Promise.all([
                api.get('/turfs/owner/me', config),
                api.get('/bookings/owner', config)
            ]);
            setTurfs(turfRes.data);

            const newBookings = bookingRes.data;
            const currentPending = newBookings.filter(b => b.bookingStatus === 'Pending').length;

            if (currentPending > prevPendingCount.current) {
                audioRef.current.play().catch(e => console.log('Sound blocked by browser'));
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'info',
                    title: 'New Booking Request!',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            }
            prevPendingCount.current = currentPending;
            setBookings(newBookings);
        } catch (error) { console.error(error); }
    };

    const fetchSlotsForManual = async (turfId, date) => {
        if (!turfId || !date) return;
        try {
            const { data } = await api.get(`/bookings/slots/${turfId}?date=${date}`);
            setBookedSlotsForDaily(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (activeTab === 'manual' && manualData.turfId && manualData.date) {
            fetchSlotsForManual(manualData.turfId, manualData.date);
        }
    }, [manualData.turfId, manualData.date, activeTab]);

    useEffect(() => {
        if (activeTab === 'daily') {
            // Find a default turf if none selected or just use first
            const tId = turfs[0]?._id;
            if (tId) fetchSlotsForManual(tId, dailyDate);
        }
    }, [dailyDate, activeTab, turfs]);

    const getFilteredBookings = () => {
        if (dateFilter === 'all') return bookings;
        const now = new Date();
        let from, to;
        if (dateFilter === 'today') { from = to = now.toISOString().split('T')[0]; }
        else if (dateFilter === 'month') {
            from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        } else if (dateFilter === 'custom') { from = customFrom; to = customTo; }
        return bookings.filter(b => b.date >= from && b.date <= to);
    };

    const filtered = getFilteredBookings();
    const confirmedBookings = bookings.filter(b => b.bookingStatus === 'Confirmed');
    const pendingBookings = bookings.filter(b => b.bookingStatus === 'Pending');
    const totalRevenue = confirmedBookings.reduce((a, b) => a + b.totalPrice, 0);
    const filteredRevenue = filtered.filter(b => b.bookingStatus === 'Confirmed').reduce((a, b) => a + b.totalPrice, 0);

    const handleBookingAction = async (bookingId, status) => {
        const action = status === 'Confirmed' ? 'accept' : 'reject';
        const result = await Swal.fire({
            title: `${action === 'accept' ? 'Accept' : 'Reject'} this booking?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: status === 'Confirmed' ? '#d32f2f' : '#333',
            confirmButtonText: `Yes, ${action}!`
        });
        if (!result.isConfirmed) return;
        try {
            await api.put(`/bookings/${bookingId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
            Swal.fire({ icon: 'success', title: `Booking ${status}!`, timer: 1500, showConfirmButton: false });
            fetchData();
        } catch (err) { Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Error' }); }
    };

    const handleBlockUser = async (userId, currentlyBlocked) => {
        const action = currentlyBlocked ? 'unblock' : 'block';
        const result = await Swal.fire({
            title: `${action === 'block' ? 'Block' : 'Unblock'} this user?`,
            text: action === 'block' ? 'Blocked users cannot make new bookings.' : 'This user will be able to book again.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            confirmButtonText: `Yes, ${action}!`
        });
        if (!result.isConfirmed) return;
        try {
            await api.put(`/users/${userId}/block`, {}, { headers: { Authorization: `Bearer ${token}` } });
            Swal.fire({ icon: 'success', title: `User ${action}ed!`, timer: 1500, showConfirmButton: false });
            fetchData();
        } catch (err) { Swal.fire({ icon: 'error', title: 'Failed' }); }
    };

    const handleFileChange = (e) => setFormData({ ...formData, images: e.target.files });
    const resetForm = () => { setFormData({ name: '', description: '', address: '', city: '', pricePerHour: '', sportTypes: '', images: null }); setEditTurf(null); };

    const handleAddTurf = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let imageUrls = editTurf?.images || [];
            if (formData.images && formData.images.length > 0) {
                if (formData.images.length > 4) { Swal.fire({ icon: 'warning', title: 'Max 4 images' }); setUploading(false); return; }
                const imageForm = new FormData();
                for (let i = 0; i < formData.images.length; i++) imageForm.append('images', formData.images[i]);
                const uploadRes = await api.post('/upload', imageForm, {
                    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
                });
                imageUrls = uploadRes.data.urls;
            }
            const payload = {
                name: formData.name, description: formData.description,
                location: { address: formData.address, city: formData.city },
                pricePerHour: Number(formData.pricePerHour),
                sportTypes: formData.sportTypes.split(',').map(s => s.trim()), images: imageUrls
            };
            if (editTurf) { await api.put(`/turfs/${editTurf._id}`, payload, { headers: { Authorization: `Bearer ${token}` } }); }
            else { await api.post('/turfs', payload, { headers: { Authorization: `Bearer ${token}` } }); }
            Swal.fire({ icon: 'success', title: editTurf ? 'Turf Updated!' : 'Turf Added!', timer: 1500, showConfirmButton: false });
            setShowAddForm(false); resetForm(); fetchData();
        } catch (err) { Swal.fire({ icon: 'error', title: 'Failed' }); }
        finally { setUploading(false); }
    };

    const startEdit = (t) => {
        setFormData({ name: t.name, description: t.description || '', address: t.location?.address || '', city: t.location?.city || '', pricePerHour: t.pricePerHour, sportTypes: t.sportTypes?.join(', ') || '', images: null });
        setEditTurf(t); setShowAddForm(true); setActiveTab('turfs');
    };

    const handleDeleteTurf = async (id) => {
        const r = await Swal.fire({ title: 'Delete this turf?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d32f2f', confirmButtonText: 'Delete' });
        if (!r.isConfirmed) return;
        try { await api.delete(`/turfs/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchData(); }
        catch (err) { Swal.fire({ icon: 'error', title: 'Failed' }); }
    };

    const handleManualBooking = async (e) => {
        e.preventDefault();
        const turf = turfs.find(t => t._id === manualData.turfId);
        if (!turf) return;
        const s = parseInt(manualData.startTime), en = parseInt(manualData.endTime);
        if (en <= s) return Swal.fire({ icon: 'error', title: 'Invalid time' });
        const totalPrice = turf.pricePerHour * (en - s);
        try {
            await api.post('/bookings', {
                turfId: manualData.turfId, date: manualData.date, startTime: String(s), endTime: String(en),
                totalPrice, numberOfPlayers: manualData.numberOfPlayers
            }, { headers: { Authorization: `Bearer ${token}` } });
            Swal.fire({ icon: 'success', title: 'Walk-in Booked!', html: `<p>Total: ₹${totalPrice}</p>`, confirmButtonColor: '#d32f2f' });
            setManualData({ turfId: '', date: '', startTime: '', endTime: '', numberOfPlayers: 2 }); fetchData();
        } catch (err) { Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Slot may be taken.' }); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };
    if (!user || user.role !== 'TurfOwner') return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-pie' },
        { id: 'requests', label: 'Requests', icon: 'fa-solid fa-bell', count: pendingBookings.length },
        { id: 'turfs', label: 'My Turfs', icon: 'fa-solid fa-stadium' },
        { id: 'bookings', label: 'Bookings', icon: 'fa-solid fa-calendar-check' },
        { id: 'daily', label: 'Daily View', icon: 'fa-solid fa-calendar-day' },
        { id: 'revenue', label: 'Revenue', icon: 'fa-solid fa-indian-rupee-sign' },
        { id: 'manual', label: 'Walk-in', icon: 'fa-solid fa-ticket' }
    ];

    const statusBadge = (s) => {
        const map = {
            Confirmed: 'bg-green-100 text-green-700 border-green-200',
            Pending: 'bg-amber-100 text-amber-700 border-amber-200',
            Rejected: 'bg-rose-100 text-rose-700 border-rose-200',
            Cancelled: 'bg-gray-100 text-gray-600 border-gray-200'
        };
        return map[s] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="min-h-screen flex bg-rose-50/20">
            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Redesigned Sidebar */}
            <aside className={`fixed lg:sticky top-0 left-0 z-50 w-72 bg-gray-900 text-white flex flex-col h-screen transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-xl shadow-lg rotate-12">
                            <i className="fa-solid fa-futbol"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tighter">TEAM<span className="text-primary">UP</span></h2>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Owner Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-grow px-4 space-y-2 overflow-y-auto">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
                            className={`w-full group px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-between transition-all duration-300
                                ${activeTab === t.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>
                            <div className="flex items-center gap-4">
                                <i className={`${t.icon} text-lg ${activeTab === t.id ? 'text-white' : 'text-gray-600 group-hover:text-primary'}`}></i>
                                <span>{t.label}</span>
                            </div>
                            {t.count > 0 && (
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${activeTab === t.id ? 'bg-white text-primary' : 'bg-primary text-white animate-bounce'}`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-6 mt-auto border-t border-white/5">
                    <div className="bg-white/5 p-4 rounded-3xl flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-black">
                            {user.name?.[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-black text-xs truncate uppercase tracking-wider">{user.name}</p>
                            <p className="text-gray-500 text-[10px] font-bold">{user.phone}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                        <i className="fa-solid fa-power-off mr-2"></i> Logout
                    </button>
                </div>
            </aside>

            <main className="flex-grow min-w-0">
                {/* Mobile Header */}
                <div className="lg:hidden bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    <button onClick={() => setSidebarOpen(true)} className="text-2xl text-gray-900"><i className="fa-solid fa-bars-staggered"></i></button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs rotate-12">
                            <i className="fa-solid fa-futbol"></i>
                        </div>
                        <span className="font-black tracking-tighter">TEAM<span className="text-primary">UP</span></span>
                    </div>
                    <div className="w-8 relative">
                        {pendingBookings.length > 0 && <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">!</span>}
                    </div>
                </div>

                <div className="p-6 md:p-10">
                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div>
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900">Dashboard Metrics</h1>
                                <p className="text-gray-500 mt-2 font-medium">Detailed overview of your turf performance.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                {[
                                    { label: 'Total Revenue', value: `₹${totalRevenue}`, icon: 'fa-solid fa-money-bill-trend-up', color: 'border-primary', bg: 'bg-rose-50', text: 'text-primary' },
                                    { label: 'Confirmed', value: confirmedBookings.length, icon: 'fa-solid fa-calendar-check', color: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
                                    { label: 'Pending', value: pendingBookings.length, icon: 'fa-solid fa-hourglass-half', color: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
                                    { label: 'Your Turfs', value: turfs.length, icon: 'fa-solid fa-stadium', color: 'border-green-500', bg: 'bg-green-50', text: 'text-green-600' }
                                ].map((s, i) => (
                                    <div key={i} className={`bg-white rounded-3xl p-6 shadow-sm border-b-4 ${s.color} hover:shadow-xl transition-all`}>
                                        <div className={`w-12 h-12 ${s.bg} ${s.text} rounded-2xl flex items-center justify-center text-2xl mb-4`}>
                                            <i className={s.icon}></i>
                                        </div>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                                        <p className={`text-2xl font-black mt-1 text-gray-900`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {pendingBookings.length > 0 && (
                                <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    <div className="flex items-center gap-6 relative z-10 text-center md:text-left">
                                        <div className="w-16 h-16 bg-primary text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl animate-bounce">
                                            <i className="fa-solid fa-bell"></i>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900">New Requests Awaiting!</h3>
                                            <p className="text-gray-500 font-medium">You have {pendingBookings.length} bookings waiting for your approval.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveTab('requests')} className="bg-primary text-white px-10 py-4 rounded-2xl font-black hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 relative z-10 uppercase tracking-widest text-xs">
                                        Review Now
                                    </button>
                                </div>
                            )}

                            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
                                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                        <i className="fa-solid fa-clock-rotate-left text-primary"></i>
                                        Recent Activity
                                    </h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50/50 border-b">
                                                <th className="p-6">Turf</th>
                                                <th className="p-6">Customer</th>
                                                <th className="p-6">Schedule</th>
                                                <th className="p-6">Amount</th>
                                                <th className="p-6">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {bookings.slice(0, 8).map(b => (
                                                <tr key={b._id} className="hover:bg-rose-50/30 transition-colors">
                                                    <td className="p-6 font-black text-gray-900">{b.turf?.name}</td>
                                                    <td className="p-6">
                                                        <p className="font-bold text-gray-800">{b.user?.name || 'Walk-in'}</p>
                                                        <p className="text-xs text-gray-400">{b.user?.phone || 'Manual'}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <p className="font-bold text-gray-700">{b.date}</p>
                                                        <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{b.startTime}:00–{b.endTime}:00</p>
                                                    </td>
                                                    <td className="p-6 font-black text-gray-900 text-lg">₹{b.totalPrice}</td>
                                                    <td className="p-6">
                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusBadge(b.bookingStatus)}`}>
                                                            {b.bookingStatus}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REQUESTS */}
                    {activeTab === 'requests' && (
                        <div>
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900">Pending Requests</h1>
                                <p className="text-gray-500 mt-2 font-medium">Manage incoming booking requests from customers.</p>
                            </div>

                            {pendingBookings.length === 0 ? (
                                <div className="bg-white rounded-[3rem] shadow-xl p-20 text-center border border-dashed border-gray-200">
                                    <div className="w-24 h-24 bg-green-50 text-green-300 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
                                        <i className="fa-solid fa-circle-check"></i>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">Great job!</h3>
                                    <p className="text-gray-500 font-medium mt-2">No pending requests to resolve right now.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {pendingBookings.map(b => (
                                        <div key={b._id} className="bg-white rounded-[2rem] shadow-xl p-8 border-l-[12px] border-amber-400 transition-all hover:scale-[1.01]">
                                            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Awaiting Approval</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">{b.turf?.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-16 h-16 bg-rose-50 text-primary rounded-2xl flex items-center justify-center text-2xl font-black">
                                                            {b.user?.name?.[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-2xl font-black text-gray-900">{b.user?.name}</h3>
                                                            <p className="text-sm text-gray-500 font-medium">Customer ID: #{b.user?._id?.slice(-6).toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8 p-6 bg-gray-50 rounded-3xl">
                                                        <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Phone</p><p className="font-bold text-gray-900">{b.user?.phone}</p></div>
                                                        <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Date</p><p className="font-bold text-gray-900">{b.date}</p></div>
                                                        <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Time</p><p className="font-bold text-primary">{b.startTime}:00 – {b.endTime}:00</p></div>
                                                        <div><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Cost</p><p className="font-black text-gray-900 text-lg">₹{b.totalPrice}</p></div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                                                    <button onClick={() => handleBookingAction(b._id, 'Confirmed')}
                                                        className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-green-700 transition shadow-lg shadow-green-600/20 active:scale-95">
                                                        <i className="fa-solid fa-check mr-2"></i> Confirm
                                                    </button>
                                                    <button onClick={() => handleBookingAction(b._id, 'Rejected')}
                                                        className="bg-white text-rose-500 border-2 border-rose-100 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-50 transition active:scale-95">
                                                        <i className="fa-solid fa-xmark mr-2"></i> Reject
                                                    </button>
                                                    <button onClick={() => handleBlockUser(b.user?._id, b.user?.isBlocked)}
                                                        className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
                                                            ${b.user?.isBlocked ? 'bg-gray-900 text-white' : 'bg-orange-50 text-orange-600 border-2 border-orange-100 hover:bg-orange-100'}`}>
                                                        {b.user?.isBlocked ? 'Unlock User' : '🚫 Block User'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MY TURFS */}
                    {activeTab === 'turfs' && (
                        <div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-gray-900">Your Venue Fleet</h1>
                                    <p className="text-gray-500 mt-2 font-medium">Manage listings, pricing, and visibility.</p>
                                </div>
                                <button onClick={() => { setShowAddForm(!showAddForm); if (showAddForm) resetForm(); }}
                                    className={`px-8 py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center gap-3
                                        ${showAddForm ? 'bg-gray-900 text-white' : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'}`}>
                                    {showAddForm ? <><i className="fa-solid fa-xmark"></i> Close Form</> : <><i className="fa-solid fa-plus"></i> Add New Turf</>}
                                </button>
                            </div>

                            {showAddForm && (
                                <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 mb-12 border-2 border-primary/5 animate-slideUp">
                                    <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-primary text-lg">
                                            <i className="fa-solid fa-file-pen"></i>
                                        </div>
                                        {editTurf ? 'Update Venue Details' : 'Register New Turf'}
                                    </h2>
                                    <form onSubmit={handleAddTurf} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turf Identity</label>
                                            <div className="relative">
                                                <i className="fa-solid fa-stadium absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                                                <input type="text" placeholder="Venue Name" className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary outline-none transition-all font-bold text-gray-700" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location City</label>
                                            <div className="relative">
                                                <i className="fa-solid fa-map-location-dot absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                                                <input type="text" placeholder="e.g. Mumbai" className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary outline-none transition-all font-bold text-gray-700" required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Complete Address</label>
                                            <div className="relative">
                                                <i className="fa-solid fa-location-dot absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                                                <input type="text" placeholder="Full street address..." className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary outline-none transition-all font-bold text-gray-700" required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Story / Description</label>
                                            <textarea placeholder="Describe the pitch, amenities, rules..." className="w-full p-8 bg-gray-50 border-2 border-transparent rounded-[2.5rem] focus:bg-white focus:border-primary outline-none transition-all font-bold text-gray-700 min-h-[150px]" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hourly Pricing (₹)</label>
                                            <div className="relative">
                                                <i className="fa-solid fa-indian-rupee-sign absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black"></i>
                                                <input type="number" placeholder="0.00" className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary outline-none transition-all font-black text-xl text-primary" required value={formData.pricePerHour} onChange={e => setFormData({ ...formData, pricePerHour: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Available Sports</label>
                                            <div className="relative">
                                                <i className="fa-solid fa-medal absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                                                <input type="text" placeholder="Football, Cricket..." className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary outline-none transition-all font-bold text-gray-700" required value={formData.sportTypes} onChange={e => setFormData({ ...formData, sportTypes: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gallery (Max 4)</label>
                                            <div className="p-8 border-4 border-dashed border-gray-100 rounded-[2.5rem] text-center hover:border-primary/20 transition-all cursor-pointer relative bg-gray-50/50">
                                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                <div className="space-y-2">
                                                    <i className="fa-solid fa-cloud-arrow-up text-4xl text-gray-200"></i>
                                                    <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Drop images or click to browse</p>
                                                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Recommended size: 1200x800px</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 pt-4">
                                            <button type="submit" disabled={uploading} className="w-full bg-primary text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-primary-dark disabled:bg-gray-400 transition-all shadow-2xl shadow-primary/40 flex items-center justify-center gap-3">
                                                {uploading ? <><i className="fa-solid fa-spinner animate-spin"></i> Processing...</> : <><i className={`fa-solid ${editTurf ? 'fa-pen-to-square' : 'fa-rocket'}`}></i> {editTurf ? 'Update Listing' : 'Go Live Now'}</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {turfs.map(t => (
                                    <div key={t._id} className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden group border border-gray-50">
                                        <div className="h-60 relative overflow-hidden">
                                            {t.images?.[0] ? <img src={t.images[0]} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                                : <div className="flex items-center justify-center h-full bg-rose-50 text-rose-200 text-5xl font-black"><i className="fa-solid fa-images"></i></div>}
                                            <div className="absolute top-6 right-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${t.status === 'Active' ? 'bg-green-500 text-white' : 'bg-rose-500 text-white'}`}>{t.status}</span>
                                            </div>
                                        </div>
                                        <div className="p-8">
                                            <div className="mb-6">
                                                <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors">{t.name}</h3>
                                                <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-widest flex items-center gap-2">
                                                    <i className="fa-solid fa-location-dot text-rose-300"></i>
                                                    {t.location?.city} • ₹{t.pricePerHour}/hr
                                                </p>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => startEdit(t)} className="flex-1 bg-indigo-50 text-indigo-600 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                                                    <i className="fa-solid fa-sliders mr-2"></i> Manage
                                                </button>
                                                <button onClick={() => handleDeleteTurf(t._id)} className="w-14 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center">
                                                    <i className="fa-solid fa-trash-can"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {turfs.length === 0 && (
                                    <div className="col-span-3 text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                                        <i className="fa-solid fa-stadium text-5xl text-gray-100 mb-4 block"></i>
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No active listings in your portfolio.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Additional sections follow similar pattern... BOOKINGS, REVENUE, MANUAL */}
                    {/* (Truncated for space, assume styling remains consistent with above patterns) */}

                    {activeTab === 'bookings' && (
                        <div>
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900">Booking Management</h1>
                                <p className="text-gray-500 mt-2 font-medium">History of all transactions and reservations.</p>
                            </div>
                            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50/50 border-b">
                                                <th className="p-6">Client / Phone</th>
                                                <th className="p-6">Venue</th>
                                                <th className="p-6">Session Details</th>
                                                <th className="p-6">Transaction</th>
                                                <th className="p-6">Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {bookings.map(b => (
                                                <tr key={b._id} className="hover:bg-rose-50/30 transition-colors">
                                                    <td className="p-6">
                                                        <p className="font-black text-gray-900">{b.user?.name || 'Walk-in'}</p>
                                                        <p className="text-xs text-gray-500 font-bold">{b.user?.phone || 'Manual Entry'}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <p className="font-bold text-gray-900">{b.turf?.name}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <p className="font-bold text-gray-800 tracking-tight">{b.date}</p>
                                                        <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{b.startTime}:00–{b.endTime}:00</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <p className="font-black text-gray-900 text-lg">₹{b.totalPrice}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusBadge(b.bookingStatus)}`}>
                                                            {b.bookingStatus}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'daily' && (
                        <div>
                            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-gray-900">Daily Schedule</h1>
                                    <p className="text-gray-500 mt-2 font-medium">Visual timeline of bookings for the day.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="date"
                                        value={dailyDate}
                                        onChange={(e) => setDailyDate(e.target.value)}
                                        className="p-4 bg-white border-2 border-gray-100 rounded-2xl font-black text-gray-700 outline-none focus:border-primary shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                {turfs.map(t => (
                                    <div key={t._id} className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                                <i className="fa-solid fa-stadium text-primary/30"></i>
                                                {t.name}
                                            </h3>
                                        </div>

                                        <div className="relative">
                                            <div className="flex overflow-x-auto pb-6 gap-2 no-scrollbar">
                                                {Array.from({ length: 18 }, (_, i) => i + 6).map(h => {
                                                    const bookingsForThisTurf = bookings.filter(b => b.turf?._id === t._id && b.date === dailyDate && b.bookingStatus === 'Confirmed');
                                                    const booking = bookingsForThisTurf.find(b => parseInt(b.startTime) <= h && parseInt(b.endTime) > h);

                                                    return (
                                                        <div key={h} className="flex-shrink-0 w-24">
                                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">{h}:00</div>
                                                            <div className={`h-24 rounded-2xl flex items-center justify-center p-2 text-center transition-all border-2
                                                                ${booking ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-300 border-dashed border-gray-200'}`}>
                                                                {booking ? (
                                                                    <div className="overflow-hidden">
                                                                        <p className="font-black text-[10px] leading-tight truncate">{booking.user?.name || 'Walk-in'}</p>
                                                                        <p className="text-[8px] opacity-80 font-bold mt-1 uppercase tracking-tighter">#{booking._id.slice(-4)}</p>
                                                                    </div>
                                                                ) : (
                                                                    <i className="fa-solid fa-plus text-xs"></i>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {turfs.length === 0 && (
                                    <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Register a turf to see daily schedules.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'revenue' && (
                        <div>
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900">Revenue Stream</h1>
                                <p className="text-gray-500 mt-2 font-medium">Track your earnings and filtered analytics.</p>
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm p-6 mb-10 border border-gray-100 flex items-center gap-4 flex-wrap">
                                {[{ l: 'Full Lifetime', v: 'all' }, { l: 'Today', v: 'today' }, { l: 'Current Month', v: 'month' }, { l: 'Custom Span', v: 'custom' }].map(f => (
                                    <button key={f.v} onClick={() => setDateFilter(f.v)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === f.v ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{f.l}</button>
                                ))}
                                {dateFilter === 'custom' && (
                                    <div className="flex items-center gap-2 animate-slideIn">
                                        <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="p-3 bg-gray-50 border-none rounded-2xl text-xs font-bold font-primary focus:ring-2 focus:ring-primary/20" />
                                        <span className="text-gray-300 font-black">-</span>
                                        <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="p-3 bg-gray-50 border-none rounded-2xl text-xs font-bold font-primary focus:ring-2 focus:ring-primary/20" />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-b-8 border-primary">
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Targeted Period</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-black text-gray-400 tracking-widest">INR</span>
                                        <p className="text-5xl font-black text-primary tracking-tighter">{filteredRevenue.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-b-8 border-indigo-500">
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Lifetime Gross</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-black text-gray-400 tracking-widest">INR</span>
                                        <p className="text-5xl font-black text-indigo-600 tracking-tighter">{totalRevenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'manual' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-12">
                                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl rotate-12">
                                    <i className="fa-solid fa-ticket"></i>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">Walk-in Registry</h1>
                                <p className="text-gray-500 mt-2 font-medium">Quickly book slots for onsite customers.</p>
                            </div>

                            <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 border border-gray-50 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                                <form onSubmit={handleManualBooking} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Turf</label>
                                        <div className="relative">
                                            <i className="fa-solid fa-stadium absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                                            <select required value={manualData.turfId} onChange={e => setManualData({ ...manualData, turfId: e.target.value })} className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary outline-none transition-all font-black text-gray-700 appearance-none">
                                                <option value="">-- Choose Venue --</option>{turfs.map(t => <option key={t._id} value={t._id}>{t.name} (₹{t.pricePerHour}/hr)</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Date</label>
                                        <div className="relative">
                                            <i className="fa-solid fa-calendar absolute left-5 top-1/2 -translate-y-1/2 text-primary"></i>
                                            <input type="date" required className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary outline-none transition-all font-black text-gray-700" value={manualData.date} onChange={e => setManualData({ ...manualData, date: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estimated Players</label>
                                        <div className="relative">
                                            <i className="fa-solid fa-user-group absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                                            <input type="number" min="1" className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary outline-none transition-all font-black text-gray-700" value={manualData.numberOfPlayers} onChange={e => setManualData({ ...manualData, numberOfPlayers: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Live Availability Checklist</label>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2">
                                            {Array.from({ length: 18 }, (_, i) => i + 6).map(h => {
                                                const isBooked = bookedSlotsForDaily.some(slot => h >= parseInt(slot.startTime) && h < parseInt(slot.endTime));
                                                return (
                                                    <div key={h} className={`text-center py-3 rounded-xl text-[10px] font-black transition-all border-2
                                                        ${isBooked ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                        {h}:00
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold flex items-center gap-2">
                                            <i className="fa-solid fa-circle-info text-primary"></i>
                                            Green slots are available. Gray slots are already booked.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kickoff Time</label>
                                        <div className="relative">
                                            <i className="fa-solid fa-clock absolute left-5 top-1/2 -translate-y-1/2 text-primary"></i>
                                            <select required className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary outline-none transition-all font-black text-gray-700 appearance-none" value={manualData.startTime} onChange={e => setManualData({ ...manualData, startTime: e.target.value })}>
                                                <option value="">-- Start --</option>{Array.from({ length: 17 }, (_, i) => i + 6).map(h => <option key={h} value={h}>{h}:00</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Final Whistle</label>
                                        <div className="relative">
                                            <i className="fa-solid fa-stopwatch absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                                            <select required className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary outline-none transition-all font-black text-gray-700 appearance-none" value={manualData.endTime} onChange={e => setManualData({ ...manualData, endTime: e.target.value })}>
                                                <option value="">-- End --</option>{manualData.startTime && Array.from({ length: 23 - parseInt(manualData.startTime) }, (_, i) => parseInt(manualData.startTime) + i + 1).map(h => <option key={h} value={h}>{h}:00</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {manualData.turfId && manualData.startTime && manualData.endTime && (
                                        <div className="md:col-span-2 bg-rose-50 p-8 rounded-[2rem] border-2 border-primary/10 flex items-center justify-between">
                                            <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Total to Collect:</span>
                                            <span className="text-3xl font-black text-primary">₹{(turfs.find(t => t._id === manualData.turfId)?.pricePerHour || 0) * (parseInt(manualData.endTime) - parseInt(manualData.startTime))}</span>
                                        </div>
                                    )}
                                    <div className="md:col-span-2">
                                        <button type="submit" className="w-full bg-primary text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-primary-dark transition-all shadow-2xl shadow-primary/30 active:scale-95">
                                            Finalize Booking
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OwnerDashboard;
