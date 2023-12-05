import {useFiefAuth, useFiefIsAuthenticated} from '@fief/fief/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Callback: React.FunctionComponent = () => {
    const fiefAuth = useFiefAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fiefAuth.authCallback(`${window.location.protocol}//${window.location.host}/callback`).then(() => {
            navigate('/');
        });
    }, [fiefAuth, navigate]);

    return (
        <p>Callback!</p>
    );
};

export const RequireAuth: React.FunctionComponent<React.PropsWithChildren> = ({ children }) => {
    const fiefAuth = useFiefAuth();
    const isAuthenticated = useFiefIsAuthenticated();

    useEffect(() => {
        if (!isAuthenticated) {
            fiefAuth.redirectToLogin(`${window.location.protocol}//${window.location.host}/callback`);
        }
    }, [fiefAuth, isAuthenticated]);

    return (
        <>
            {isAuthenticated && children}
        </>
    );
};
