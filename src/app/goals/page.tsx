"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Target, Trophy, Zap, Calendar, TrendingUp, Plus, Sparkles, Gift } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

export default function Goals() {
  const [userBalance] = useState(15000)
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [dailyContribution, setDailyContribution] = useState("")

  const goals = [
    {
      id: 1,
      name: "AirPods Pro",
      target: 24900,
      current: 15000,
      dailySaving: 50,
      daysLeft: 198,
      streak: 12,
      emoji: "🎧"
    },
    {
      id: 2,
      name: "Nike Shoes",
      target: 12995,
      current: 8500,
      dailySaving: 30,
      daysLeft: 149,
      streak: 8,
      emoji: "👟"
    },
  ]

  const achievements = [
    { name: "First Save", icon: Sparkles, color: "from-yellow-500 to-amber-500", unlocked: true },
    { name: "7 Day Streak", icon: Zap, color: "from-orange-500 to-red-500", unlocked: true },
    { name: "30 Day Streak", icon: Trophy, color: "from-violet-500 to-purple-500", unlocked: false },
    { name: "Goal Achieved", icon: Target, color: "from-green-500 to-emerald-500", unlocked: false },
  ]

  const calculateDaysToGoal = () => {
    if (!targetAmount || !dailyContribution) return 0
    const remaining = Math.max(0, parseFloat(targetAmount) - userBalance)
    return Math.ceil(remaining / parseFloat(dailyContribution))
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Savings Goals
            </span>
          </div>
          <Button 
            onClick={() => setShowNewGoal(true)}
            className="bg-gradient-to-r from-violet-600 to-purple-600"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <Card className="p-6 bg-gradient-to-br from-violet-600 to-purple-600 border-0 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium opacity-90">Total Saved</span>
              <Trophy className="w-5 h-5 opacity-90" />
            </div>
            <div className="text-4xl font-bold">₹{userBalance.toLocaleString()}</div>
            <div className="text-sm opacity-90 mt-2">Keep going! 🎯</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-pink-600 to-rose-600 border-0 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium opacity-90">Active Goals</span>
              <Target className="w-5 h-5 opacity-90" />
            </div>
            <div className="text-4xl font-bold">{goals.length}</div>
            <div className="text-sm opacity-90 mt-2">Stay focused! 💪</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-600 to-amber-600 border-0 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium opacity-90">Current Streak</span>
              <Zap className="w-5 h-5 opacity-90" />
            </div>
            <div className="text-4xl font-bold">12 Days</div>
            <div className="text-sm opacity-90 mt-2">On fire! 🔥</div>
          </Card>
        </motion.div>

        {/* Active Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-6">Your Goals</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {goals.map((goal, i) => {
              const progress = calculateProgress(goal.current, goal.target)
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="p-6 bg-white dark:bg-gray-800 hover:shadow-xl transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{goal.emoji}</div>
                        <div>
                          <h3 className="text-xl font-bold">{goal.name}</h3>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            ₹{goal.current.toLocaleString()} / ₹{goal.target.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-0">
                        <Zap className="w-3 h-3 mr-1" />
                        {goal.streak} days
                      </Badge>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm mb-1">
                            <TrendingUp className="w-4 h-4" />
                            Daily Target
                          </div>
                          <div className="font-bold text-lg">₹{goal.dailySaving}</div>
                        </div>
                        <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 text-sm mb-1">
                            <Calendar className="w-4 h-4" />
                            Days Left
                          </div>
                          <div className="font-bold text-lg">{goal.daysLeft}</div>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600">
                      Add Today's Savings
                    </Button>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold mb-6">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement, i) => {
              const Icon = achievement.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card className={`p-6 text-center ${achievement.unlocked ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-800/50 opacity-60'}`}>
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center ${!achievement.unlocked && 'grayscale'}`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="font-bold text-sm">{achievement.name}</div>
                    {achievement.unlocked && (
                      <Badge className="mt-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-0">
                        Unlocked
                      </Badge>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Goal Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="p-8 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 border-0 text-white">
            <h2 className="text-3xl font-bold mb-2">Goal Calculator</h2>
            <p className="text-white/90 mb-6">Calculate how long it takes to reach your goal</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="target" className="text-white mb-2">Target Amount</Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="₹24,900"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <div>
                <Label htmlFor="daily" className="text-white mb-2">Daily Savings</Label>
                <Input
                  id="daily"
                  type="number"
                  placeholder="₹50"
                  value={dailyContribution}
                  onChange={(e) => setDailyContribution(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <div className="flex items-end">
                <div className="w-full bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="text-sm text-white/80 mb-1">Days to Goal</div>
                  <div className="text-3xl font-bold">{calculateDaysToGoal()}</div>
                </div>
              </div>
            </div>

            {calculateDaysToGoal() > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-white/10 rounded-lg p-4 border border-white/20"
              >
                <div className="text-sm">
                  Starting with ₹{userBalance.toLocaleString()}, saving ₹{dailyContribution}/day, 
                  you'll reach ₹{targetAmount} in <strong>{calculateDaysToGoal()} days</strong>! 
                  That's approximately <strong>{(calculateDaysToGoal() / 30).toFixed(1)} months</strong>. 🎯
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* New Goal Modal */}
      <AnimatePresence>
        {showNewGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewGoal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="p-6 bg-white dark:bg-gray-800">
                <h3 className="text-2xl font-bold mb-6">Create New Goal</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      placeholder="e.g., iPhone 15 Pro"
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="goal-amount">Target Amount</Label>
                    <Input
                      id="goal-amount"
                      type="number"
                      placeholder="₹134,900"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="daily-save">Daily Savings Goal</Label>
                    <Input
                      id="daily-save"
                      type="number"
                      placeholder="₹100"
                      className="mt-2"
                    />
                  </div>

                  <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Gift className="w-5 h-5 text-violet-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-violet-900 dark:text-violet-300 mb-1">Pro Tip</div>
                        <div className="text-violet-700 dark:text-violet-400">
                          Set a realistic daily goal to build a consistent savings habit
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowNewGoal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowNewGoal(false)
                        setSelectedProduct("")
                      }}
                      className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
                    >
                      Create Goal
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}