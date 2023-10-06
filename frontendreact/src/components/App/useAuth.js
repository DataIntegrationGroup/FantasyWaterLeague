import { useState } from 'react';

export default function useAuth() {
    const getAuth = () => {

        const playerstr = sessionStorage.getItem('player');
        if (playerstr==='null'){
            return {}
        }

        const player = JSON.parse(playerstr);
        const token = JSON.parse(sessionStorage.getItem('token'));
        const credentials = JSON.parse(sessionStorage.getItem('credentials'));
        return {'slug': player?.slug,
                'token': token,
                'credentials': credentials,
                'user': JSON.parse(sessionStorage.getItem('user'))}
    };

    const [auth, setAuth] = useState(getAuth());

    const saveAuth= (player, token, username, password, user) => {
        const credentials = {'username': username, 'password': password};
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('player', JSON.stringify(player));
        sessionStorage.setItem('token', JSON.stringify(token));
        sessionStorage.setItem('credentials', JSON.stringify(credentials));


        setAuth({'slug': player?.slug, 'token': token, 'credentials': credentials, 'user': user});
    };
    return {auth, setAuth: saveAuth}
}