"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, History, ArrowUpRight, ArrowDownLeft, Lock, Clock, LogOut } from "lucide-react"
import Link from "next/link"
import { useSession, authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Transaction {
  id: number
  type: string
  amount: number
  status: string
  createdAt: number
  lockDays?: number
  penalty?: number
}

export default function TransactionHistory() {
  const { data: session, isPending, refetch } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  // Fetch transaction history
  const fetchTransactions = async () => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      setIsLoading(true)
      const response = await fetch("/api/transactions-v2", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
      toast.error("Failed to load transaction history")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchTransactions()
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "lock":
        return <Lock className="w-5 h-5" />
      case "withdrawal":
        return <ArrowUpRight className="w-5 h-5" />
      case "early_withdrawal":
        return <Clock className="w-5 h-5" />
      default:
        return <ArrowDownLeft className="w-5 h-5" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "lock":
        return "from-violet-500 to-purple-500"
      case "withdrawal":
        return "from-green-500 to-emerald-500"
      case "early_withdrawal":
        return "from-orange-500 to-amber-500"
      default:
        return "from-blue-500 to-cyan-500"
    }
  }

  const getTransactionTitle = (type: string) => {
    switch (type) {
      case "lock":
        return "Money Locked"
      case "withdrawal":
        return "Withdrawal"
      case "early_withdrawal":
        return "Early Withdrawal"
      default:
        return "Transaction"
    }
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Transaction History
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">
              {session.user.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View all your savings activities and transactions
            </p>
          </div>

          {isLoading ? (
            <Card className="p-8 bg-white dark:bg-gray-800 text-center">
              <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading transactions...</p>
            </Card>
          ) : transactions.length === 0 ? (
            <Card className="p-12 bg-white dark:bg-gray-800 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <History className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Transactions Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your transaction history will appear here once you start locking money
              </p>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
                  Go to Dashboard
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction, i) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTransactionColor(transaction.type)} flex items-center justify-center text-white`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-1">
                            {getTransactionTitle(transaction.type)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(transaction.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                          {transaction.lockDays && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Locked for {transaction.lockDays} days
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          transaction.type === 'lock' 
                            ? 'text-violet-600' 
                            : 'text-green-600'
                        }`}>
                          {transaction.type === 'lock' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                        </div>
                        {transaction.penalty && transaction.penalty > 0 && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                            Penalty: ₹{transaction.penalty.toLocaleString()}
                          </p>
                        )}
                        <Badge 
                          className={`mt-2 ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                          } border-0`}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}