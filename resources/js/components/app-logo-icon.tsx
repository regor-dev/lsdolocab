import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/images/logo.png"
            alt="LS Dolocab logo"
            decoding="async"
            className={props.className}
        />
    );
}
