import dynamic from 'next/dynamic';
import React, { PropsWithChildren, useEffect, useState } from "react";
import { AppleWalletServiceProvider, useAppleWallet } from '../services/apple-wallet.provider';
import { getJwtContent } from "../utils/jwt";

// @ts-ignore
const QrScanner = dynamic(() => import('react-qr-scanner'), { ssr: false });

function PageWrapper(props: PropsWithChildren<{}>) {
    return <div className="container mx-auto px-4 max-w-sm">
        {props.children}
    </div>;
}

function Headline() {
    return <div>
        <h1 className="text-4xl font-bold mt-8 mb-4">Multipass</h1>
        <p className="my-4">Nem hivatalos megoldás a védettségi igazolvány és az EESZT által kiállított QR kód Apple Wallet integrációjára.</p>
    </div>;
}

function PrivacyNotice() {
    return <div className="my-4">
        <p className="my-2 text-sm text-gray-600"><strong>Az itt megadott adatok nem kerülnek továbbításra, tárolásra.</strong></p>
        <p className="text-xs text-gray-500 my-2">Az átalakítás kliensoldalon történik, az Wallet Pass elkészítéséhez szükséges és így a szerverhez elküldött adatokat pedig az elküldés előtt részletezve olvashatók.</p>
    </div>;
}

function ScanRow(
    params: {
        setQrText: React.Dispatch<React.SetStateAction<string | undefined>>;
        setQrData: React.Dispatch<React.SetStateAction<any>>;
    }
) {
    const [isScannerPopupOpen, setScannerPopupOpen] = useState<boolean>(false);

    const [facingMode, setFacingMode] = useState<boolean>(false);

    const [qrText, localSetQrText] = useState<string | undefined>();
    function setQrText(text?: string) {
        localSetQrText(text);
        params.setQrText(text);
    }

    const [jwt, setJwt] = useState<string | undefined>();
    useEffect(() => {
        if (!qrText) {
            params.setQrData(undefined);
            return;
        }

        console.log(qrText);

        // Handle the plastic card, where the QR code points to an URL, ending with the JWT part.
        if (qrText.startsWith('https')) {
            setJwt(qrText.split('/').pop());
        } else {
            setJwt(qrText);
        }

        // TODO: validate the QR code?
    }, [qrText]);

    useEffect(() => {
        if (!jwt) {
            return;
        }

        const qrData = getJwtContent(jwt!);
        console.log(qrData);
        params.setQrData(qrData);
    }, [jwt])

    return <div className="container bg-white shadow-md rounded-lg p-4 mb-8">
        <ol className="list-decimal ml-6 mb-4 text-sm">
            <li className="mb-2">Olvasd be a fizikai vagy digitális védettségi igazolványodat.</li>
            <li className="mb-2">Add meg a hiányzó adatokat.</li>
            <li className="mb-2">Töltsd le a telefonodra az igazolvány digitalizált változatát.</li>
        </ol>

        {
            !isScannerPopupOpen &&
            <button
                onClick={() => setScannerPopupOpen(true)}
                className="text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg w-full"
            >QR kód beolvasása</button>
        }
        {
            isScannerPopupOpen &&
            <QrScanner
                // @ts-ignore
                onScan={
                    (result?: { text?: string; }) => {
                        setQrText(result?.text);
                        if (result?.text) {
                            setScannerPopupOpen(false);
                        }
                    }
                }
                onClick={() => setFacingMode(!facingMode)}
                facingMode={facingMode ? 'front' : 'rear'}
                onError={(e: any) => { console.log(e) }}
            ></QrScanner>
        }
    </div>;
}

type PhysicalCardData = {
    iss: string, // EESZT
    sub: string, // subject id
    id: string, // random id?
};
type DigitalCardData = {
    ts: string, // timestamp of code generation
    n: string, // name of card holder
    id: string, // TAJ identifier
    vd: string, // date of first shot
};

function FormRow({ qrData }: { qrData: PhysicalCardData | DigitalCardData }) {
    const [name, setName] = useState<string>();
    const [passportNumber, setPassportNumber] = useState<string>();
    const [idCardNumber, setIdCardNumber] = useState<string>();
    const [tajNumber, setTajNumber] = useState<string>();
    const [dateOfFirstVaccination, setDateOfFirstVaccination] = useState<Date>();

    const nameProps = {
        value: name,
        onChange: (event: React.FormEvent<HTMLInputElement>) => setName(event.currentTarget.value),
    };

    const tajProps = {
        value: tajNumber,
        onChange: (event: React.FormEvent<HTMLInputElement>) => setTajNumber(event.currentTarget.value),
    };

    const passportProps = {
        value: passportNumber,
        onChange: (event: React.FormEvent<HTMLInputElement>) => setPassportNumber(event.currentTarget.value),
    };

    const idProps = {
        value: idCardNumber,
        onChange: (event: React.FormEvent<HTMLInputElement>) => setIdCardNumber(event.currentTarget.value),
    };

    const shotProps = {
        value: dateOfFirstVaccination?.toISOString().split("T")[0],
        onChange: (event: React.FormEvent<HTMLInputElement>) => setDateOfFirstVaccination(new Date(event.currentTarget.value)),
    };

    const [isPhysical, setIsPhysical] = useState<boolean>();

    useEffect(() => {
        if (!qrData) {
            return;
        }

        const physical = ('iis' in qrData);
        setIsPhysical(physical);

        if (physical) {
            return;
        }

        const digitalCardData = qrData as DigitalCardData;
        setName(digitalCardData.n);
        setTajNumber(digitalCardData.id);
        setDateOfFirstVaccination(new Date(digitalCardData.vd));
    }, [qrData]);

    const x = useAppleWallet();

    if (!qrData) {
        return <></>;
    }

    return <div>
        {
            isPhysical &&
            <div className="container bg-green-100 shadow-md rounded-lg p-4 my-4">
                <p>✅ Fizikai védettségi igazolványt olvastál be. Kérlek, írd be az adataidat, hogy azok megjelenhessenek a digitális változaton is.</p>
            </div>
        }

        <div className="container bg-white shadow-md rounded-lg p-4 mb-8">
            <div className="relative mb-4">
                <label htmlFor="name" className="leading-7 text-sm text-gray-600">Név</label>
                <input type="name" id="name" name="name" className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" {...nameProps} />
            </div>

            {
                !isPhysical &&
                <div className="relative mb-4">
                    <label htmlFor="taj" className="leading-7 text-sm text-gray-600">TAJ-szám</label>
                    <input type="text" id="taj" name="taj" className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" {...tajProps} />
                </div>
            }

            {
                isPhysical && <>
                    <div className="relative mb-4">
                        <label htmlFor="passport" className="leading-7 text-sm text-gray-600">Útlevél száma (opcionális)</label>
                        <input type="text" id="passport" name="passport" className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" {...passportProps} />
                    </div>

                    <div className="relative mb-4">
                        <label htmlFor="nationalId" className="leading-7 text-sm text-gray-600">Személyazonosító igazolvány száma</label>
                        <input type="text" id="nationalId" name="nationalId" className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" {...idProps} />
                    </div>
                </>
            }

            <div className="relative mb-4">
                <label htmlFor="shotDate" className="leading-7 text-sm text-gray-600">Az első oltás ideje</label>
                <input type="date" id="shotDate" name="shotDate" className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" {...shotProps} />
            </div>

            <button
                disabled={!(
                    (isPhysical && name && idCardNumber && dateOfFirstVaccination) ||
                    (!isPhysical && name && tajNumber && dateOfFirstVaccination)
                )}
                onClick={() => x?.createPackageToSign()}
                className="text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg w-full mt-4"
            >Wallet Pass letöltése</button>
        </div>
    </div>;
}

function Form() {
    const [qrData, setQrData] = useState<any | undefined>();
    const [qrText, setQrText] = useState<string | undefined>();

    return <div>
        {/* <pre>{JSON.stringify(qrData, null, 2)}</pre> */}
        {!qrData && <ScanRow {...{ setQrData, setQrText }}></ScanRow>}
        {qrData && <FormRow {...{ qrData }}></FormRow>}
    </div>;
}


function CovidPassPage() {
    return <AppleWalletServiceProvider createPackageToSign={async () => {
        alert('boop');
        return 'boop';
    }}>
        <PageWrapper>
            <div className="flex flex-col min-h-screen">
                <div className="flex flex-col flex-grow">
                    <Headline />
                    <Form />
                </div>
                <div className="flex-grow-0 flex-shrink-0">
                    <PrivacyNotice />
                </div>
            </div>
        </PageWrapper>
    </AppleWalletServiceProvider>;
}

export default CovidPassPage;