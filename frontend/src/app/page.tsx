import { redirect } from 'next/navigation';
import ModelPlayground from '@/components/ModelPlayground';
import ProofList from '@/components/ProofList';

export default function Home() {
  redirect('/playground');
  return null;
}
