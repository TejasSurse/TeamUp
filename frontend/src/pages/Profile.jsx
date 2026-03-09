import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    if (!user) {
        navigate('/login');
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 pb-20 lg:pb-0">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-10">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                        {/* Header Background */}
                        <div className="h-32 bg-gradient-to-r from-primary to-rose-400"></div>

                        <div className="px-8 pb-8">
                            {/* Profile Image */}
                            <div className="relative -mt-16 mb-6">
                                <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg mx-auto">
                                    <div className="w-full h-full bg-rose-100 rounded-full flex items-center justify-center text-4xl text-primary font-bold">
                                        {user.name?.[0].toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-extrabold text-gray-900">{user.name}</h1>
                                <p className="text-gray-500 font-medium">{user.phone}</p>
                                <span className="mt-2 inline-block px-4 py-1 bg-rose-100 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                                    {user.role}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                                        <i className="fa-solid fa-phone"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Phone Number</p>
                                        <p className="font-bold text-gray-800">{user.phone}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                                        <i className="fa-solid fa-shield-halved"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Account Role</p>
                                        <p className="font-bold text-gray-800 text-capitalize">{user.role}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="p-4 rounded-2xl bg-gray-100 text-gray-600 font-bold flex flex-col items-center gap-2 hover:bg-gray-200 transition"
                                >
                                    <i className="fa-solid fa-list-ul"></i>
                                    <span className="text-xs">My History</span>
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="p-4 rounded-2xl bg-rose-50 text-primary font-bold flex flex-col items-center gap-2 hover:bg-rose-100 transition"
                                >
                                    <i className="fa-solid fa-right-from-bracket"></i>
                                    <span className="text-xs text-rose-600">Logout</span>
                                </button>
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

export default Profile;
