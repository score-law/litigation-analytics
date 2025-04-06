import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/../public/logo.svg'
import Button from '@mui/material/Button';
import './styles.scss';

export default function NavBar() {
    return (
        <header>
            <Link href="/" className="logo">
                <Image src={Logo} alt="Logo" />
            </Link>
            <nav>
                <ul>
                    <li>
                        <Link href="/">
                            <Button variant='outlined'>
                                New Search
                            </Button>
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
