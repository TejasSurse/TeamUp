import React from 'react';

const BallLoader = () => {
    return (
        <div className="loader-container">
            <div className="loader-orbit">
                <div className="ball"></div>
                <div className="football">
                    <i className="fa-solid fa-futbol text-gray-800"></i>
                </div>
            </div>
            <div className="absolute mt-32 text-primary font-bold animate-pulse">
                TEAM UP...
            </div>
        </div>
    );
};

export default BallLoader;
