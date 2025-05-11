import { redirect } from 'next/navigation'
import Image from "next/image"
import { AuthForm } from "@/components/auth/AuthForm"
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 relative mb-8">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Plate_Logo_HighRes_Transparent-KHpujinpES74Q3nyKx1Nd3ogN1r9t7.png"
              alt="Plate Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-light text-white text-center">
            modern restaurant solutions
          </h1>
          <p className="mt-2 text-sm text-white/60 text-center">
            Streamlined ordering and kitchen management
          </p>
        </div>
        
        <AuthForm />
      </div>
    </div>
  )
}
