import { useNavigate, Link } from 'react-router-dom';

const Layout = ({ user, setUser, children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navigation Bar */}
            <nav className="bg-white shadow border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-blue-600">JobVerse</span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            {user ? (
                                <>
                                    <span className="text-gray-700 text-sm">
                                        Logged in as <span className="font-semibold">{user.username}</span> ({user.role})
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                                        Log in
                                    </Link>
                                    <Link to="/register" className="btn-primary ml-4">
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} JobVerse. AI-Powered Hiring Platform.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
