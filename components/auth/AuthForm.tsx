"use client"

import { useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null })
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus({ message: '', type: null })
    
    try {
      if (isSignUp) {
        await signUp(email, password)
        setStatus({
          message: "Account created! Please check your email for the confirmation link.",
          type: 'success'
        })
        toast({
          title: "Success!",
          description: "Check your email for the confirmation link.",
        })
      } else {
        await signIn(email, password)
        setStatus({
          message: "Signing you in...",
          type: 'success'
        })
      }
    } catch (error) {
      const errorMessage = isSignUp 
        ? "Could not create account. Please try again." 
        : "Invalid email or password."
      setStatus({
        message: errorMessage,
        type: 'error'
      })
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {status.message && (
          <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>
              {status.message}
            </AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setStatus({ message: '', type: null })
          }}
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
        </Button>
      </form>
    </div>
  )
} 