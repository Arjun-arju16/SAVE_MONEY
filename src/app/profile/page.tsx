"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, User, Wallet, Target, Gift, Lock, 
  TrendingUp, Calendar, ArrowUpRight, ArrowDownRight,
  Award, Clock, Shield, History, ChevronRight, Smartphone
} from "lucide-react"
import Link from "next/link"
import { useSession, authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Activity {
  type: string
  id: number
  timestamp: Date
  [key: string]: any
}

interface PhoneVerification {
  phoneNumber: string
  isVerified: boolean
  lastVerifiedAt: Date | null
  verificationCount: number
}

export default function Profile() {
  const { data: session, isPending, refetch } = useSession()
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [walletBalance, setWalletBalance] = useState(0)
  const [phoneVerification, setPhoneVerification] = useState<PhoneVerification | null>(null)
  const [stats, setStats] = useState({
    totalLocked: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalRewards: 0
  })

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  useEffect(() => {
    const fetchProfileData = async () => {
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

        // Fetch phone verification status
        const phoneRes = await fetch("/api/verification/status", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (phoneRes.ok) {
          const phoneData = await phoneRes.json()
          if (phoneData.phoneNumber) {
            setPhoneVerification({
              phoneNumber: phoneData.phoneNumber,
              isVerified: !phoneData.needsVerification,
              lastVerifiedAt: phoneData.lastVerifiedAt ? new Date(phoneData.lastVerifiedAt) : null,
              verificationCount: phoneData.verificationCount || 0
            })
          }
        }

        // Fetch all activities
        const activitiesRes = await fetch("/api/profile/activities?limit=50", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json()
          setActivities(activitiesData)

          // Calculate stats
          const totalLocked = activitiesData
            .filter((a: Activity) => a.type === 'savings')
            .reduce((sum: number, a: Activity) => sum + a.amount, 0)

          const goals = activitiesData.filter((a: Activity) => a.type === 'goal')
          const activeGoals = goals.filter((g: Activity) => g.status === 'active').length
          const completedGoals = goals.filter((g: Activity) => g.status === 'completed').length

          const totalRewards = activitiesData.filter((a: Activity) => a.type === 'reward').length

          setStats({
            totalLocked,
            activeGoals,
            completedGoals,
            totalRewards
          })
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error)
        toast.error("Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchProfileData()
    }
  }, [session])

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

  const maskPhoneNumber = (phone: string) => {
    if (phone.length <= 4) return phone
    return "*".repeat(phone.length - 4) + phone.slice(-4)
  }

  // Keep existing getActivityIcon, getActivityColor, getActivityText functions

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
      {/* Navigation */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              My Profile
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-8 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 border-0 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-6xl">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-bold mb-2">{session.user.name}</h1>
                  <p className="text-white/80 text-lg mb-2">{session.user.email}</p>
                  {phoneVerification && (
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Smartphone className="w-4 h-4" />
                      <span className="text-white/80">{maskPhoneNumber(phoneVerification.phoneNumber)}</span>
                      {phoneVerification.isVerified && (
                        <Badge className="bg-green-500/20 text-green-100 border-green-300/30">
                          Verified
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                    <Badge className="bg-white/20 text-white border-white/30">
                      <Calendar className="w-3 h-3 mr-1" />
                      Member since {new Date(session.user.createdAt || Date.now()).toLocaleDateString()}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30">
                      <Award className="w-3 h-3 mr-1" />
                      {stats.completedGoals} Goals Completed
                    </Badge>
                  </div>
                </div>
                <Link href="/my-goals">
                  <Button className="bg-white text-violet-600 hover:bg-gray-100">
                    <Target className="w-4 h-4 mr-2" />
                    View My Goals
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Wallet Balance</p>
                  <p className="text-2xl font-bold">₹{walletBalance.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Locked</p>
                  <p className="text-2xl font-bold">₹{stats.totalLocked.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Goals</p>
                  <p className="text-2xl font-bold">{stats.activeGoals}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rewards Earned</p>
                  <p className="text-2xl font-bold">{stats.totalRewards}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <History className="w-6 h-6 text-violet-600" />
            Recent Activity
          </h2>

          {isLoading ? (
            <Card className="p-8 bg-white dark:bg-gray-800 text-center">
              <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading activities...</p>
            </Card>
          ) : activities.length === 0 ? (
            <Card className="p-12 bg-white dark:bg-gray-800 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <History className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Activity Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start your savings journey to see your activity here
              </p>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
                  Go to Dashboard
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, i) => {
                const Icon = getActivityIcon(activity)
                const colorClass = getActivityColor(activity)
                
                return (
                  <motion.div
                    key={`${activity.type}-${activity.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                  >
                    <Card className="p-4 bg-white dark:bg-gray-800 hover:shadow-lg transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{getActivityText(activity)}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

const getActivityIcon = (activity: Activity) => {
  switch (activity.type) {
    case 'savings': return Lock
    case 'goal': return Target
    case 'transaction': return Wallet
    case 'reward': return Gift
    case 'contribution': return TrendingUp
    default: return History
  }
}

const getActivityColor = (activity: Activity) => {
  switch (activity.type) {
    case 'savings': return 'from-orange-500 to-amber-500'
    case 'goal': return 'from-violet-500 to-purple-500'
    case 'transaction': return activity.amount > 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500'
    case 'reward': return 'from-pink-500 to-rose-500'
    case 'contribution': return 'from-blue-500 to-cyan-500'
    default: return 'from-gray-500 to-gray-600'
  }
}

const getActivityText = (activity: Activity) => {
  switch (activity.type) {
    case 'savings':
      return `Locked ₹${activity.amount.toLocaleString()} for ${activity.lockDays} days`
    case 'goal':
      return `Goal: ${activity.productName} - ₹${activity.currentAmount.toLocaleString()} / ₹${activity.targetAmount.toLocaleString()}`
    case 'transaction':
      const types: { [key: string]: string } = {
        'deposit': 'Deposited to wallet',
        'withdrawal': 'Withdrawn from wallet',
        'goal_allocation': 'Added to goal',
        'goal_refund': 'Refunded from goal'
      }
      return `${types[activity.transactionType] || activity.transactionType}: ₹${Math.abs(activity.amount).toLocaleString()}`
    case 'reward':
      return `Earned: ${activity.rewardName}`
    case 'contribution':
      return `Contributed ₹${activity.amount.toLocaleString()} to ${activity.goal.productName}`
    default:
      return 'Activity'
  }
}