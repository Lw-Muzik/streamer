"use client"
import React from 'react';

const Page = () => {
    React.useEffect(() => {
        document.title = "Forgot Password | Ethereal Tunes";
    }, []);
    return (
        <div>
            <h1>Forgot Password</h1>
        </div>
    );
};

export default Page;