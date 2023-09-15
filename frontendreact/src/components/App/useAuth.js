import { useState } from 'react';

export default function useAuth() {
    const getAuth = () => {

        const userstr = sessionStorage.getItem('user');
        if (userstr==='null'){
            return {}
        }

        const user = JSON.parse(userstr);
        const token = JSON.parse(sessionStorage.getItem('token'));
        const credentials = JSON.parse(sessionStorage.getItem('credentials'));
        return {'slug': user?.slug,
                'token': token?.data,
                'credentials': credentials}
    };

    const [auth, setAuth] = useState(getAuth());

    const saveAuth= (user, token, username, password) => {
        const credentials = {'username': username, 'password': password};
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('token', JSON.stringify(token));
        sessionStorage.setItem('credentials', JSON.stringify(credentials));


        setAuth({'slug': user?.slug, 'token': token?.data, 'credentials': credentials});
    };
    return {auth, setAuth: saveAuth}
}