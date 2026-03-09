import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 pt-20 pb-10 px-4 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="md:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                                <i className="fa-solid fa-futbol"></i>
                            </div>
                            <span className="text-3xl font-black tracking-tighter">
                                TEAM<span className="text-primary">UP</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 max-w-sm font-medium leading-relaxed">
                            The ultimate destination for sports enthusiasts. Book premium venues, discover local talent, and elevate your game with our state-of-the-art booking platform.
                        </p>
                        <div className="flex gap-4 mt-8">
                            <a href="#" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary transition-all border border-white/5">
                                <i className="fa-brands fa-instagram text-xl"></i>
                            </a>
                            <a href="#" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary transition-all border border-white/5">
                                <i className="fa-brands fa-facebook-f text-xl"></i>
                            </a>
                            <a href="#" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary transition-all border border-white/5">
                                <i className="fa-brands fa-twitter text-xl"></i>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xl font-bold mb-6">Platform</h4>
                        <ul className="space-y-4 text-gray-400 font-medium">
                            <li><Link to="/turfs" className="hover:text-primary transition">Find Venue</Link></li>
                            <li><Link to="/register" className="hover:text-primary transition">List Your Turf</Link></li>
                            <li><Link to="/dashboard" className="hover:text-primary transition">My Bookings</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xl font-bold mb-6">Contact</h4>
                        <ul className="space-y-4 text-gray-400 font-medium">
                            <li className="flex items-start gap-3">
                                <i className="fa-solid fa-location-dot mt-1 text-primary"></i>
                                123 Sports Arena, <br />Mumbai, Maharashtra
                            </li>
                            <li className="flex items-center gap-3">
                                <i className="fa-solid fa-envelope text-primary"></i>
                                play@teamup.com
                            </li>
                            <li className="flex items-center gap-3">
                                <i className="fa-solid fa-phone text-primary"></i>
                                +91 999 888 7777
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} TeamUp. Built for Winners.
                    </p>
                    <div className="flex gap-8 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                        <a href="#" className="hover:text-white transition">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition">Terms of Service</a>
                        <a href="#" className="hover:text-white transition">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
