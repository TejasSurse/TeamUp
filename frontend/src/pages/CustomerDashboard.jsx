import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import api from '../services/api';

const CustomerDashboard = () => {
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        const fetchMyBookings = async () => {
            try {
                const { data } = await api.get('/bookings/mybookings', { headers: { Authorization: `Bearer ${token}` } });
                setBookings(data);
            } catch (error) { console.error(error); }
        };
        fetchMyBookings();
    }, [user, token, navigate]);

    if (!user) return null;

    const totalSpent = bookings.filter(b => b.bookingStatus === 'Confirmed').reduce((a, b) => a + b.totalPrice, 0);
    const confirmed = bookings.filter(b => b.bookingStatus === 'Confirmed').length;
    const pending = bookings.filter(b => b.bookingStatus === 'Pending').length;

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
        <div className="min-h-screen flex flex-col bg-rose-50/30 pb-20 lg:pb-0">
            <Navbar />
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-6 md:py-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900">
                                Hey, <span className="text-primary">{user.name}</span>! <i className="fa-solid fa-hand-wave animate-bounce inline-block"></i>
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">Ready for your next game?</p>
                        </div>
                        <button
                            onClick={() => navigate('/turfs')}
                            className="bg-primary text-white px-8 py-3 rounded-2xl font-black hover:bg-primary-dark transition-all shadow-lg hover:shadow-primary/30 flex items-center gap-2 group"
                        >
                            <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i>
                            New Booking
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-primary">
                            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-primary mb-3">
                                <i className="fa-solid fa-hashtag text-xl"></i>
                            </div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{bookings.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-indigo-500">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-3">
                                <i className="fa-solid fa-indian-rupee-sign text-xl"></i>
                            </div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Spent</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">₹{totalSpent}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-green-500">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-3">
                                <i className="fa-solid fa-check text-xl"></i>
                            </div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Confirmed</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{confirmed}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border-b-4 border-amber-500">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-3">
                                <i className="fa-solid fa-clock-rotate-left text-xl"></i>
                            </div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Pending</p>
                            <p className="text-2xl font-black text-gray-900 mt-1">{pending}</p>
                        </div>
                    </div>

                    {pending > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-10 flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 animate-pulse">
                                <i className="fa-solid fa-hourglass-half"></i>
                            </div>
                            <div>
                                <p className="text-amber-900 font-bold">Awaiting Approval</p>
                                <p className="text-amber-700 text-sm">Owner is reviewing {pending} of your requests.</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-10">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <i className="fa-solid fa-history text-primary"></i>
                                Booking History
                            </h2>
                        </div>

                        {bookings.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-4xl text-rose-300 mx-auto mb-6">
                                    <i className="fa-solid fa-calendar-xmark"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">No bookings yet</h3>
                                <p className="text-gray-500 mt-2">Book your first turf to see history here!</p>
                                <button
                                    onClick={() => navigate('/turfs')}
                                    className="mt-6 bg-primary text-white px-8 py-2 rounded-xl font-bold hover:bg-primary-dark transition shadow-lg"
                                >
                                    Explore Turfs
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-400 text-[10px] uppercase tracking-widest bg-gray-50/50 border-b">
                                            <th className="p-6">Turf / Location</th>
                                            <th className="p-6">Schedule</th>
                                            <th className="p-6">Transaction</th>
                                            <th className="p-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {bookings.map(b => (
                                            <tr key={b._id} className="hover:bg-rose-50/30 transition-colors">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-lg">
                                                            <i className="fa-solid fa-field-hockey"></i>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{b.turf?.name || 'Deleted'}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5"><i className="fa-solid fa-location-dot mr-1"></i>{b.turf?.location?.city || '—'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <p className="font-bold text-gray-800">{b.date}</p>
                                                    <p className="text-xs text-primary mt-1 font-bold">
                                                        <i className="fa-solid fa-clock mr-1"></i> {b.startTime}:00 – {b.endTime}:00
                                                    </p>
                                                </td>
                                                <td className="p-6">
                                                    <p className="font-black text-gray-900 text-lg">₹{b.totalPrice}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">
                                                        <i className="fa-solid fa-users mr-1"></i> {b.numberOfPlayers} Players
                                                    </p>
                                                </td>
                                                <td className="p-6 text-right sm:text-left">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusBadge(b.bookingStatus)}`}>
                                                        {b.bookingStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
            <BottomNav />
        </div>
    );
};

export default CustomerDashboard;
