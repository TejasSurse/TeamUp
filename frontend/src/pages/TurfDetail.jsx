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
    const [players, setPlayers] = useState(1);
    const [error, setError] = useState('');
    const [activeImg, setActiveImg] = useState(0);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

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

    const formatTime = (val) => {
        const h = Math.floor(val);
        const m = val % 1 === 0 ? '00' : '30';
        return `${h}:${m}`;
    };

    const getAvailableHours = () => {
        const open = parseFloat(turf?.openingHours?.open) || 6;
        const close = parseFloat(turf?.openingHours?.close) || 23;
        const hours = [];
        for (let h = open; h < close; h += 0.5) hours.push(h);
        return hours;
    };

    const isSlotBooked = (hour) => {
        return bookedSlots.some(slot => {
            const sS = parseFloat(slot.startTime);
            const sE = parseFloat(slot.endTime);
            return hour >= sS && hour < sE;
        });
    };

    const handleBooking = async () => {
        if (!user) return navigate('/login');
        if (!selectedDate || !startHour || !endHour) {
            return Swal.fire({ icon: 'warning', title: 'Incomplete', text: 'Please select date, start and end time.' });
        }
        const s = parseFloat(startHour);
        const e = parseFloat(endHour);
        if (e <= s || e - s < 0.5) return Swal.fire({ icon: 'error', title: 'Invalid', text: 'End time must be after start time.' });

        for (let h = s; h < e; h += 0.5) {
            if (isSlotBooked(h)) {
                return Swal.fire({ icon: 'error', title: 'Slot Taken', text: `${formatTime(h)} - ${formatTime(h + 0.5)} is already booked.` });
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
                    <p><strong>⏰ Time:</strong> ${formatTime(s)} — ${formatTime(e)} (${duration} hr${duration > 1 ? 's' : ''})</p>
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
                totalPrice: totalCost, numberOfPlayers: players
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

    const submitReview = async (e) => {
        e.preventDefault();
        if (!token) return navigate('/login');
        if (!comment) return Swal.fire({ icon: 'warning', title: 'Empty Comment', text: 'Please write some feedback.' });

        setSubmittingReview(true);
        try {
            await api.post(`/turfs/${id}/reviews`, { rating, comment }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire({ icon: 'success', title: 'Review Added!', text: 'Thank you for your feedback!' });
            const { data } = await api.get(`/turfs/${id}`);
            setTurf(data);
            setComment('');
            setRating(5);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Denied', text: err.response?.data?.message || 'Failed to submit review.' });
        } finally {
            setSubmittingReview(false);
        }
    };

    if (error) return <div className="text-center mt-20 text-red-500 font-bold">{error}</div>;
    if (!turf) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const hours = getAvailableHours();
    const start = parseFloat(startHour) || 0;
    const end = parseFloat(endHour) || 0;
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
                                        <i className="fa-solid fa-star text-amber-500"></i> {turf.rating ? turf.rating.toFixed(1) : 'No'} ({turf.numReviews || 0} reviews)
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
                                                        <div key={h} className={`text-center py-2 px-1 rounded-2xl text-[10px] font-black transition-all border-2
                                                        ${booked ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' : 'bg-rose-50/30 text-primary border-primary/10 hover:border-primary hover:bg-white hover:shadow-md cursor-default'}`}>
                                                        {formatTime(h)}
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
                                                        {hours.filter(h => !isSlotBooked(h)).map(h => <option key={h} value={h}>{formatTime(h)}</option>)}
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
                                                            const close = parseFloat(turf?.openingHours?.close) || 23;
                                                            const opts = [];
                                                            for (let h = start + 0.5; h <= close; h += 0.5) {
                                                                opts.push(<option key={h} value={h}>{formatTime(h)}</option>);
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
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Country Calculator (Optional) - If don't know keep 1</label>
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

                    {/* Reviews Section */}
                    <div className="mt-16">
                        <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
                            <i className="fa-solid fa-comments text-primary"></i>
                            Community Feedback
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Review Form */}
                            <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-gray-100 h-fit">
                                <h3 className="text-xl font-black text-gray-900 mb-6">Rate Your Experience</h3>
                                {user ? (
                                    <form onSubmit={submitReview} className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Your Rating</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setRating(star)}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${rating >= star ? 'bg-amber-100 text-amber-500' : 'bg-gray-50 text-gray-300'}`}
                                                    >
                                                        <i className="fa-solid fa-star"></i>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Your Feedback</label>
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Tell others about your game..."
                                                className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-medium text-gray-700 min-h-[120px]"
                                            ></textarea>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary transition-all shadow-lg"
                                        >
                                            {submittingReview ? 'Submitting...' : 'Post Review'}
                                        </button>
                                        <p className="text-[10px] text-gray-400 font-bold text-center">Only users with past bookings can leave a review.</p>
                                    </form>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 font-bold mb-4">Login to share your feedback</p>
                                        <button onClick={() => navigate('/login')} className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Login Now</button>
                                    </div>
                                )}
                            </div>

                            {/* Review List */}
                            <div className="lg:col-span-2 space-y-6">
                                {turf.reviews && turf.reviews.length > 0 ? (
                                    turf.reviews.map((rev, idx) => (
                                        <div key={idx} className="bg-white rounded-[2rem] shadow-sm p-8 border border-gray-50 transition-all hover:shadow-md">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-rose-50 text-primary rounded-2xl flex items-center justify-center font-black text-xl">
                                                        {rev.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-gray-900">{rev.name}</h4>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex text-amber-500 text-xs gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <i key={i} className={`fa-solid fa-star ${i >= rev.rating ? 'text-gray-100' : ''}`}></i>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 font-medium leading-relaxed">{rev.comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-gray-100">
                                        <i className="fa-solid fa-star-half-stroke text-5xl text-gray-100 mb-4 block"></i>
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No reviews yet. Be the first to rate!</p>
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
