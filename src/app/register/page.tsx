"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, Lock, Mail, User, Eye, EyeOff, Check, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { authClient, useSession } from "@/lib/auth-client"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isPending && session?.user) {
      router.push("/dashboard")
    }
  }, [session, isPending, router])

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Passwords match", met: password === confirmPassword && password.length > 0 }
  ]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)

    const { error } = await authClient.signUp.email({
      email,
      name,
      password
    })

    if (error?.code) {
      const errorMap: Record<string, string> = {
        USER_ALREADY_EXISTS: "Email already registered"
      }
      toast.error(errorMap[error.code] || "Registration failed")
      setIsLoading(false)
      return
    }

    toast.success("Account created successfully!")
    
    // Check if there's a verified phone in localStorage from the verification flow
    const verifiedPhone = localStorage.getItem("verified_phone")
    if (verifiedPhone) {
      // Auto-login and link the verified phone
      const loginResult = await authClient.signIn.email({
        email,
        password
      })
      
      if (!loginResult.error) {
        try {
          const token = localStorage.getItem("bearer_token")
          if (token) {
            // Link the verified phone to this user account
            await fetch("/api/verification/link-phone", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ phoneNumber: verifiedPhone })
            })
            // Clear the temporary storage
            localStorage.removeItem("verified_phone")
            toast.success("Phone number linked to your account!")
            // Redirect to dashboard
            router.push("/dashboard")
            return
          }
        } catch (error) {
          console.error("Failed to link phone:", error)
        }
      }
    }
    
    router.push("/login?registered=true")
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (session?.user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Back Button */}
      <Link href="/" className="fixed top-6 left-6 z-50">
        <Button variant="ghost" size="sm" className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl"
          >
            <Wallet className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start your savings journey today
          </p>
        </div>

        <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12"
                autoComplete="name"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password" className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-12"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 pr-12"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {password && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {req.met ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={req.met ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !passwordRequirements.every(r => r.met)}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-600 hover:text-violet-700 font-semibold">
                Login
              </Link>
            </p>
          </div>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400"
        >
          Secure savings with time-locked protection
        </motion.p>
      </motion.div>
    </div>
  )
}