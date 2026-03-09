import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

const SuperAdminDashboard = () => {
    const { user, token, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [usersList, setUsersList] = useState([]);
    const [turfs, setTurfs] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'SuperAdmin') { navigate('/login'); return; }
        fetchData();
        const interval = setInterval(fetchData, 60000); // 1 min refresh for stats
        return () => clearInterval(interval);
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [usersRes, turfsRes, bookingsRes] = await Promise.all([
                api.get('/users', config),
                api.get('/turfs', config),
                api.get('/bookings', config)
            ]);
            setUsersList(usersRes.data);
            setTurfs(turfsRes.data);
            setBookings(bookingsRes.data);
        } catch (error) { console.error(error); }
    };

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
    const totalRevenue = bookings.reduce((a, b) => a + (b.totalPrice || 0), 0);
    const filteredRevenue = filtered.reduce((a, b) => a + (b.totalPrice || 0), 0);

    const deleteUser = async (id) => {
        const result = await Swal.fire({
            title: 'Delete this user?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            confirmButtonText: 'Yes, Delete'
        });
        if (!result.isConfirmed) return;
        try {
            await api.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            Swal.fire('Deleted!', 'User has been removed.', 'success');
            fetchData();
        } catch (e) { Swal.fire('Error', 'Failed to delete user', 'error'); }
    };

    const deleteTurf = async (id) => {
        const result = await Swal.fire({
            title: 'Remove this venue?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            confirmButtonText: 'Yes, Remove'
        });
        if (!result.isConfirmed) return;
        try {
            await api.delete(`/turfs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            Swal.fire('Removed!', 'Turf listing deleted.', 'success');
            fetchData();
        } catch (e) { Swal.fire('Error', 'Failed to remove turf', 'error'); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    if (!user || user.role !== 'SuperAdmin') return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'fa-solid fa-gauge-high' },
        { id: 'users', label: 'Network Users', icon: 'fa-solid fa-users-gear' },
        { id: 'turfs', label: 'Venues', icon: 'fa-solid fa-stadium' },
        { id: 'bookings', label: 'All Activity', icon: 'fa-solid fa-list-check' },
        { id: 'revenue', label: 'Global Revenue', icon: 'fa-solid fa-money-bill-trend-up' }
    ];

    const roleColor = (r) => {
        const map = {
            SuperAdmin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            TurfOwner: 'bg-amber-100 text-amber-700 border-amber-200',
            Customer: 'bg-primary/10 text-primary border-primary/20'
        };
        return map[r] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="min-h-screen flex bg-rose-50/20">
            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Premium Sidebar */}
            <aside className={`fixed lg:sticky top-0 left-0 z-50 w-72 bg-gray-950 text-white flex flex-col h-screen transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg rotate-12">
                            <i className="fa-solid fa-bolt"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tighter uppercase italic">TeamUp</h2>
                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Main Controller</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-grow px-4 space-y-2 overflow-y-auto mt-4">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
                            className={`w-full group px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-4 transition-all duration-300
                                ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>
                            <i className={`${t.icon} text-lg ${activeTab === t.id ? 'text-white' : 'text-gray-600 group-hover:text-indigo-400'}`}></i>
                            <span>{t.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/5">
                    <div className="bg-white/5 p-4 rounded-3xl flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black">
                            {user.name?.[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-black text-xs truncate uppercase tracking-widest">{user.name}</p>
                            <p className="text-gray-500 text-[10px] font-bold">God Mode</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                        <i className="fa-solid fa-power-off mr-2"></i> Shutdown
                    </button>
                </div>
            </aside>

            <main className="flex-grow min-w-0">
                {/* Mobile Header */}
                <div className="lg:hidden bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    <button onClick={() => setSidebarOpen(true)} className="text-2xl text-gray-900"><i className="fa-solid fa-bars-staggered"></i></button>
                    <div className="flex items-center gap-2 font-black tracking-tighter italic">TEAMUP <span className="text-indigo-600">HQ</span></div>
                    <div className="w-8"></div>
                </div>

                <div className="p-6 md:p-10">
                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div>
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">System Intel</h1>
                                <p className="text-gray-500 font-medium text-lg mt-1">Platform-wide performance and user acquisition.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                {[
                                    { label: 'Network Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: 'fa-solid fa-coins', color: 'indigo' },
                                    { label: 'Global Bookings', value: bookings.length, icon: 'fa-solid fa-calendar-check', color: 'primary' },
                                    { label: 'Onboarded Venues', value: turfs.length, icon: 'fa-solid fa-stadium', color: 'green' },
                                    { label: 'Total Members', value: usersList.length, icon: 'fa-solid fa-users', color: 'amber' }
                                ].map((s, i) => (
                                    <div key={i} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 group">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 transition-transform
                                            ${s.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                                s.color === 'primary' ? 'bg-rose-50 text-primary' :
                                                    s.color === 'green' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                            <i className={s.icon}></i>
                                        </div>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                                        <p className="text-3xl font-black text-gray-900 mt-1 tracking-tighter">{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-50">
                                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                        <h2 className="font-black text-gray-900 text-xl uppercase tracking-widest flex items-center gap-2 italic">
                                            <i className="fa-solid fa-bolt-lightning text-amber-500"></i>
                                            Live Transactions
                                        </h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50/50">
                                                    <th className="p-6">Venue / Customer</th>
                                                    <th className="p-6 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {bookings.slice(0, 5).map(b => (
                                                    <tr key={b._id} className="hover:bg-rose-50/30 transition-colors group">
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/10">
                                                                    <i className="fa-solid fa-stadium text-lg"></i>
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-gray-900 text-xs">{b.turf?.name || 'Deleted Venue'}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{b.user?.name || 'Guest User'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <p className="font-black text-indigo-600">₹{b.totalPrice}</p>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{b.date}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-50">
                                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                        <h2 className="font-black text-gray-900 text-xl uppercase tracking-widest flex items-center gap-2 italic">
                                            <i className="fa-solid fa-user-plus text-indigo-600"></i>
                                            New Recruits
                                        </h2>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {usersList.slice(0, 6).map(u => (
                                            <div key={u._id} className="flex justify-between items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-lg font-black shadow-sm">
                                                        {u.name?.[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">{u.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold tracking-widest">{u.phone}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${roleColor(u.role)}`}>
                                                    {u.role}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS */}
                    {activeTab === 'users' && (
                        <div>
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">Active Accounts</h1>
                                <p className="text-gray-500 font-medium text-lg mt-1">Total {usersList.length} registered members.</p>
                            </div>
                            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-50">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50/50">
                                                <th className="p-6">Member Identity</th>
                                                <th className="p-6">Status / Role</th>
                                                <th className="p-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {usersList.map(u => (
                                                <tr key={u._id} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400">{u.name?.[0].toUpperCase()}</div>
                                                            <div>
                                                                <p className="font-black text-gray-900">{u.name}</p>
                                                                <p className="text-xs text-gray-400 font-bold tracking-widest">{u.phone}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${roleColor(u.role)}`}>{u.role}</span>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        {u.role !== 'SuperAdmin' && (
                                                            <button onClick={() => deleteUser(u._id)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                                                                <i className="fa-solid fa-trash"></i>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TURFS */}
                    {activeTab === 'turfs' && (
                        <div>
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">Venue Console</h1>
                                <p className="text-gray-500 font-medium text-lg mt-1">Managing {turfs.length} sport complexes.</p>
                            </div>
                            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-50">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50/50">
                                                <th className="p-6">Venue details</th>
                                                <th className="p-6">Rate / City</th>
                                                <th className="p-6">Status</th>
                                                <th className="p-6 text-right">Operations</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {turfs.map(t => (
                                                <tr key={t._id} className="hover:bg-primary/5 transition-colors">
                                                    <td className="p-6">
                                                        <p className="font-black text-gray-900">{t.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{t.owner?.name || 'Managed'}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <p className="font-black text-indigo-600">₹{t.pricePerHour}/hr</p>
                                                        <p className="text-xs text-gray-400 font-medium">{t.location?.city}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${t.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <button onClick={() => deleteTurf(t._id)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                                                            <i className="fa-solid fa-trash-can"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div>
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">Global Log</h1>
                                <p className="text-gray-500 font-medium text-lg mt-1">Full transaction history for the Entire Network.</p>
                            </div>
                            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50/50">
                                                <th className="p-6">Session ID</th>
                                                <th className="p-6">Venue / Customer</th>
                                                <th className="p-6">Financials</th>
                                                <th className="p-6">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {bookings.map(b => (
                                                <tr key={b._id} className="hover:bg-rose-50/30 transition-colors">
                                                    <td className="p-6">
                                                        <span className="text-[10px] font-black text-gray-300 uppercase">#{b._id.slice(-8).toUpperCase()}</span>
                                                    </td>
                                                    <td className="p-6">
                                                        <p className="font-black text-gray-900 text-xs">{b.turf?.name || 'Removed'}</p>
                                                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">{b.user?.name || 'Walk-in'}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <p className="font-black text-indigo-600 text-lg">₹{b.totalPrice}</p>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{b.date}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${b.bookingStatus === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-500'}`}>{b.bookingStatus}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'revenue' && (
                        <div>
                            <div className="mb-10">
                                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">Treasury Analytics</h1>
                                <p className="text-gray-500 font-medium text-lg mt-1">Platform-wide revenue stream monitoring.</p>
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm p-6 mb-12 border border-gray-100 flex items-center gap-4 flex-wrap">
                                {[{ l: 'PLATFORM LIFE', v: 'all' }, { l: '24HR WINDOW', v: 'today' }, { l: 'BILLING CYCLE', v: 'month' }, { l: 'CUSTOM RANGE', v: 'custom' }].map(f => (
                                    <button key={f.v} onClick={() => setDateFilter(f.v)}
                                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === f.v ? 'bg-gray-950 text-white shadow-2xl' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{f.l}</button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-b-[12px] border-green-500 relative overflow-hidden group">
                                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                                    <div className="relative z-10">
                                        <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-4 italic">Segment Performance</p>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-xl font-bold text-gray-300">₹</span>
                                            <p className="text-6xl font-black text-gray-900 tracking-tighter">{filteredRevenue.toLocaleString()}</p>
                                        </div>
                                        <p className="text-xs text-gray-400 font-bold mt-4 uppercase tracking-widest">Across {filtered.length} successful bookings</p>
                                    </div>
                                </div>
                                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-b-[12px] border-indigo-600 relative overflow-hidden group">
                                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                                    <div className="relative z-10">
                                        <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest mb-4 italic">Total Asset Value</p>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-xl font-bold text-gray-300">₹</span>
                                            <p className="text-6xl font-black text-indigo-600 tracking-tighter">{totalRevenue.toLocaleString()}</p>
                                        </div>
                                        <p className="text-xs text-gray-400 font-bold mt-4 uppercase tracking-widest">Network Maturity Index: High</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
