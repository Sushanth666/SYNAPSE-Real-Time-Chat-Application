import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => {
        try {
            return localStorage.getItem('pulsechat_token');
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [allUsers, setAllUsers] = useState([]);
    const getSavedCredentials = useCallback(() => {
        try {
            const raw = localStorage.getItem('pulsechat_registered_credentials');
            return raw ? JSON.parse(raw) : [];
        }
        catch {
            return [];
        }
    }, []);
    const fetchAllUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setAllUsers(data);
            }
        }
        catch (err) {
            console.error('Failed to fetch users:', err);
        }
    }, []);
    // Restore session on page refresh using localStorage (persists across tabs & refreshes)
    useEffect(() => {
        const initAuth = async () => {
            await fetchAllUsers();

            // Read saved session from localStorage
            let savedToken = null;
            let savedUserId = null;
            try {
                savedToken = localStorage.getItem('pulsechat_token');
                savedUserId = localStorage.getItem('pulsechat_userid');
            } catch {}

            if (savedToken && savedUserId) {
                try {
                    const res = await fetch('/api/auth/me', {
                        headers: { Authorization: `Bearer ${savedToken}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const authUser = { ...data.user, status: 'online' };
                        setUser(authUser);
                        setToken(savedToken);
                        setAllUsers(prev => prev.map(u => u.id === authUser.id ? authUser : u));
                        setIsLoading(false);
                        return;
                    }
                    // 404 means server restarted and lost the user (in-memory DB reset)
                    // Try to auto-rehydrate using saved credentials from localStorage
                    if (res.status === 404 || res.status === 401) {
                        const storedCreds = getSavedCredentials();
                        const cred = storedCreds.find(c => c.id === savedUserId || (c.email && c.email.toLowerCase() === (user?.email || '').toLowerCase()));
                        if (cred) {
                            try {
                                // Re-register the user on the server to restore their session
                                const reRegRes = await fetch('/api/auth/register', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        name: cred.name,
                                        email: cred.email,
                                        password: cred.password || 'password123',
                                        avatar: cred.avatar,
                                        bio: cred.bio
                                    })
                                });
                                if (reRegRes.ok) {
                                    const regData = await reRegRes.json();
                                    const authUser = { ...regData.user, status: 'online' };
                                    setUser(authUser);
                                    setToken(regData.token);
                                    setAllUsers(prev => prev.map(u => u.id === authUser.id ? authUser : u));
                                    localStorage.setItem('pulsechat_token', regData.token);
                                    localStorage.setItem('pulsechat_userid', regData.user.id);
                                    setIsLoading(false);
                                    await fetchAllUsers();
                                    return;
                                }
                                // If register returns 400 (already exists), try login directly
                                const loginRes = await fetch('/api/auth/login', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email: cred.email, password: cred.password || 'password123' })
                                });
                                if (loginRes.ok) {
                                    const loginData = await loginRes.json();
                                    const authUser = { ...loginData.user, status: 'online' };
                                    setUser(authUser);
                                    setToken(loginData.token);
                                    setAllUsers(prev => prev.map(u => u.id === authUser.id ? authUser : u));
                                    localStorage.setItem('pulsechat_token', loginData.token);
                                    localStorage.setItem('pulsechat_userid', loginData.user.id);
                                    setIsLoading(false);
                                    await fetchAllUsers();
                                    return;
                                }
                            } catch {}
                        }
                    }
                    // All recovery attempts failed — clear and go to login
                    localStorage.removeItem('pulsechat_token');
                    localStorage.removeItem('pulsechat_userid');
                    setToken(null);
                    setUser(null);
                }
                catch {
                    // Network error — keep the cached token/user if possible, don't force logout
                    const storedCreds = getSavedCredentials();
                    const cred = storedCreds.find(c => c.id === savedUserId);
                    if (cred) {
                        const offlineUser = {
                            id: cred.id,
                            name: cred.name,
                            email: cred.email,
                            avatar: cred.avatar || null,
                            bio: cred.bio || '',
                            status: 'offline'
                        };
                        setUser(offlineUser);
                        setToken(savedToken);
                    } else {
                        localStorage.removeItem('pulsechat_token');
                        localStorage.removeItem('pulsechat_userid');
                        setToken(null);
                        setUser(null);
                    }
                }
            } else {
                setUser(null);
                setToken(null);
            }
            setIsLoading(false);
        };
        initAuth();
    }, [fetchAllUsers, getSavedCredentials]);

    const login = async (email, password, { onSuccess } = {}) => {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Attempt login with server (sending email + password)
        let res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail, password })
        });

        // 2. If login request failed
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));

            // If incorrect password, don't try rehydrating — throw immediately so user can fix password
            if (error.code === 'INCORRECT_PASSWORD') {
                const err = new Error(error.error || 'The password you entered does not match our records. Please try again.');
                err.code = 'INCORRECT_PASSWORD';
                throw err;
            }

            // If email is not registered on the server, check if registered credentials exist in localStorage!
            const storedCreds = getSavedCredentials();
            const found = storedCreds.find(c => c.email && c.email.toLowerCase() === normalizedEmail);

            if (found) {
                // Validate password if user set a password in local credentials
                if (password && found.password && password !== found.password) {
                    const err = new Error('The password you entered does not match our records. Please try again.');
                    err.code = 'INCORRECT_PASSWORD';
                    throw err;
                }

                // Automatically rehydrate/register user on the server
                const reRegRes = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: found.name || 'Synapse User',
                        email: found.email,
                        password: found.password || password || 'password123',
                        avatar: found.avatar,
                        bio: found.bio || 'Synapse user'
                    })
                });

                if (reRegRes.ok) {
                    const regData = await reRegRes.json();
                    const authUser = { ...regData.user, status: 'online' };
                    if (onSuccess) {
                        await onSuccess(authUser);
                    }
                    setUser(authUser);
                    setToken(regData.token);
                    setAllUsers(prev => prev.map(u => u.id === authUser.id ? authUser : u));
                    localStorage.setItem('pulsechat_token', regData.token);
                    localStorage.setItem('pulsechat_userid', regData.user.id);
                    await fetchAllUsers();
                    return;
                } else {
                    // If register failed with EMAIL_ALREADY_EXISTS, retry login with credentials
                    const retryLogin = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: normalizedEmail, password })
                    });
                    if (retryLogin.ok) {
                        const loginData = await retryLogin.json();
                        const authUser = { ...loginData.user, status: 'online' };
                        if (onSuccess) {
                            await onSuccess(authUser);
                        }
                        setUser(authUser);
                        setToken(loginData.token);
                        setAllUsers(prev => prev.map(u => u.id === authUser.id ? authUser : u));
                        localStorage.setItem('pulsechat_token', loginData.token);
                        localStorage.setItem('pulsechat_userid', loginData.user.id);
                        await fetchAllUsers();
                        return;
                    }
                }
            }

            const err = new Error(error.error || `No account was found for "${email.trim()}". Would you like to create a new account?`);
            err.code = error.code || 'EMAIL_NOT_REGISTERED';
            throw err;
        }

        // 3. Server accepted login
        const data = await res.json();
        const authUser = { ...data.user, status: 'online' };
        if (onSuccess) {
            await onSuccess(authUser);
        }
        setUser(authUser);
        setToken(data.token);
        setAllUsers(prev => prev.map(u => u.id === authUser.id ? authUser : u));
        localStorage.setItem('pulsechat_token', data.token);
        localStorage.setItem('pulsechat_userid', data.user.id);

        // Store/update credentials in localStorage
        try {
            const existingCreds = getSavedCredentials();
            const filtered = existingCreds.filter(c => c.email && c.email.toLowerCase() !== normalizedEmail);
            filtered.unshift({
                id: data.user.id,
                name: data.user.name,
                email: normalizedEmail,
                password: password || data.user.password || 'password123',
                avatar: data.user.avatar,
                bio: data.user.bio,
                lastLoginAt: new Date().toISOString()
            });
            localStorage.setItem('pulsechat_registered_credentials', JSON.stringify(filtered));
        } catch {}

        // Save to saved accounts list for switch user modal
        try {
            const savedAccountsRaw = localStorage.getItem('pulsechat_saved_accounts');
            const savedAccounts = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : [];
            if (!savedAccounts.includes(data.user.id)) {
                savedAccounts.push(data.user.id);
                localStorage.setItem('pulsechat_saved_accounts', JSON.stringify(savedAccounts));
            }
        }
        catch { }
        await fetchAllUsers();
    };
    const loginAsUser = async (userId) => {
        setIsLoading(true);
        try {
            let res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            // Fallback: check localStorage registered credentials if server doesn't have userId
            if (!res.ok) {
                const storedCreds = getSavedCredentials();
                const found = storedCreds.find(c => c.id === userId);
                if (found) {
                    const reRegRes = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: found.name,
                            email: found.email,
                            password: found.password || 'password123',
                            avatar: found.avatar,
                            bio: found.bio
                        })
                    });
                    if (reRegRes.ok) {
                        const regData = await reRegRes.json();
                        const authUser = { ...regData.user, status: 'online' };
                        setUser(authUser);
                        setToken(regData.token);
                        setAllUsers(prev => prev.map(u => u.id === authUser.id ? authUser : u));
                        localStorage.setItem('pulsechat_token', regData.token);
                        localStorage.setItem('pulsechat_userid', regData.user.id);
                        await fetchAllUsers();
                        return;
                    }
                }
                const error = await res.json().catch(() => ({ error: 'Failed to switch user' }));
                throw new Error(error.error || 'Failed to switch user');
            }
            const data = await res.json();
            const authUser = { ...data.user, status: 'online' };
            setUser(authUser);
            setToken(data.token);
            setAllUsers(prev => prev.map(u => u.id === authUser.id ? authUser : u));
            localStorage.setItem('pulsechat_token', data.token);
            localStorage.setItem('pulsechat_userid', data.user.id);
            await fetchAllUsers();
        }
        finally {
            setIsLoading(false);
        }
    };
    const register = async (name, email, avatar, bio, password, { onSuccess, autoLogin = false } = {}) => {
        const normalizedEmail = email.trim().toLowerCase();
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name.trim(),
                email: normalizedEmail,
                password: password || 'password123',
                avatar,
                bio
            })
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            const err = new Error(error.error || 'An account with this email is already registered. Please sign in instead.');
            err.code = error.code || 'EMAIL_ALREADY_EXISTS';
            throw err;
        }
        const data = await res.json();
        const registeredUser = { ...data.user };

        // SAVE REGISTERED CREDENTIALS TO LOCALSTORAGE
        const newCred = {
            id: data.user.id,
            name: data.user.name,
            email: normalizedEmail,
            password: password || 'password123',
            avatar: data.user.avatar,
            bio: data.user.bio,
            registeredAt: new Date().toISOString()
        };
        try {
            const existingCreds = getSavedCredentials();
            const filtered = existingCreds.filter(c => c.email.toLowerCase() !== normalizedEmail);
            filtered.unshift(newCred);
            localStorage.setItem('pulsechat_registered_credentials', JSON.stringify(filtered));
            // Save to managed accounts
            const savedAccountsRaw = localStorage.getItem('pulsechat_saved_accounts');
            const savedAccounts = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : [];
            if (!savedAccounts.includes(data.user.id)) {
                savedAccounts.push(data.user.id);
                localStorage.setItem('pulsechat_saved_accounts', JSON.stringify(savedAccounts));
            }
        }
        catch (storageErr) {
            console.warn('Failed to save credentials to localStorage:', storageErr);
        }

        if (onSuccess) {
            await onSuccess(registeredUser);
        }

        if (autoLogin) {
            const authUser = { ...registeredUser, status: 'online' };
            setUser(authUser);
            setToken(data.token);
            setAllUsers(prev => prev.map(u => u.id === authUser.id ? authUser : u));
            localStorage.setItem('pulsechat_token', data.token);
            localStorage.setItem('pulsechat_userid', data.user.id);
        }

        await fetchAllUsers();
        return registeredUser;
    };
    const logout = () => {
        setUser(null);
        setToken(null);
        try {
            localStorage.removeItem('pulsechat_token');
            localStorage.removeItem('pulsechat_userid');
            localStorage.removeItem('pulsechat_last_email');
            localStorage.removeItem('pulsechat_last_password');
        } catch {}
    };
    const updateStatus = (status) => {
        if (user) {
            const updated = { ...user, status };
            setUser(updated);
            // Also update in allUsers
            setAllUsers(prev => prev.map(u => u.id === user.id ? updated : u));
        }
    };
    const updateProfile = async (updates) => {
        if (!user)
            return;
        const updatedUser = {
            ...user,
            ...updates
        };
        setUser(updatedUser);
        // Update in allUsers list
        setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
        // Update in pulsechat_registered_credentials if saved
        try {
            const existing = getSavedCredentials();
            const idx = existing.findIndex(c => c.id === user.id || c.email.toLowerCase() === user.email.toLowerCase());
            if (idx !== -1) {
                existing[idx] = {
                    ...existing[idx],
                    name: updates.name || existing[idx].name,
                    bio: updates.bio !== undefined ? updates.bio : existing[idx].bio,
                    avatar: updates.avatar || existing[idx].avatar
                };
                localStorage.setItem('pulsechat_registered_credentials', JSON.stringify(existing));
            }
        }
        catch (e) {
            console.warn('Failed to sync updated profile to localStorage:', e);
        }
        // Call server to persist profile
        try {
            if (token) {
                await fetch('/api/users/profile', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updates)
                });
            }
        }
        catch (err) {
            console.warn('Server profile patch error (fallback to local):', err);
        }
    };
    return (<AuthContext.Provider value={{
            user,
            token,
            isLoading,
            allUsers,
            login,
            loginAsUser,
            register,
            logout,
            updateStatus,
            updateProfile,
            refreshUsers: fetchAllUsers,
            getSavedCredentials
        }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
