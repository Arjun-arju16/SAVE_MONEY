"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Wallet, TrendingUp, Gift, Target, Shield, Zap, ArrowRight, Sparkles, LogIn, LogOut } from "lucide-react"
import Link from "next/link"
import { useSession, authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function Home() {
  const { data: session, isPending, refetch } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    const { error } = await authClient.signOut()
    if (error?.code) {
      toast.error(error.code)
    } else {
      localStorage.removeItem("bearer_token")
      refetch()
      toast.success("Logged out successfully")
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              SaveSmart
            </span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            {isPending ? (
              <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            ) : session?.user ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {session.user.name}
                </span>
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                    Go to Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : null}
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Save Smart, Live Better
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              Stop Wasting Money,
              <br />Start Saving Goals
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
              Transform impulsive spending into meaningful savings. Lock your money with time commitment, 
              and redeem for premium products like iPhone, headphones, and more.
            </p>
          </motion.div>

          {/* Animated Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto"
          >
            {[
              { icon: TrendingUp, value: "₹10L+", label: "Money Saved", color: "from-green-500 to-emerald-500" },
              { icon: Gift, value: "500+", label: "Rewards Claimed", color: "from-violet-500 to-purple-500" },
              { icon: Target, value: "1000+", label: "Goals Achieved", color: "from-pink-500 to-rose-500" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
              >
                <Card className="p-6 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                  <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Save money with commitment and get rewarded
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Wallet,
                title: "Add Money Instantly",
                description: "Save ₹1 to ₹100,000 whenever you get the urge to spend unnecessarily",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Shield,
                title: "Lock Your Savings",
                description: "Choose lock period (2 weeks to 2 months). Early withdrawal? 10% commission applies",
                color: "from-violet-500 to-purple-500"
              },
              {
                icon: Gift,
                title: "Redeem Premium Products",
                description: "Get iPhone, headphones, shoes and more instead of just cash withdrawal",
                color: "from-pink-500 to-rose-500"
              },
              {
                icon: Target,
                title: "Set Savings Goals",
                description: "Create goals for products and track daily progress with gamified achievements",
                color: "from-orange-500 to-amber-500"
              },
              {
                icon: Zap,
                title: "Fast & Secure",
                description: "Top-level security with instant transactions and encrypted data protection",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: TrendingUp,
                title: "Track Progress",
                description: "Beautiful visualizations showing how close you are to your dream products",
                color: "from-indigo-500 to-blue-500"
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="p-6 h-full bg-white dark:bg-gray-800 hover:shadow-2xl transition-all duration-300 hover:scale-105 border-gray-200 dark:border-gray-700">
                  <div className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Single Button at End */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <Card className="p-12 text-center bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 border-0 overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Transform Your Savings?
                </h2>
                <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                  Join thousands who stopped wasting money and started achieving their goals
                </p>
                {session?.user ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl shadow-xl">
                      Go to Dashboard
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/verify-phone">
                    <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl shadow-xl">
                      <LogIn className="mr-2 w-5 h-5" />
                      Get Started Now
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Wallet className="w-6 h-6 text-violet-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">SaveSmart</span>
          </div>
          <p>© 2024 SaveSmart. Stop wasting, start saving.</p>
        </div>
      </footer>
    </div>
  )
}