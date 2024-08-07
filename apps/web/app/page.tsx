"use client";

import "reflect-metadata";

import dynamic from 'next/dynamic';

const BBBluff = dynamic(
  () => import('components/bbbluff-page.tsx'),
  {
    ssr: false,
  } 
);

export default function Home() {
  return (
    <div>
    <BBBluff />
    HELLO
    </div>
  );
}
