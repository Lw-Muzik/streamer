"use client";
import React from 'react';
interface SeoProps {
    title: string;
    description: string
}
const Seo: React.FC<SeoProps> = ({ title, description }) => {
    React.useEffect(() => {
        document.title = title;
        document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    }, [title, description]);
    return (
        <></>
    );
};

export default Seo;