import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            if (user.role === 'SuperAdmin') navigate('/admin');
            else if (user.role === 'TurfOwner') navigate('/owner');
            else navigate('/dashboard');
        }
    }, [user, navigate]);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const userData = await login(phone, password);
            if (userData.role === 'SuperAdmin') navigate('/admin');
            else if (userData.role === 'TurfOwner') navigate('/owner');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-rose-50/20">
            <Navbar />
            <main className="flex-grow flex items-center justify-center p-4 py-20 relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full -ml-48 -mb-48 blur-3xl"></div>

                <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 relative z-10 border border-gray-100">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white text-3xl mx-auto mb-6 shadow-xl rotate-12 group-hover:rotate-0 transition-transform">
                            <i className="fa-solid fa-right-to-bracket"></i>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 leading-tight">Welcome Back!</h2>
                        <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-xs">Login to your account</p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-primary px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
                            <i className="fa-solid fa-circle-exclamation underline decoration-primary/20"></i>
                            <span className="text-sm font-bold">{error}</span>
                        </div>
                    )}

                    <form onSubmit={submitHandler} className="space-y-6">
                        <div className="group">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1 transition-colors group-focus-within:text-primary">Phone Number</label>
                            <div className="relative">
                                <i className="fa-solid fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 font-bold group-focus-within:text-primary transition-colors"></i>
                                <input
                                    type="text"
                                    placeholder="Enter your phone"
                                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-primary outline-none transition-all font-bold text-gray-700"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1 transition-colors group-focus-within:text-primary">Password</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 font-bold group-focus-within:text-primary transition-colors"></i>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-primary outline-none transition-all font-bold text-gray-700"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-5 rounded-[2.5rem] font-black text-xl hover:bg-primary-dark transition-all shadow-2xl shadow-primary/30 active:scale-95"
                        >
                            LOGIN
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-gray-500 font-bold text-sm">
                            Don't have an account? <br className="md:hidden" />
                            <Link to="/register" className="text-primary hover:underline ml-1">Create Account</Link>
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Login;
