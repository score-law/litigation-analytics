import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/../public/logo.svg'
import './styles.scss';

export default function NavBar() {
    return (
        <header>
            <Link href="/" className="logo">
                <Image src={Logo} alt="Logo" />
            </Link>
            <nav>
                <ul>
                    <li><Link href="/">Search</Link></li>
                </ul>
            </nav>
        </header>
    );
}
