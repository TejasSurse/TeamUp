import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import BottomNav from '../components/BottomNav';

const TurfDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AuthContext);

    const [turf, setTurf] = useState(null);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [startHour, setStartHour] = useState('');
    const [endHour, setEndHour] = useState('');
    const [players, setPlayers] = useState(2);
    const [paymentMethod, setPaymentMethod] = useState('FakeOnline');
    const [error, setError] = useState('');
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        const fetchTurf = async () => {
            try {
                const { data } = await api.get(`/turfs/${id}`);
                setTurf(data);
            } catch (err) { setError('Failed to load turf details'); }
        };
        fetchTurf();
    }, [id]);

    useEffect(() => {
        if (!selectedDate) return;
        const fetchBookedSlots = async () => {
            try {
                const { data } = await api.get(`/bookings/slots/${id}?date=${selectedDate}`);
                setBookedSlots(data);
            } catch (err) { console.error('Failed to fetch slots', err); }
        };
        fetchBookedSlots();
    }, [selectedDate, id]);

    const getAvailableHours = () => {
        const open = parseInt(turf?.openingHours?.open) || 6;
        const close = parseInt(turf?.openingHours?.close) || 23;
        const hours = [];
        for (let h = open; h < close; h++) hours.push(h);
        return hours;
    };

    const isSlotBooked = (hour) => {
        return bookedSlots.some(slot => {
            const sS = parseInt(slot.startTime);
            const sE = parseInt(slot.endTime);
            return hour >= sS && hour < sE;
        });
    };

    const handleBooking = async () => {
        if (!user) return navigate('/login');
        if (!selectedDate || !startHour || !endHour) {
            return Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please select date, start and end time.' });
        }
        const s = parseInt(startHour);
        const e = parseInt(endHour);
        if (e <= s) return Swal.fire({ icon: 'error', title: 'Invalid', text: 'End time must be after start time.' });

        for (let h = s; h < e; h++) {
            if (isSlotBooked(h)) {
                return Swal.fire({ icon: 'error', title: 'Slot Taken', text: `${h}:00 - ${h + 1}:00 is already booked.` });
            }
        }

        const duration = e - s;
        const totalCost = turf.pricePerHour * duration;

        const result = await Swal.fire({
            title: 'Confirm Booking',
            html: `
                <div style="text-align:left; font-size:14px; line-height:2">
                    <p><strong>📍 Turf:</strong> ${turf.name}</p>
                    <p><strong>📅 Date:</strong> ${selectedDate}</p>
                    <p><strong>⏰ Time:</strong> ${s}:00 — ${e}:00 (${duration} hr${duration > 1 ? 's' : ''})</p>
                    <p><strong>👥 Players:</strong> ${players}</p>
                    <hr style="margin:8px 0">
                    <p><strong>💰 Total:</strong> ₹${totalCost}</p>
                    <p><strong>🧮 Per Player:</strong> ₹${(totalCost / players).toFixed(2)}</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2E7D32',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Book it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            await api.post('/bookings', {
                turfId: turf._id, date: selectedDate,
                startTime: String(s), endTime: String(e),
                totalPrice: totalCost, numberOfPlayers: players, paymentMethod
            }, { headers: { Authorization: `Bearer ${token}` } });

            Swal.fire({
                icon: 'success', title: 'Booking Submitted!',
                html: `<p>Your booking request has been sent to the turf owner for approval.</p><p class="text-sm text-gray-500 mt-2">You'll see it in your dashboard once confirmed.</p>`,
                confirmButtonColor: '#2E7D32'
            }).then(() => navigate('/dashboard'));
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Booking Failed', text: err.response?.data?.message || 'Something went wrong.' });
        }
    };

    if (error) return <div className="text-center mt-20 text-red-500 font-bold">{error}</div>;
    if (!turf) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const hours = getAvailableHours();
    const start = parseInt(startHour) || 0;
    const end = parseInt(endHour) || 0;
    const duration = end > start ? end - start : 0;
    const totalCost = turf.pricePerHour * duration;
    const splitCost = players > 0 ? totalCost / players : 0;
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen flex flex-col bg-rose-50/20 pb-20 lg:pb-0">
            <Navbar />
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-6 md:py-8">

                    {/* Image + Info */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden mb-8 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="relative bg-gray-900 group">
                                {turf.images?.length > 0 ? (
                                    <>
                                        <img src={turf.images[activeImg]} alt={turf.name} className="w-full h-80 md:h-[500px] object-cover" />
                                        {turf.images.length > 1 && (
                                            <div className="absolute bottom-6 left-6 flex gap-3">
                                                {turf.images.map((img, i) => (
                                                    <button key={i} onClick={() => setActiveImg(i)}
                                                        className={`w-16 h-12 rounded-xl border-2 overflow-hidden transition-all duration-300 transform ${i === activeImg ? 'border-primary ring-4 ring-primary/20 scale-110 shadow-lg' : 'border-white/50 opacity-70 hover:opacity-100'}`}>
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : <div className="w-full h-80 md:h-[500px] flex items-center justify-center text-gray-400 text-6xl"><i className="fa-solid fa-image"></i></div>}
                            </div>
                            <div className="p-8 md:p-12 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-rose-100 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <i className="fa-solid fa-bolt"></i> Instant
                                    </span>
                                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <i className="fa-solid fa-star text-amber-500"></i> 4.9 (120 reviews)
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">{turf.name}</h1>
                                <p className="text-gray-500 mt-4 text-base flex items-center gap-2 font-medium">
                                    <i className="fa-solid fa-location-dot text-primary"></i>
                                    {turf.location?.address}, {turf.location?.city}
                                </p>
                                <div className="mt-8 flex flex-wrap gap-2 text-primary">
                                    <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-2xl border border-rose-100">
                                        <i className="fa-solid fa-user-tie"></i>
                                        <span className="text-xs font-bold">{turf.owner?.name || 'Owner'}</span>
                                    </div>
                                </div>
                                <p className="mt-8 text-gray-600 leading-relaxed text-sm font-medium">{turf.description}</p>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    {turf.sportTypes?.map(s => (
                                        <span key={s} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
                                            <i className="fa-solid fa-medal text-primary opacity-50"></i> {s}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-10 flex items-end gap-2">
                                    <p className="text-4xl text-primary font-black">₹{turf.pricePerHour}</p>
                                    <p className="text-sm font-bold text-gray-400 mb-1.5 uppercase tracking-widest">/ hour</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-gray-100 transition-all hover:border-primary/20">
                                <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-primary text-lg">
                                        <i className="fa-solid fa-calendar-day"></i>
                                    </div>
                                    Select Your Session
                                </h2>

                                <div className="mb-10">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Pick a Date</label>
                                    <div className="relative max-w-sm">
                                        <i className="fa-solid fa-calendar-days font-bold text-primary absolute left-4 top-1/2 -translate-y-1/2"></i>
                                        <input
                                            type="date"
                                            min={today}
                                            value={selectedDate}
                                            onChange={(e) => { setSelectedDate(e.target.value); setStartHour(''); setEndHour(''); }}
                                            className="w-full p-4 pl-12 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-gray-700"
                                        />
                                    </div>
                                </div>

                                {selectedDate ? (
                                    <>
                                        <div className="mb-4 flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-rose-50 border-2 border-primary/20 rounded-md"></div>
                                                Available
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-gray-100 border-2 border-gray-200 rounded-md"></div>
                                                Booked
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-10">
                                            {hours.map(h => {
                                                const booked = isSlotBooked(h);
                                                return (
                                                    <div key={h} className={`text-center py-4 rounded-2xl text-xs font-black transition-all border-2
                                                        ${booked ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' : 'bg-rose-50/30 text-primary border-primary/10 hover:border-primary hover:bg-white hover:shadow-md cursor-default'}`}>
                                                        {h}:00
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="group">
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Entrance</label>
                                                <div className="relative">
                                                    <i className="fa-solid fa-door-open absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold"></i>
                                                    <select
                                                        value={startHour}
                                                        onChange={(e) => { setStartHour(e.target.value); setEndHour(''); }}
                                                        className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-gray-700 appearance-none"
                                                    >
                                                        <option value="">Start Time</option>
                                                        {hours.filter(h => !isSlotBooked(h)).map(h => <option key={h} value={h}>{h}:00</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Exit</label>
                                                <div className="relative">
                                                    <i className="fa-solid fa-door-closed absolute left-4 top-1/2 -translate-y-1/2 text-rose-300 font-bold"></i>
                                                    <select
                                                        value={endHour}
                                                        onChange={(e) => setEndHour(e.target.value)}
                                                        className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-gray-700 appearance-none"
                                                    >
                                                        <option value="">End Time</option>
                                                        {startHour && (() => {
                                                            const close = parseInt(turf?.openingHours?.close) || 23;
                                                            const opts = [];
                                                            for (let h = start + 1; h <= close; h++) {
                                                                opts.push(<option key={h} value={h}>{h}:00</option>);
                                                            }
                                                            return opts;
                                                        })()}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                        <i className="fa-solid fa-arrow-up text-3xl text-rose-200 block mb-3 animate-bounce"></i>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Choose a date to unlock slots</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-6 lg:sticky lg:top-8 h-fit">
                            <div className="bg-white rounded-[2rem] shadow-2xl p-8 border-t-[12px] border-primary">
                                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center justify-between">
                                    Summary
                                    <i className="fa-solid fa-receipt text-primary/30"></i>
                                </h3>

                                {duration > 0 ? (
                                    <div className="space-y-6">
                                        <div className="space-y-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500 font-medium">Session Duration</span>
                                                <span className="text-gray-900 font-black">{duration} hr{duration > 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500 font-medium">Rate / hr</span>
                                                <span className="text-gray-900 font-black">₹{turf.pricePerHour}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Squad Size</label>
                                            <div className="relative">
                                                <i className="fa-solid fa-users absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold"></i>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={players}
                                                    onChange={(e) => setPlayers(Math.max(1, Number(e.target.value)))}
                                                    className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-black text-gray-700"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-gray-400 font-black uppercase tracking-tighter text-xs">Total Amount</span>
                                                <span className="text-3xl font-black text-primary">₹{totalCost}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-primary font-black text-xs p-3 bg-rose-50 rounded-xl mt-3">
                                                <span><i className="fa-solid fa-split text-xs mr-1"></i> YOU PAY:</span>
                                                <span className="text-lg">₹{splitCost.toFixed(0)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Payment Method</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                <button
                                                    onClick={() => setPaymentMethod('FakeOnline')}
                                                    className={`p-4 rounded-2xl border-2 transition-all font-bold text-xs flex items-center justify-between ${paymentMethod === 'FakeOnline' ? 'border-primary bg-rose-50 text-primary shadow-sm' : 'border-gray-100 bg-white text-gray-500'}`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <i className="fa-solid fa-credit-card"></i> Pay Online
                                                    </span>
                                                    {paymentMethod === 'FakeOnline' && <i className="fa-solid fa-circle-check"></i>}
                                                </button>
                                                <button
                                                    onClick={() => setPaymentMethod('Offline')}
                                                    className={`p-4 rounded-2xl border-2 transition-all font-bold text-xs flex items-center justify-between ${paymentMethod === 'Offline' ? 'border-primary bg-rose-50 text-primary shadow-sm' : 'border-gray-100 bg-white text-gray-500'}`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <i className="fa-solid fa-hand-holding-dollar"></i> Pay at Venue
                                                    </span>
                                                    {paymentMethod === 'Offline' && <i className="fa-solid fa-circle-check"></i>}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleBooking}
                                            className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
                                        >
                                            <i className="fa-solid fa-fire"></i>
                                            Book Now
                                        </button>
                                        <div className="flex items-center justify-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                            <i className="fa-solid fa-shield-halved text-green-400"></i>
                                            Secure Checkout
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 text-2xl mx-auto mb-4">
                                            <i className="fa-solid fa-basket-shopping"></i>
                                        </div>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Your session list is empty</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <BottomNav />
        </div>

    );
};

export default TurfDetail;
