import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import api from '../services/api';

const Home = () => {
    const [turfs, setTurfs] = useState([]);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTurfs = async () => {
            try {
                const { data } = await api.get('/turfs');
                setTurfs(data.slice(0, 3));
            } catch (error) { console.error(error); }
        };
        fetchTurfs();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/turfs?query=${search}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-rose-50/20 pb-20 lg:pb-0 overflow-x-hidden">
            <Navbar />

            {/* Hero Section */}
            <header className="relative h-[600px] flex items-center justify-center overflow-hidden max-w-full">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=75&w=1200"
                        alt="Stunning Turf"
                        className="w-full h-full object-cover scale-105"
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent"></div>
                </div>

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight drop-shadow-2xl">
                        Unleash Your <br />
                        <span className="text-rose-300">Inner Champion</span>
                    </h1>
                    <p className="text-white/80 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto">
                        Experience world-class sports facilities at your fingertips. Book, Play, and Dominate the field with TeamUp.
                    </p>

                    <form onSubmit={handleSearch} className="bg-white p-2 rounded-[2.5rem] shadow-2xl flex items-center max-w-2xl mx-auto group focus-within:ring-4 ring-rose-300 transition-all">
                        <div className="flex-grow flex items-center pl-6">
                            <i className="fa-solid fa-magnifying-glass text-gray-400 mr-3 text-xl"></i>
                            <input
                                type="text"
                                placeholder="Find a turf near you..."
                                className="w-full py-4 text-gray-900 font-bold outline-none placeholder:text-gray-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-[2rem] font-black transition-all shadow-lg active:scale-95">
                            EXPLORE
                        </button>
                    </form>
                </div>
            </header>

            <main className="flex-grow">
                {/* Stats Section */}
                <section className="container mx-auto px-4 -mt-16 relative z-20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: 'fa-solid fa-ranking-star', label: '100+ Venues', color: 'bg-indigo-500' },
                            { icon: 'fa-solid fa-user-group', label: '10k+ Players', color: 'bg-rose-500' },
                            { icon: 'fa-solid fa-calendar-check', label: 'Instant Booking', color: 'bg-amber-500' },
                            { icon: 'fa-solid fa-shield-heart', label: 'Safe & Verified', color: 'bg-green-500' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl shadow-xl flex flex-col items-center text-center group hover:scale-105 transition-transform">
                                <div className={`w-14 h-14 ${stat.color} text-white rounded-2xl mb-4 flex items-center justify-center text-2xl shadow-lg`}>
                                    <i className={stat.icon}></i>
                                </div>
                                <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">{stat.label}</h3>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Popular Turfs */}
                <section className="container mx-auto px-4 py-20">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <p className="text-primary font-black uppercase tracking-widest text-xs mb-2">Editor's Choice</p>
                            <h2 className="text-4xl font-black text-gray-900">Trending Near You</h2>
                        </div>
                        <button onClick={() => navigate('/turfs')} className="hidden md:flex items-center gap-2 text-primary font-black hover:gap-4 transition-all">
                            View All <i className="fa-solid fa-arrow-right-long"></i>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {turfs.map((t) => (
                            <div key={t._id} onClick={() => navigate(`/turfs/${t._id}`)} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer group">
                                <div className="h-64 relative">
                                    <img src={t.images?.[0] || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=75&w=600"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={t.name} loading="lazy" decoding="async" />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-lg">
                                        <p className="font-black text-primary text-sm flex items-center gap-1">₹{t.pricePerHour}<span className="text-[10px] text-gray-400 font-normal">/hr</span></p>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors">{t.name}</h3>
                                    <p className="text-gray-500 font-medium text-sm mt-2 flex items-center gap-1">
                                        <i className="fa-solid fa-location-dot text-rose-300"></i>
                                        {t.location.city}
                                    </p>
                                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {t.sportTypes?.slice(0, 2).map((s, idx) => (
                                                <span key={idx} className="bg-rose-50 text-primary text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">{s}</span>
                                            ))}
                                        </div>
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <i className="fa-solid fa-plus"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Promotional CTA */}
                <section className="container mx-auto px-4 pb-20">
                    <div className="bg-gray-900 rounded-[3rem] p-10 md:p-20 relative overflow-hidden text-center md:text-left">
                        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none hidden lg:block">
                            <img src="https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover" alt="Footballer" />
                        </div>
                        <div className="relative z-10 max-w-2xl">
                            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                                Own a Turf? <br />
                                <span className="text-primary">Grow Your Business</span>
                            </h2>
                            <p className="text-gray-400 text-lg mb-10 font-medium leading-relaxed">
                                Join our network of premium turf owners and reach thousands of players instantly. Manage bookings, revenue, and more from a single dashboard.
                            </p>
                            <button onClick={() => navigate('/register')} className="bg-primary text-white px-12 py-5 rounded-[2.5rem] font-black text-xl hover:scale-105 transition-transform shadow-2xl shadow-primary/40 active:scale-95">
                                LIST YOUR TURF
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
            <BottomNav />
        </div>
    );
};

export default Home;
