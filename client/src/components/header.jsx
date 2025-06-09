import React from 'react';

const Header = () => {
    return (
        <header className='bg-gray-300 text-red-500 p-4 flex'>
            <section>
                <h1 className='bg-gray-800'>EagleEye</h1>
            </section>

            <section className='flex-1 flex justify-end'>
                <button className='bg-red-500 px-2 py-1 text-white rounded pointer cursor-pointer'>Sign out</button>
            </section>
        </header>
    )
}

export default Header;