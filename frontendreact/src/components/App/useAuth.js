import { useState } from 'react';

export default function useAuth() {
    const getAuth = () => {

        const userstr = sessionStorage.getItem('user');
        if (userstr==='null'){
            return {}
        }

        const user = JSON.parse(userstr);
        const token = JSON.parse(sessionStorage.getItem('token'));

        return {'slug': user?.slug, 'token': token?.data}
    };

    const [auth, setAuth] = useState(getAuth());

    const saveAuth= (user, token) => {
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('token', JSON.stringify(token));

        setAuth({'slug': user?.slug, 'token': token?.data});
    };
    return {auth, setAuth: saveAuth}
}