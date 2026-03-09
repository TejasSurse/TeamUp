import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';

const TurfList = () => {
    const [turfs, setTurfs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTurfs = async () => {
            try {
                const { data } = await api.get('/turfs');
                setTurfs(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTurfs();
    }, []);

    const filteredTurfs = turfs.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.location.city.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen flex flex-col bg-rose-50/20 pb-20 lg:pb-0">
            <Navbar />
            <main className="flex-grow">
                {/* Hero Search Section */}
                <div className="bg-primary pt-10 pb-20 px-4">
                    <div className="container mx-auto text-center">
                        <h1 className="text-3xl md:text-5xl font-black text-white mb-6">Find Your Perfect <span className="text-rose-200">Pitch</span></h1>
                        <div className="max-w-xl mx-auto relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Search by name or city..."
                                className="w-full pl-12 pr-6 py-4 rounded-3xl text-gray-900 shadow-xl focus:ring-4 focus:ring-rose-300 outline-none transition-all placeholder:text-gray-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-10">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">
                                    <i className="fa-solid fa-fire text-primary mr-2"></i>
                                    Featured Venues
                                </h2>
                                <p className="text-gray-500 font-bold text-sm bg-white px-4 py-1 rounded-full shadow-sm">
                                    {filteredTurfs.length} Found
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                                {filteredTurfs.map(t => (
                                    <div
                                        key={t._id}
                                        onClick={() => navigate(`/turfs/${t._id}`)}
                                        className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-gray-100"
                                    >
                                        <div className="relative h-64 overflow-hidden">
                                            {t.images?.[0] ? (
                                                <img
                                                    src={t.images[0]}
                                                    alt={t.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-rose-100 flex items-center justify-center text-rose-300 text-3xl">
                                                    <i className="fa-solid fa-images"></i>
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-lg border border-white/20">
                                                <p className="font-black text-primary text-sm flex items-center gap-1">
                                                    <i className="fa-solid fa-rupee-sign text-[10px]"></i>
                                                    {t.pricePerHour}
                                                    <span className="text-[10px] text-gray-400 font-normal">/hr</span>
                                                </p>
                                            </div>
                                            {t.sportTypes?.[0] && (
                                                <div className="absolute bottom-4 left-4 flex gap-2">
                                                    {t.sportTypes.slice(0, 2).map((s, idx) => (
                                                        <span key={idx} className="bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-tighter">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-primary transition-colors">{t.name}</h3>
                                                <div className="flex items-center text-amber-500 text-sm">
                                                    <i className="fa-solid fa-star mr-1"></i>
                                                    <span className="font-black">4.8</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-500 text-sm line-clamp-1 flex items-center gap-1 mb-4">
                                                <i className="fa-solid fa-location-dot text-rose-300 text-xs"></i>
                                                {t.location.address}, {t.location.city}
                                            </p>

                                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                                <div className="flex gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                    <div className="flex items-center gap-1.5">
                                                        <i className="fa-solid fa-shower text-rose-200"></i>
                                                        Comfort
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <i className="fa-solid fa-parking text-rose-200"></i>
                                                        Free
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                    <i className="fa-solid fa-arrow-right-long"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {!loading && filteredTurfs.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[3rem] shadow-sm mb-20 border border-gray-50">
                            <div className="w-32 h-32 bg-rose-50 rounded-full flex items-center justify-center text-5xl text-rose-200 mx-auto mb-6">
                                <i className="fa-solid fa-magnifying-glass-slash"></i>
                            </div>
                            <h3 className="text-2xl font-black text-gray-800">No results for "{search}"</h3>
                            <p className="text-gray-500 mt-2 font-medium">Try searching for a different city or turf name.</p>
                            <button
                                onClick={() => setSearch('')}
                                className="mt-8 bg-black text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-transform"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            <BottomNav />
        </div>
    );
};

export default TurfList;
