"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Smartphone, Lock, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { toast } from "sonner"

export default function VerifyPhonePage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  
  const [step, setStep] = useState<"phone" | "otp" | "success">("phone")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [generatedOtp, setGeneratedOtp] = useState("")

  // Check if user is already logged in and has verified phone
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!isPending && session?.user) {
        const token = localStorage.getItem("bearer_token")
        if (token) {
          const res = await fetch("/api/verification/status", {
            headers: { "Authorization": `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            // If already verified, redirect to dashboard
            if (!data.needsVerification) {
              router.push("/dashboard")
            }
          }
        }
      }
    }
    checkVerificationStatus()
  }, [session, isPending, router])

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/verification/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber })
      })

      const data = await res.json()

      if (res.ok) {
        setGeneratedOtp(data.otp)
        setStep("otp")
        setCountdown(60)
        toast.success("OTP sent successfully!")
        toast.info(`Development Mode: Your OTP is ${data.otp}`, { duration: 10000 })
      } else {
        toast.error(data.error || "Failed to send OTP")
      }
    } catch (error) {
      console.error("Send OTP error:", error)
      toast.error("Failed to send OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)
    try {
      const verifyRes = await fetch("/api/verification/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otpCode })
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        toast.error(verifyData.error || "Invalid OTP")
        setIsLoading(false)
        return
      }

      // Store verified phone in localStorage temporarily
      localStorage.setItem("verified_phone", phoneNumber)
      
      setStep("success")
      toast.success("Phone verified successfully!")
      
      // Check if user is logged in
      if (session?.user) {
        // Link phone to account immediately
        const token = localStorage.getItem("bearer_token")
        if (token) {
          await fetch("/api/verification/link-phone", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ phoneNumber })
          })
        }
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (error) {
      console.error("Verify OTP error:", error)
      toast.error("Verification failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = () => {
    if (countdown > 0) {
      toast.error(`Please wait ${countdown} seconds before resending`)
      return
    }
    setOtpCode("")
    handleSendOtp()
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center"
          >
            <ShieldCheck className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Verify Your Phone
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {session?.user ? "Secure your account with mobile verification" : "Verify your mobile to get started"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200/50 dark:border-gray-700/50">
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Smartphone className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Enter Your Phone Number</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      We'll send you a verification code
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-lg"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    onClick={handleSendOtp}
                    disabled={isLoading || !phoneNumber}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send OTP
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200/50 dark:border-gray-700/50">
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Enter Verification Code</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Code sent to {phoneNumber}
                    </p>
                    {generatedOtp && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                          Development Mode
                        </p>
                        <p className="text-lg font-bold text-amber-900 dark:text-amber-300">
                          Your OTP: {generatedOtp}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">6-Digit OTP</label>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="text-center text-2xl tracking-widest font-bold"
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <CheckCircle className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      onClick={handleResendOtp}
                      disabled={countdown > 0}
                      className="text-sm text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setStep("phone")
                      setOtpCode("")
                    }}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:underline"
                  >
                    Change phone number
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200/50 dark:border-gray-700/50 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Verification Successful!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {session?.user 
                    ? "Your phone number has been verified successfully"
                    : "Now let's create your account"
                  }
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {session?.user ? "Redirecting to dashboard..." : "Redirecting to login..."}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}