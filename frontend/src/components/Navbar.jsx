import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 h-20 flex items-center shadow-sm">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-xl shadow-lg rotate-12 group-hover:rotate-0 transition-transform duration-300">
                        <i className="fa-solid fa-futbol"></i>
                    </div>
                    <span className="text-2xl font-black text-gray-900 tracking-tighter">
                        TEAM<span className="text-primary">UP</span>
                    </span>
                </Link>

                <div className="hidden lg:flex items-center gap-8">
                    <NavLink to="/" className={({ isActive }) => `text-sm font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-900'} transition-colors`}>Home</NavLink>
                    <NavLink to="/turfs" className={({ isActive }) => `text-sm font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-900'} transition-colors`}>Explore</NavLink>

                    {user && user.role === 'Customer' && (
                        <NavLink to="/dashboard" className={({ isActive }) => `text-sm font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-900'} transition-colors`}>My Games</NavLink>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link to={user.role === 'Customer' ? '/profile' : user.role === 'TurfOwner' ? '/owner' : '/admin'} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-2xl hover:bg-gray-200 transition group">
                                <span className="hidden sm:inline text-xs font-black uppercase tracking-widest text-gray-500">
                                    {user.name.split(' ')[0]}
                                </span>
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary font-bold shadow-sm group-hover:scale-110 transition-transform">
                                    {user.name[0].toUpperCase()}
                                </div>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="hidden sm:flex items-center justify-center w-10 h-10 bg-rose-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                title="Logout"
                            >
                                <i className="fa-solid fa-power-off"></i>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login" className="px-6 py-2.5 text-gray-500 font-bold hover:text-primary transition">Login</Link>
                            <Link to="/register" className="px-6 py-2.5 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition active:scale-95">
                                Join Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
