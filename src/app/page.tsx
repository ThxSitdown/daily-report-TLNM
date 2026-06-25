import { redirect } from 'next/navigation'
// Server-side redirect — แน่นอนกว่า client-side useRouter
export default function Root() {
  redirect('/login')
}
