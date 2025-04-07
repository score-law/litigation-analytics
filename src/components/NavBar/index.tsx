import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/../public/logo.svg'
import Button from '@mui/material/Button';
import './styles.scss';

import SearchIcon from '@mui/icons-material/Search';
import { Widgets, WidthFull } from '@mui/icons-material';

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
                            <Button 
                            startIcon={<SearchIcon fontSize='small' />}
                            variant='outlined'>
                                New Search
                            </Button>
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
