"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Filter, ShoppingBag, Sparkles, TrendingUp, Clock, Lock } from "lucide-react"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export default function Goals() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [totalSavings, setTotalSavings] = useState(0)
  const [activeLocks, setActiveLocks] = useState<LockedSaving[]>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products")
        if (response.ok) {
          const data = await response.json()
          setProducts(data)
          setFilteredProducts(data)
        }
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

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

  // Filter products
  useEffect(() => {
    let filtered = products

    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [searchQuery, categoryFilter, products])

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))]

  const calculateProgress = (price: number) => {
    return Math.min((totalSavings / price) * 100, 100)
  }

  const calculateDaysToGoal = (price: number, dailySavings: number = 50) => {
    const remaining = Math.max(0, price - totalSavings)
    return Math.ceil(remaining / dailySavings)
  }

  if (isPending || !session?.user) {
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
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
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Product Goals
            </span>
          </div>
          <div className="w-24"></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section with Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Card className="p-8 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 border-0 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-white/80">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium">Your Total Savings</span>
                  </div>
                  <div className="text-5xl md:text-6xl font-bold mb-2">
                    ₹{totalSavings.toLocaleString()}
                  </div>
                  <p className="text-white/80">Choose your dream product and start saving!</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className="bg-white/20 text-white border-white/30 text-base px-4 py-2">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {products.length} Products Available
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white dark:bg-gray-800"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48 h-12 bg-white dark:bg-gray-800">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="p-6 bg-white dark:bg-gray-800 animate-pulse">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-12 bg-white dark:bg-gray-800 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Products Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, i) => {
              const progress = calculateProgress(product.price)
              const daysToGoal = calculateDaysToGoal(product.price)
              const canAfford = totalSavings >= product.price

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                >
                  <Link href={`/goals/${product.id}`}>
                    <Card className="p-0 bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer h-full">
                      {/* Product Image */}
                      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {canAfford && (
                          <Badge className="absolute top-4 right-4 bg-green-500 text-white border-0">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Affordable!
                          </Badge>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="p-6">
                        <Badge className="mb-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-0">
                          {product.category}
                        </Badge>
                        <h3 className="text-xl font-bold mb-2 line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-3xl font-bold text-violet-600">
                            ₹{(product.price / 100).toLocaleString()}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Your Progress</span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                              className="h-full bg-gradient-to-r from-violet-600 to-purple-600"
                            />
                          </div>
                        </div>

                        {/* Days to Goal */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <Clock className="w-4 h-4" />
                          <span>
                            {canAfford 
                              ? "Ready to redeem!" 
                              : `~${daysToGoal} days at ₹50/day`}
                          </span>
                        </div>

                        <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 group-hover:from-violet-700 group-hover:to-purple-700">
                          {canAfford ? "Redeem Now" : "Set as Goal"}
                        </Button>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}