"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Target, TrendingUp, Calendar, Sparkles, Clock, Lock, CheckCircle2, Gift } from "lucide-react"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Product {
  id: number
  name: string
  category: string
  price: number
  imageUrl: string
  description: string
  available: boolean
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

export default function ProductDetail({ params }: { params: { id: string } }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [totalSavings, setTotalSavings] = useState(0)
  const [activeLocks, setActiveLocks] = useState<LockedSaving[]>([])
  const [dailySavings, setDailySavings] = useState("50")
  const [showGoalCreated, setShowGoalCreated] = useState(false)
  const [isCreatingGoal, setIsCreatingGoal] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products`)
        if (response.ok) {
          const data = await response.json()
          const foundProduct = data.find((p: Product) => p.id === parseInt(params.id))
          if (foundProduct) {
            setProduct(foundProduct)
          } else {
            toast.error("Product not found")
            router.push("/goals")
          }
        }
      } catch (error) {
        console.error("Failed to fetch product:", error)
        toast.error("Failed to load product")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [params.id, router])

  // Fetch user savings
  useEffect(() => {
    const fetchSavings = async () => {
      const token = localStorage.getItem("bearer_token")
      if (!token) return

      try {
        const response = await fetch("/api/savings/active", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setActiveLocks(data)
          const total = data.reduce((sum: number, saving: LockedSaving) => sum + saving.amount, 0)
          setTotalSavings(total)
        }
      } catch (error) {
        console.error("Failed to fetch savings:", error)
      }
    }

    if (session?.user) {
      fetchSavings()
    }
  }, [session])

  const handleCreateGoal = async () => {
    if (!product) return

    const token = localStorage.getItem("bearer_token")
    if (!token) {
      toast.error("Please login again")
      return
    }

    setIsCreatingGoal(true)

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          productName: product.name,
          productImage: product.imageUrl,
          targetAmount: product.price,
          dailyTarget: parseFloat(dailySavings) * 100,
          currentAmount: totalSavings
        })
      })

      if (response.ok) {
        setShowGoalCreated(true)
        setTimeout(() => {
          setShowGoalCreated(false)
        }, 3000)
        toast.success("Goal created successfully!")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to create goal")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsCreatingGoal(false)
    }
  }

  if (isPending || !session?.user || isLoading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const progress = Math.min((totalSavings / product.price) * 100, 100)
  const remaining = Math.max(0, product.price - totalSavings)
  const daysToGoal = Math.ceil(remaining / (parseFloat(dailySavings) * 100))
  const canAfford = totalSavings >= product.price

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      {/* Goal Created Animation */}
      <AnimatePresence>
        {showGoalCreated && (
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
              transition={{ type: "spring", duration: 0.8 }}
              className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white p-12 rounded-3xl shadow-2xl"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl mb-4"
              >
                🎯
              </motion.div>
              <h2 className="text-4xl font-bold mb-2">Goal Created!</h2>
              <p className="text-xl">Start saving for your {product.name}!</p>
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/goals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Goals
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-0 overflow-hidden sticky top-32">
              <div className="relative aspect-square bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20">
                <motion.img
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {canAfford && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <Badge className="absolute top-6 right-6 bg-green-500 text-white border-0 text-lg px-4 py-2">
                      <Sparkles className="w-5 h-5 mr-2" />
                      You can afford this!
                    </Badge>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Header */}
            <div>
              <Badge className="mb-4 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-0">
                {product.category}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                {product.description}
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  ₹{(product.price / 100).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Progress Section */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Your Progress</h3>
                <Badge className={`${canAfford ? 'bg-green-500' : 'bg-violet-500'} text-white border-0`}>
                  {progress.toFixed(1)}%
                </Badge>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Current Savings</span>
                  <span className="font-bold">₹{(totalSavings / 100).toLocaleString()}</span>
                </div>
                <Progress value={progress} className="h-4" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                  <span className="font-bold text-orange-600">₹{(remaining / 100).toLocaleString()}</span>
                </div>
              </div>

              {canAfford ? (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-green-900 dark:text-green-300 mb-1">Ready to Redeem!</div>
                    <div className="text-sm text-green-700 dark:text-green-400">
                      You have enough savings to get this product!
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm mb-1">
                      <TrendingUp className="w-4 h-4" />
                      Daily Target
                    </div>
                    <div className="font-bold text-2xl">₹{dailySavings}</div>
                  </Card>
                  <Card className="p-4 bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800">
                    <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      Days to Goal
                    </div>
                    <div className="font-bold text-2xl">{daysToGoal}</div>
                  </Card>
                </div>
              )}
            </Card>

            {/* Daily Savings Calculator */}
            <Card className="p-6 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 border-0 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-6 h-6" />
                <h3 className="text-xl font-bold">Daily Savings Calculator</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="daily-amount" className="text-white mb-2 block">
                    How much can you save daily?
                  </Label>
                  <Input
                    id="daily-amount"
                    type="number"
                    value={dailySavings}
                    onChange={(e) => setDailySavings(e.target.value)}
                    min="1"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60 h-14 text-lg"
                    placeholder="Enter daily savings"
                  />
                </div>

                {parseFloat(dailySavings) > 0 && !canAfford && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-white/10 rounded-lg p-4 border border-white/20"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium mb-1">Your Savings Plan</div>
                        <div className="text-white/90">
                          Saving ₹{dailySavings} daily, you'll reach your goal of{" "}
                          <strong>₹{(product.price / 100).toLocaleString()}</strong> in approximately{" "}
                          <strong className="text-yellow-300">{daysToGoal} days</strong>
                          {" "}({(daysToGoal / 30).toFixed(1)} months).
                        </div>
                        <div className="mt-2 text-white/80 text-xs">
                          That's {new Date(Date.now() + daysToGoal * 24 * 60 * 60 * 1000).toLocaleDateString()}! 🎯
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {canAfford ? (
                <Button size="lg" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg py-6">
                  <Gift className="w-5 h-5 mr-2" />
                  Redeem {product.name}
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handleCreateGoal}
                  disabled={isCreatingGoal || parseFloat(dailySavings) <= 0}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-lg py-6"
                >
                  <Target className="w-5 h-5 mr-2" />
                  {isCreatingGoal ? "Creating Goal..." : "Set as Savings Goal"}
                </Button>
              )}
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="w-full text-lg py-6">
                  Lock More Money
                </Button>
              </Link>
            </div>

            {/* Tips */}
            <Card className="p-6 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-violet-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-violet-900 dark:text-violet-300 mb-2">💡 Pro Tips</div>
                  <ul className="space-y-1 text-violet-700 dark:text-violet-400">
                    <li>• Lock small amounts regularly to build discipline</li>
                    <li>• Set realistic daily savings targets you can maintain</li>
                    <li>• Track your progress and celebrate milestones</li>
                    <li>• Avoid early withdrawals to maximize your savings</li>
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
