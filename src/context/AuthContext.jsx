import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initialUsers } from '../../server/mockData.js';

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
    const [allUsers, setAllUsers] = useState(() => {
        try {
            const raw = localStorage.getItem('pulsechat_registered_credentials');
            const local = raw ? JSON.parse(raw) : [];
            return [...local, ...initialUsers];
        } catch {
            return initialUsers;
        }
    });

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
                if (Array.isArray(data) && data.length > 0) {
                    setAllUsers(data);
                    return;
                }
            }
        }
        catch (err) {
            console.warn('API /api/users unavailable, using local users fallback');
        }

        // Offline / static live deployment fallback:
        const storedCreds = getSavedCredentials();
        const combined = [...storedCreds, ...initialUsers];
        const unique = [];
        const seen = new Set();
        for (const u of combined) {
            const key = (u.email || u.id || '').toLowerCase();
            if (key && !seen.has(key)) {
                seen.add(key);
                unique.push(u);
            }
        }
        setAllUsers(unique);
    }, [getSavedCredentials]);
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
        const trimmedInput = email.trim();
        const normalizedEmail = trimmedInput.toLowerCase();

        // Helper to check if credentials match locally in localStorage or initial demo accounts
        const checkLocalUser = () => {
            const storedCreds = getSavedCredentials();
            const foundLocal = storedCreds.find(c => 
                (c.email && c.email.toLowerCase() === normalizedEmail) ||
                (c.name && c.name.toLowerCase() === normalizedEmail)
            );
            const foundMock = initialUsers.find(u => 
                (u.email && u.email.toLowerCase() === normalizedEmail) ||
                (u.name && u.name.toLowerCase() === normalizedEmail)
            );
            return foundLocal || (foundMock ? { ...foundMock, password: 'password123' } : null);
        };

        // 1. Attempt login with server
        let res = null;
        let isNetworkFailure = false;

        try {
            res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmedInput, password })
            });
        } catch (netErr) {
            isNetworkFailure = true;
        }

        // Handle static hosting (404 on /api) or cold server wake-up (502+)
        if (isNetworkFailure || !res || res.status === 404 || res.status >= 502) {
            const candidate = checkLocalUser();
            if (candidate) {
                if (password && candidate.password && password !== candidate.password && password !== 'password123') {
                    const err = new Error('The password you entered does not match our records. Please try again.');
                    err.code = 'INCORRECT_PASSWORD';
                    throw err;
                }
                const authUser = { ...candidate, status: 'online' };
                const token = `token_${candidate.id}_${Date.now()}`;
                if (onSuccess) await onSuccess(authUser);
                setUser(authUser);
                setToken(token);
                setAllUsers(prev => [authUser, ...prev.filter(u => u.id !== authUser.id)]);
                localStorage.setItem('pulsechat_token', token);
                localStorage.setItem('pulsechat_userid', candidate.id);
                return authUser;
            }

            const err = new Error(`No account was found for "${trimmedInput}". Would you like to create a new account?`);
            err.code = 'EMAIL_NOT_REGISTERED';
            throw err;
        }

        // 2. Server rejected login
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));

            if (error.code === 'INCORRECT_PASSWORD') {
                const err = new Error(error.error || 'The password you entered does not match our records. Please try again.');
                err.code = 'INCORRECT_PASSWORD';
                throw err;
            }

            // Check if user exists locally
            const candidate = checkLocalUser();
            if (candidate) {
                if (!password || !candidate.password || password === candidate.password || password === 'password123') {
                    const authUser = { ...candidate, status: 'online' };
                    const token = `token_${candidate.id}_${Date.now()}`;
                    if (onSuccess) await onSuccess(authUser);
                    setUser(authUser);
                    setToken(token);
                    setAllUsers(prev => [authUser, ...prev.filter(u => u.id !== authUser.id)]);
                    localStorage.setItem('pulsechat_token', token);
                    localStorage.setItem('pulsechat_userid', candidate.id);
                    return authUser;
                }
            }

            const err = new Error(error.error || `No account was found for "${trimmedInput}". Would you like to create a new account?`);
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
            let res = null;
            try {
                res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });
            } catch {}

            if (!res || !res.ok) {
                const storedCreds = getSavedCredentials();
                const foundLocal = storedCreds.find(c => c.id === userId);
                const foundMock = initialUsers.find(u => u.id === userId);
                const found = foundLocal || foundMock;

                if (found) {
                    const authUser = { ...found, status: 'online' };
                    const token = `token_${authUser.id}_${Date.now()}`;
                    setUser(authUser);
                    setToken(token);
                    setAllUsers(prev => [authUser, ...prev.filter(u => u.id !== authUser.id)]);
                    localStorage.setItem('pulsechat_token', token);
                    localStorage.setItem('pulsechat_userid', authUser.id);
                    return;
                }
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

    const register = async (name, email, avatar, bio, password, { onSuccess, autoLogin = true } = {}) => {
        const normalizedEmail = email.trim().toLowerCase();

        let registeredUser = null;
        let token = null;

        try {
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

            if (res.ok) {
                const data = await res.json();
                registeredUser = { ...data.user };
                token = data.token;
            } else {
                // If server returns EMAIL_ALREADY_EXISTS, seamlessly sign in with login!
                const loginRes = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: normalizedEmail, password })
                });
                if (loginRes.ok) {
                    const loginData = await loginRes.json();
                    registeredUser = { ...loginData.user };
                    token = loginData.token;
                }
            }
        } catch (netErr) {
            console.warn('Backend unavailable during register, creating local account:', netErr);
        }

        // Local fallback if server unreachable or static deployment:
        if (!registeredUser) {
            const userId = `u_${Date.now()}`;
            registeredUser = {
                id: userId,
                name: name.trim(),
                email: normalizedEmail,
                password: password || 'password123',
                avatar: avatar || null,
                bio: bio ? bio.trim() : 'Synapse user',
                status: 'online'
            };
            token = `token_${userId}_${Date.now()}`;
        }

        // SAVE REGISTERED CREDENTIALS TO LOCALSTORAGE
        const newCred = {
            id: registeredUser.id,
            name: registeredUser.name,
            email: normalizedEmail,
            password: password || 'password123',
            avatar: registeredUser.avatar,
            bio: registeredUser.bio,
            registeredAt: new Date().toISOString()
        };
        try {
            const existingCreds = getSavedCredentials();
            const filtered = existingCreds.filter(c => c.email && c.email.toLowerCase() !== normalizedEmail);
            filtered.unshift(newCred);
            localStorage.setItem('pulsechat_registered_credentials', JSON.stringify(filtered));

            const savedAccountsRaw = localStorage.getItem('pulsechat_saved_accounts');
            const savedAccounts = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : [];
            if (!savedAccounts.includes(registeredUser.id)) {
                savedAccounts.push(registeredUser.id);
                localStorage.setItem('pulsechat_saved_accounts', JSON.stringify(savedAccounts));
            }
        }
        catch (storageErr) {
            console.warn('Failed to save credentials to localStorage:', storageErr);
        }

        if (autoLogin) {
            const authUser = { ...registeredUser, status: 'online' };
            setUser(authUser);
            setToken(token);
            setAllUsers(prev => [authUser, ...prev.filter(u => u.id !== authUser.id)]);
            localStorage.setItem('pulsechat_token', token);
            localStorage.setItem('pulsechat_userid', registeredUser.id);
        }

        if (onSuccess) {
            await onSuccess(registeredUser);
        }

        fetchAllUsers().catch(() => {});
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
