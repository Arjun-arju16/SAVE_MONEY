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
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
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
                  Add money to your goals from this balance
                </p>
              </div>
              <Link href="/dashboard">
                <Button className="bg-white text-emerald-600 hover:bg-gray-100">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Wallet
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Active Goals Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-violet-600" />
              Active Goals ({activeGoals.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <Card key={i} className="p-6 bg-white dark:bg-gray-800 animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </Card>
              ))}
            </div>
          ) : activeGoals.length === 0 ? (
            <Card className="p-12 bg-white dark:bg-gray-800 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Active Goals</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start saving for your dream products by setting goals
              </p>
              <Link href="/goals">
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Products
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeGoals.map((goal, i) => {
                const remaining = goal.targetAmount - goal.currentAmount
                const daysToGoal = calculateDaysToGoal(remaining)

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="p-6 bg-white dark:bg-gray-800 hover:shadow-2xl transition-all overflow-hidden group">
                      {/* Product Image */}
                      <div className="relative aspect-video mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20">
                        {goal.product.imageUrl && (
                          <img
                            src={goal.product.imageUrl}
                            alt={goal.product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        )}
                        <Badge className="absolute top-3 right-3 bg-violet-600 text-white border-0">
                          {goal.product.category}
                        </Badge>
                      </div>

                      {/* Goal Details */}
                      <h3 className="text-xl font-bold mb-2 line-clamp-1">{goal.product.name}</h3>
                      
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-violet-600">
                          ₹{goal.currentAmount.toLocaleString()}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          / ₹{goal.targetAmount.toLocaleString()}
                        </span>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-bold text-violet-600">{goal.progressPercentage}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.progressPercentage}%` }}
                            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                            className="h-full bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 relative"
                          >
                            <motion.div
                              animate={{
                                x: ['-100%', '100%'],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            />
                          </motion.div>
                        </div>
                      </div>

                      {/* Remaining Amount */}
                      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3 mb-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-violet-700 dark:text-violet-300">Still needed:</span>
                          <span className="font-bold text-violet-900 dark:text-violet-200">
                            ₹{remaining.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-violet-600 dark:text-violet-400">
                          <Clock className="w-3 h-3" />
                          <span>~{daysToGoal} days at ₹50/day</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => setSelectedGoal(goal)}
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 group-hover:from-violet-700 group-hover:to-purple-700"
                        disabled={walletBalance === 0}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Money to Goal
                      </Button>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Completed Goals Section */}
        {completedGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                Completed Goals ({completedGoals.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {completedGoals.map((goal, i) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden">
                      {goal.product.imageUrl && (
                        <img
                          src={goal.product.imageUrl}
                          alt={goal.product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h4 className="font-bold mb-1 line-clamp-1">{goal.product.name}</h4>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      ₹{goal.targetAmount.toLocaleString()} achieved!
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Contribute to Goal Modal */}
      <AnimatePresence>
        {selectedGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedGoal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Add Money to Goal</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGoal(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Goal Info */}
                <div className="mb-6 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    {selectedGoal.product.imageUrl && (
                      <img
                        src={selectedGoal.product.imageUrl}
                        alt={selectedGoal.product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold line-clamp-1">{selectedGoal.product.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ₹{selectedGoal.currentAmount.toLocaleString()} / ₹{selectedGoal.targetAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Progress value={selectedGoal.progressPercentage} className="h-2" />
                </div>

                {/* Wallet Balance */}
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Available Balance</span>
                    <span className="text-xl font-bold text-green-600">₹{walletBalance.toLocaleString()}</span>
                  </div>
                </div>

                <form onSubmit={handleContribute} className="space-y-5">
                  <div>
                    <Label htmlFor="contribute-amount">Amount to Add</Label>
                    <Input
                      id="contribute-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={contributeAmount}
                      onChange={(e) => setContributeAmount(e.target.value)}
                      min="1"
                      max={Math.min(walletBalance, selectedGoal.targetAmount - selectedGoal.currentAmount)}
                      required
                      className="mt-2 h-12"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Max: ₹{Math.min(walletBalance, selectedGoal.targetAmount - selectedGoal.currentAmount).toLocaleString()}
                    </p>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 500, 1000].map(amount => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setContributeAmount(amount.toString())}
                        disabled={amount > walletBalance || amount > (selectedGoal.targetAmount - selectedGoal.currentAmount)}
                      >
                        ₹{amount}
                      </Button>
                    ))}
                  </div>

                  <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-violet-700 dark:text-violet-300">
                        This amount will be deducted from your wallet and added to your goal.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setSelectedGoal(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isContributing || !contributeAmount || parseInt(contributeAmount) <= 0}
                      className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
                    >
                      {isContributing ? "Adding..." : "Add Money"}
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
