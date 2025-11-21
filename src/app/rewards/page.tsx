"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Smartphone, Headphones, ShoppingBag, Laptop, Watch, Gift, TrendingUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"

export default function Rewards() {
  const [filter, setFilter] = useState("all")
  const userBalance = 15000

  const products = [
    {
      id: 1,
      name: "iPhone 15 Pro Max",
      price: 134900,
      category: "smartphone",
      icon: Smartphone,
      image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
      popular: true
    },
    {
      id: 2,
      name: "AirPods Pro (2nd Gen)",
      price: 24900,
      category: "headphones",
      icon: Headphones,
      image: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400&h=400&fit=crop",
      popular: true
    },
    {
      id: 3,
      name: "Nike Air Jordan 1",
      price: 12995,
      category: "shoes",
      icon: ShoppingBag,
      image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop",
      popular: false
    },
    {
      id: 4,
      name: "MacBook Pro 14\"",
      price: 199900,
      category: "laptop",
      icon: Laptop,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
      popular: true
    },
    {
      id: 5,
      name: "Sony WH-1000XM5",
      price: 29990,
      category: "headphones",
      icon: Headphones,
      image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
      popular: false
    },
    {
      id: 6,
      name: "Apple Watch Ultra",
      price: 89900,
      category: "watch",
      icon: Watch,
      image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop",
      popular: false
    },
  ]

  const categories = [
    { value: "all", label: "All Products", icon: Gift },
    { value: "smartphone", label: "Smartphones", icon: Smartphone },
    { value: "headphones", label: "Headphones", icon: Headphones },
    { value: "shoes", label: "Shoes", icon: ShoppingBag },
    { value: "laptop", label: "Laptops", icon: Laptop },
    { value: "watch", label: "Watches", icon: Watch },
  ]

  const filteredProducts = filter === "all" 
    ? products 
    : products.filter(p => p.category === filter)

  const calculateProgress = (productPrice: number) => {
    return Math.min((userBalance / productPrice) * 100, 100)
  }

  const calculateDaysToGoal = (productPrice: number, dailySaving: number = 50) => {
    const remaining = Math.max(0, productPrice - userBalance)
    return Math.ceil(remaining / dailySaving)
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Rewards Store
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Your Balance</div>
            <div className="text-lg font-bold text-violet-600">₹{userBalance.toLocaleString()}</div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Redeem Your Savings
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Turn your savings into premium products instead of just cash
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 justify-center mb-12"
        >
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.value}
                variant={filter === category.value ? "default" : "outline"}
                onClick={() => setFilter(category.value)}
                className={filter === category.value 
                  ? "bg-gradient-to-r from-pink-600 to-rose-600" 
                  : ""
                }
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            )
          })}
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, i) => {
            const progress = calculateProgress(product.price)
            const daysToGoal = calculateDaysToGoal(product.price)
            const canAfford = userBalance >= product.price
            const Icon = product.icon

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="overflow-hidden bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300">
                  <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {product.popular && (
                      <Badge className="absolute top-4 right-4 bg-gradient-to-r from-pink-600 to-rose-600 border-0">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                    <div className="absolute top-4 left-4 w-10 h-10 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur flex items-center justify-center">
                      <Icon className="w-5 h-5 text-violet-600" />
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                    <div className="text-2xl font-bold text-violet-600 mb-4">
                      ₹{product.price.toLocaleString()}
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Your Progress</span>
                          <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {!canAfford && (
                        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                          <div className="text-sm text-violet-700 dark:text-violet-300">
                            <div className="font-medium mb-1">Save ₹50/day</div>
                            <div>Reach goal in {daysToGoal} days</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {canAfford ? (
                      <Link href="/goals">
                        <Button className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700">
                          <Gift className="w-4 h-4 mr-2" />
                          Redeem Now
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/goals">
                        <Button variant="outline" className="w-full">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Set as Goal
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}