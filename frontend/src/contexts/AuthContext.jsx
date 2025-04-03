import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Check authentication status on mount and token changes
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                await fetchUserData();
            } else {
                setUser(null);
            }
        };
        
        checkAuth();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setUser(null);
                return;
            }

            const response = await fetch(`${BACKEND_URL}/user/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const { user: userData } = await response.json();
                // Ensure we have all required user fields
                if (userData && userData.firstname && userData.lastname) {
                    setUser(userData);
                } else {
                    console.error('Invalid user data received:', userData);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } else {
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate("/");
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {
        try {
            const loginResponse = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const loginData = await loginResponse.json();

            if (!loginResponse.ok) {
                return loginData.message;
            }

            // Store token
            localStorage.setItem('token', loginData.token);

            // Fetch user data
            const userResponse = await fetch(`${BACKEND_URL}/user/me`, {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                },
            });

            if (userResponse.ok) {
                const { user: userData } = await userResponse.json();
                // Verify we have the required user data
                if (userData && userData.firstname && userData.lastname) {
                    setUser(userData);
                    navigate('/profile');
                    return null;
                } else {
                    console.error('Invalid user data received:', userData);
                    localStorage.removeItem('token');
                    setUser(null);
                    return "Invalid user data received";
                }
            } else {
                localStorage.removeItem('token');
                setUser(null);
                return "Failed to fetch user data";
            }
        } catch (error) {
            console.error('Login error:', error);
            localStorage.removeItem('token');
            setUser(null);
            return "An error occurred during login";
        }
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
        try {
            const response = await fetch(`${BACKEND_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                return data.message;
            }

            navigate("/success");
            return null;
        } catch (error) {
            return "An error occurred during registration";
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
