import { useState } from 'react';

export default function useSlug() {
    const getSlug = () => {
        const tokenString = sessionStorage.getItem('user');
        const userToken = JSON.parse(tokenString);
        return userToken?.slug
    };

    const [slug, setSlug] = useState(getSlug());

    const saveSlug= (userSlug) => {
        sessionStorage.setItem('user', JSON.stringify(userSlug));
        console.log('data', userSlug)
        setSlug(userSlug.data);
    };
    return {setSlug: saveSlug, slug }
}