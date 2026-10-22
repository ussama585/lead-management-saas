import { Link } from 'react-router-dom';
import { Command } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card.jsx';
export default function AuthCard({ title, description, children }) {
  return <main className='flex min-h-svh items-center justify-center bg-muted p-6'>
    <Card className='w-full max-w-md'>
      <CardHeader><div className='mb-4 flex items-center gap-2 font-semibold'><Command className='size-5' />Search O Pal</div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
      <CardContent>{children}</CardContent><CardFooter><Link to='/' className='text-sm underline underline-offset-4'>Back to sign in</Link></CardFooter>
    </Card>
  </main>;
}
