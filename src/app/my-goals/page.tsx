"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, Wallet, Target, Plus, TrendingUp, 
  Sparkles, Clock, CheckCircle2, Trophy, Lock,
  AlertCircle, ChevronRight, X
} from "lucide-react"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface UserGoal {
  id: number
  productId: number
  targetAmount: number
  currentAmount: number
  status: string
  createdAt: Date
  completedAt: Date | null
  progressPercentage: number
  product: {
    id: number
    name: string
    price: number
    imageUrl: string | null
    category: string
  }
}

interface LockedSaving {
  id: number
  amount: number
  lockDays: number
  unlockAt: string
  status: string
  isUnlocked: boolean
  daysRemaining: number
}

export default function MyGoals() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [goals, setGoals] = useState<UserGoal[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [activeLocks, setActiveLocks] = useState<LockedSaving[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null)
  const [contributeAmount, setContributeAmount] = useState("")
  const [isContributing, setIsContributing] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [completedGoalName, setCompletedGoalName] = useState("")

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  const fetchData = async () => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      setIsLoading(true)

      // Fetch wallet balance
      const walletRes = await fetch("/api/wallet/balance", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (walletRes.ok) {
        const walletData = await walletRes.json()
        setWalletBalance(walletData.balance)
      }

      // Fetch user goals
      const goalsRes = await fetch("/api/goals/user", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json()
        setGoals(goalsData)
      }

      // Fetch active locks
      const locksRes = await fetch("/api/savings/active", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (locksRes.ok) {
        const locksData = await locksRes.json()
        setActiveLocks(locksData)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Failed to load goals")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchData()
    }
  }, [session])

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedGoal || !contributeAmount) return

    const amount = parseInt(contributeAmount)
    
    if (amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (amount > walletBalance) {
      toast.error("Insufficient wallet balance")
      return
    }

    const token = localStorage.getItem("bearer_token")
    if (!token) {
      toast.error("Please login again")
      return
    }

    setIsContributing(true)

    try {
      const response = await fetch(`/api/goals/${selectedGoal.id}/contribute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`₹${amount} added to goal!`)
        
        // Check if goal was completed
        if (data.goalCompleted) {
          setCompletedGoalName(selectedGoal.product.name)
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 4000)
        }
        
        setContributeAmount("")
        setSelectedGoal(null)
        await fetchData()
      } else {
        toast.error(data.error || "Failed to contribute")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsContributing(false)
    }
  }

  const calculateDaysToGoal = (remaining: number, dailyRate: number = 50) => {
    if (remaining <= 0) return 0
    return Math.ceil(remaining / dailyRate)
  }

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

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      {/* Goal Completion Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white p-12 rounded-3xl shadow-2xl max-w-md text-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-8xl mb-4"
              >
                🎉
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Trophy className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-4xl font-bold mb-2">Goal Reached!</h2>
                <p className="text-xl mb-2">{completedGoalName}</p>
                <p className="text-lg opacity-90">Congratulations! You did it!</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time Lock Status Bar */}
      {activeLocks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-orange-500/90 to-amber-500/90 border-b border-orange-300/50"
        >
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-white" />
              <span className="text-white font-medium">
                {activeLocks.filter(l => !l.isUnlocked).length} Active Lock{activeLocks.filter(l => !l.isUnlocked).length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white text-sm">
              <Clock className="w-4 h-4" />
              <span>
                Next unlock: {activeLocks.filter(l => !l.isUnlocked).length > 0 
                  ? new Date(activeLocks.filter(l => !l.isUnlocked).sort((a, b) => 
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
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              My Goals
            </span>
          </div>
          <Link href="/goals">
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Wallet Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-8 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 border-0 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-white/80">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-medium">Available Wallet Balance</span>
              </div>
              <motion.div
                key={walletBalance}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl md:text-6xl font-bold mb-2"
              >
                ₹{walletBalance.toLocaleString()}
              </motion.div>
              <p className="text-white/80 text-sm">
                Use this balance to add money to your goals below
              </p>
              
              {/* Goals Summary */}
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/70 text-sm mb-1">Active Goals</p>
                    <p className="text-2xl font-bold">{activeGoals.length}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm mb-1">Completed</p>
                    <p className="text-2xl font-bold">{completedGoals.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
</userжәк