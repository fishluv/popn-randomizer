import Head from 'next/head'
import RandomizerApp from './RandomizerApp'

export default function Index() {
  return (
    <>
      <Head>
        <title>Pop&apos;n Randomizer</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=M+PLUS+1:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>
      <RandomizerApp />
    </>
  );
}
