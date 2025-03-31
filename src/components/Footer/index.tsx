import './styles.scss';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/../public/logo.svg'

export default function Footer() {
    return (
        <footer>
            <nav>
                <ul>
                    <li><Link href="/about">About Us</Link></li>
                    <li><Link href="/services">Services</Link></li>
                    <li><Link href="/contact">Contact</Link></li>
                    <li><Link href="/sitemap.xml">Sitemap</Link></li>
                </ul>
            </nav>
            <div>
                <div className="footer-logo">
                    <Image src={Logo} alt="Logo" />
                </div>
                <p>© {new Date().getFullYear()} Score Inc. All Rights Reserved</p>
                <div className="footer-links">
                    <Link href="/privacy-policy">Privacy Policy</Link>
                    <Link href="/terms-of-use">Terms of Use</Link>
                </div>
            </div>
        </footer>
    );
}
