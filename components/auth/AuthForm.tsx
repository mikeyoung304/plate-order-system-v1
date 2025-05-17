"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/AuthContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"server" | "cook" | "">("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null })
  const { toast } = useToast()
  const router = useRouter()
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus({ message: '', type: null })
    
    try {
      if (isSignUp) {
        if (!name) {
          throw new Error("Name is required")
        }
        if (!role) {
          throw new Error("Role is required")
        }
        await signUp(email, password, name, role)
        setStatus({
          message: "Check your email for the confirmation link.",
          type: 'success'
        })
        toast({
          title: "Success!",
          description: "Check your email for the confirmation link.",
        })
      } else {
        await signIn(email, password)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 
        isSignUp ? "Could not create account. Please try again." : "Invalid email or password."
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
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
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
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: "server" | "cook") => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="cook">Cook</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
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
            setName("")
            setRole("")
          }}
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
        </Button>
      </form>
    </div>
  )
} 