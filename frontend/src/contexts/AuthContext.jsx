import React, { createContext, useContext, useState, useEffect} from 'react';
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserData();
        }
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/users/me`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                localStorage.removeItem('token');
                setUser(null);
            }
            
        } catch (error) {
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
        // TODO: complete me
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
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password})
            });

            const data = await response.json();

            if (!response.ok) {
                return data.message;
            }

            localStorage.setItem('token', data.token);

            await fetchUserData();

            navigate('/profile');

            return null;
        } catch (error) {
            return "An error occurred while logging in: " + error.message;
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

            console.log('Response status:', response.status);
            const contentType = response.headers.get("content-type");
            console.log('Content-Type:', contentType);

            if (!contentType || !contentType.includes("application/json")) {
                const textContent = await response.text();
                console.error('Non-JSON response:', textContent);
                return "Server error: Invalid response format";
            }

            const data = await response.json();

            if (!response.ok) {
                return data.message;
            }

            navigate("/success");
            return null;
        } catch (error) {
            console.error('Registration error:', error);
            return `An error occurred during registration: ${error.message}`;
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
