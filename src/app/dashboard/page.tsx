"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Wallet, Lock, AlertCircle, ArrowLeft, Plus, LogOut, Clock, TrendingUp, Shield, Target, Gift, History, User } from "lucide-react"
import Link from "next/link"
import { useSession, authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePhoneVerification } from "@/hooks/usePhoneVerification" // Added for phone verification

interface LockedSaving {
  id: number
  amount: number
  lockDays: number
  lockedAt: string
  unlockAt: string
  status: string
  isUnlocked: boolean
  daysRemaining: number
}

interface UserGoal {
  id: number
  currentAmount: number
  targetAmount: number
  status: string
}

export default function Dashboard() {
  const { data: session, isPending, refetch } = useSession()
  const router = useRouter()

  // Phone verification check - will auto-redirect if needed
  const { isLoading: isCheckingVerification } = usePhoneVerification(true)
  
  const [amount, setAmount] = useState("")
  const [lockDays, setLockDays] = useState("30")
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [showAddToWallet, setShowAddToWallet] = useState(false)
  const [showAddAvailable, setShowAddAvailable] = useState(false)
  const [walletAmount, setWalletAmount] = useState("")
  const [availableAmount, setAvailableAmount] = useState("")
  const [activeSavings, setActiveSavings] = useState<LockedSaving[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [totalGoalMoney, setTotalGoalMoney] = useState(0)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  // Fetch active savings, wallet balance, and goal money
  const fetchActiveSavings = async () => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      setIsFetchingData(true)
      
      // Fetch savings
      const response = await fetch("/api/savings/active", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setActiveSavings(data)
      }

      // Fetch wallet balance
      const walletRes = await fetch("/api/wallet/balance", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (walletRes.ok) {
        const walletData = await walletRes.json()
        setWalletBalance(walletData.balance)
      }

      // Fetch user goals to calculate total goal money
      const goalsRes = await fetch("/api/goals/user", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (goalsRes.ok) {
        const goalsData: UserGoal[] = await goalsRes.json()
        const totalAdded = goalsData.reduce((sum, goal) => sum + goal.currentAmount, 0)
        setTotalGoalMoney(totalAdded)
      }
    } catch (error) {
      console.error("Failed to fetch savings:", error)
    } finally {
      setIsFetchingData(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchActiveSavings()
    }
  }, [session])

  const handleLockMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) < 1 || parseFloat(amount) > 100000) {
      toast.error("Please enter amount between ₹1 and ₹100,000")
      return
    }

    const token = localStorage.getItem("bearer_token")
    if (!token) {
      toast.error("Please login again")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/savings/lock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          lockDays: parseInt(lockDays)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`₹${amount} locked successfully for ${lockDays} days!`)
        setAmount("")
        setShowAddMoney(false)
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
        fetchActiveSavings()
      } else {
        toast.error(data.error || "Failed to lock money")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAvailable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!availableAmount || parseFloat(availableAmount) < 1 || parseFloat(availableAmount) > 100000) {
      toast.error("Please enter amount between ₹1 and ₹100,000")
      return
    }

    const token = localStorage.getItem("bearer_token")
    if (!token) {
      toast.error("Please login again")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(availableAmount)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`₹${availableAmount} added successfully!`)
        setAvailableAmount("")
        setShowAddAvailable(false)
        fetchActiveSavings()
      } else {
        toast.error(data.error || "Failed to add money")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletAmount || parseFloat(walletAmount) < 1 || parseFloat(walletAmount) > 100000) {
      toast.error("Please enter amount between ₹1 and ₹100,000")
      return
    }

    const token = localStorage.getItem("bearer_token")
    if (!token) {
      toast.error("Please login again")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(walletAmount)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`₹${walletAmount} added to wallet!`)
        setWalletAmount("")
        setShowAddToWallet(false)
        fetchActiveSavings()
      } else {
        toast.error(data.error || "Failed to add money")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async (savingsId: number, isEarly: boolean, amount: number) => {
    if (isEarly) {
      const penalty = amount * 0.1
      const finalAmount = amount - penalty

      const confirmed = window.confirm(`Early withdrawal will incur a 10% penalty (₹${penalty.toFixed(2)}). You will receive ₹${finalAmount.toFixed(2)}. Continue?`)
      if (!confirmed) {
        return
      }
    }

    const token = localStorage.getItem("bearer_token")
    if (!token) {
      toast.error("Please login again")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/savings/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ savingsId })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        fetchActiveSavings()
      } else {
        toast.error(data.error || "Failed to withdraw")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    const { error } = await authClient.signOut()
    if (error?.code) {
      toast.error(error.code)
    } else {
      localStorage.removeItem("bearer_token")
      refetch()
      router.push("/")
    }
  }

  const totalLocked = activeSavings.reduce((sum, saving) => sum + saving.amount, 0)
  const hasActiveLocks = activeSavings.length > 0

  if (isPending || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 text-white p-12 rounded-3xl shadow-2xl"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-8xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-4xl font-bold mb-2">Awesome!</h2>
              <p className="text-xl">Money Locked Successfully!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time Lock Status Bar */}
      {activeSavings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-orange-500/90 to-amber-500/90 border-b border-orange-300/50"
        >
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-white" />
              <span className="text-white font-medium">
                {activeSavings.filter(l => !l.isUnlocked).length} Active Lock{activeSavings.filter(l => !l.isUnlocked).length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white text-sm">
              <Clock className="w-4 h-4" />
              <span>
                Next unlock: {activeSavings.filter(l => !l.isUnlocked).length > 0 
                  ? new Date(activeSavings.filter(l => !l.isUnlocked).sort((a, b) => 
                      new Date(a.unlockAt).getTime() - new Date(b.unlockAt).getTime()
                    )[0].unlockAt).toLocaleDateString()
                  : 'None'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="sticky top-12 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              My Savings
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Wallet and Available Amount Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Goal Money Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-8 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 border-0 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 text-white/80">
                  <Wallet className="w-5 h-5" />
                  <span className="text-sm font-medium">Goal Money</span>
                </div>
                <motion.div
                  key={totalGoalMoney}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl md:text-5xl font-bold mb-2"
                >
                  ₹{totalGoalMoney.toLocaleString()}
                </motion.div>
                <p className="text-white/80 text-sm mb-4">
                  Money added for your savings goals
                </p>
                <div className="flex gap-2">
                  <Link href="/my-goals">
                    <Button className="bg-white text-emerald-600 hover:bg-gray-100">
                      <Target className="w-4 h-4 mr-2" />
                      My Goals
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Total Available Amount Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-8 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 border-0 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 text-white/80">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">Total Available Amount</span>
                </div>
                <motion.div
                  key={walletBalance}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl md:text-5xl font-bold mb-2"
                >
                  ₹{walletBalance.toLocaleString()}
                </motion.div>
                <p className="text-white/80 text-sm mb-4">
                  Available to lock for savings
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowAddAvailable(true)}
                    className="bg-white text-violet-600 hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Money
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Action Cards - Goals, Rewards, History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Link href="/goals">
            <Card className="p-6 bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Savings Goals</h3>
                <p className="text-white/90 text-sm mb-3">Set targets for your dream products</p>
                <div className="flex items-center text-sm font-medium text-white/90">
                  <span>Browse Goals</span>
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/rewards">
            <Card className="p-6 bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Rewards</h3>
                <p className="text-white/90 text-sm mb-3">Browse products you can earn</p>
                <div className="flex items-center text-sm font-medium text-white/90">
                  <span>View Rewards</span>
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/transaction-history">
            <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <History className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Transaction History</h3>
                <p className="text-white/90 text-sm mb-3">View all your activities</p>
                <div className="flex items-center text-sm font-medium text-white/90">
                  <span>View History</span>
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Secure Storage</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your money is safely locked with time protection</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Build Discipline</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Commit to not spending and watch your savings grow</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-start gap-4"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Time Protection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">10% penalty for early withdrawal encourages patience</p>
            </div>
          </motion.div>
        </div>

        {/* Active Locked Savings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-violet-600" />
            Active Locked Savings
          </h2>

          {isFetchingData ? (
            <Card className="p-8 bg-white dark:bg-gray-800 text-center">
              <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your savings...</p>
            </Card>
          ) : activeSavings.length === 0 ? (
            <Card className="p-12 bg-white dark:bg-gray-800 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Active Savings Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start your savings journey by locking your first amount
              </p>
              <Button 
                onClick={() => setShowAddMoney(true)}
                className="bg-gradient-to-r from-violet-600 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lock Money Now
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeSavings.map((saving, i) => (
                <motion.div
                  key={saving.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <Card className="p-6 bg-white dark:bg-gray-800 hover:shadow-xl transition-all">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl ${saving.isUnlocked ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-amber-500'} flex items-center justify-center`}>
                            {saving.isUnlocked ? (
                              <Clock className="w-6 h-6 text-white" />
                            ) : (
                              <Lock className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="text-3xl font-bold">₹{saving.amount.toLocaleString()}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Locked for {saving.lockDays} days
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Locked on: </span>
                            <span className="font-medium">{new Date(saving.lockedAt).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Unlocks on: </span>
                            <span className="font-medium">{new Date(saving.unlockAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {saving.isUnlocked ? (
                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Ready to Withdraw
                          </div>
                        ) : (
                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-medium">
                            <Lock className="w-4 h-4" />
                            Locked for {saving.daysRemaining} more {saving.daysRemaining === 1 ? 'day' : 'days'}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {saving.isUnlocked ? (
                          <Button
                            onClick={() => handleWithdraw(saving.id, false, saving.amount)}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            Withdraw ₹{saving.amount.toLocaleString()}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleWithdraw(saving.id, true, saving.amount)}
                            disabled={isLoading}
                            variant="outline"
                            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          >
                            Early Withdraw (10% fee)
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Lock Money Modal */}
      <AnimatePresence>
        {showAddMoney && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddMoney(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="p-6 bg-white dark:bg-gray-800">
                <h3 className="text-2xl font-bold mb-6">Lock New Savings</h3>
                
                <form onSubmit={handleLockMoney} className="space-y-5">
                  <div>
                    <Label htmlFor="amount">Amount (₹1 - ₹100,000)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount to lock"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      max="100000"
                      required
                      className="mt-2 h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lock-days">Lock Period (Days)</Label>
                    <Select value={lockDays} onValueChange={setLockDays}>
                      <SelectTrigger className="mt-2 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days (1 week)</SelectItem>
                        <SelectItem value="14">14 days (2 weeks)</SelectItem>
                        <SelectItem value="30">30 days (1 month)</SelectItem>
                        <SelectItem value="60">60 days (2 months)</SelectItem>
                        <SelectItem value="90">90 days (3 months)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-violet-900 dark:text-violet-300 mb-1">Important</div>
                        <div className="text-violet-700 dark:text-violet-400">
                          Your money will be locked for {lockDays} days. Withdrawing early will incur a 10% penalty fee.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setShowAddMoney(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isLoading || !amount || parseFloat(amount) < 1 || parseFloat(amount) > 100000}
                      className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
                    >
                      {isLoading ? "Locking..." : "Lock Money"}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Available Money Modal */}
      <AnimatePresence>
        {showAddAvailable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddAvailable(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="p-6 bg-white dark:bg-gray-800">
                <h3 className="text-2xl font-bold mb-2">Add Money</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                  Add funds to your available amount for locking
                </p>
                
                <form onSubmit={handleAddAvailable} className="space-y-5">
                  <div>
                    <Label htmlFor="available-amount">Amount (₹1 - ₹100,000)</Label>
                    <Input
                      id="available-amount"
                      type="number"
                      placeholder="Enter amount to add"
                      value={availableAmount}
                      onChange={(e) => setAvailableAmount(e.target.value)}
                      min="1"
                      max="100000"
                      required
                      className="mt-2 h-12 text-lg"
                    />
                  </div>

                  <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-violet-900 dark:text-violet-300 mb-1">Available for Locking</div>
                        <div className="text-violet-700 dark:text-violet-400">
                          This money will be available to lock for your savings with time protection.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setShowAddAvailable(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isLoading || !availableAmount || parseFloat(availableAmount) < 1 || parseFloat(availableAmount) > 100000}
                      className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    >
                      {isLoading ? "Adding..." : "Add Money"}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Wallet Modal */}
      <AnimatePresence>
        {showAddToWallet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddToWallet(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="p-6 bg-white dark:bg-gray-800">
                <h3 className="text-2xl font-bold mb-2">Add Money to Wallet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                  Add funds to your wallet to use for savings goals
                </p>
                
                <form onSubmit={handleAddToWallet} className="space-y-5">
                  <div>
                    <Label htmlFor="wallet-amount">Amount (₹1 - ₹100,000)</Label>
                    <Input
                      id="wallet-amount"
                      type="number"
                      placeholder="Enter amount to add"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      min="1"
                      max="100000"
                      required
                      className="mt-2 h-12 text-lg"
                    />
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Wallet className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-green-900 dark:text-green-300 mb-1">Add Funds</div>
                        <div className="text-green-700 dark:text-green-400">
                          This money will be available in your wallet for setting and achieving your savings goals.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setShowAddToWallet(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isLoading || !walletAmount || parseFloat(walletAmount) < 1 || parseFloat(walletAmount) > 100000}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {isLoading ? "Adding..." : "Add Money"}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}