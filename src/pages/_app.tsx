import '../styles/globals.scss';

import { AppProps } from 'next/app';

import Header from '../components/Header';

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
