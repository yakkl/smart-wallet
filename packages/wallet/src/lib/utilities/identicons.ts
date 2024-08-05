import makeBlockie from 'ethereum-blockies-base64';

export function identicon(address: string) {
    let img = undefined;

    try {
        img = makeBlockie(address);
    } catch {
        img = "/images/favicon.png";
    }

    return img;
}

