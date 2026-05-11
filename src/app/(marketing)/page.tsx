import Link from "next/link";
import {
  Swords,
  Brain,
  Trophy,
  Users,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Shield,
  DollarSign,
  Star,
  Rocket,
} from "lucide-react";

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-primary/80 backdrop-blur-xl border-b border-border-default">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
            <Swords className="h-5 w-5 text-black" />
          </div>
          <span className="text-lg font-bold text-text-primary">
            The Arena
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/apply"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-black hover:bg-brand-400 transition-colors shadow-glow"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(196,154,34,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(196,154,34,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-500/5 rounded-full blur-[120px]" />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-dashed border-brand-500/30 mb-8">
          <Sparkles className="h-3.5 w-3.5 text-brand-500" />
          <span className="text-sm font-medium text-brand-500">
            Invite Only
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary">
          Supercharge Your
          <span className="block mt-2 bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
            Entrepreneurial Journey
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
          A community for Christian high school students to pitch ideas, compete
          for cash prizes, and network with future founders.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-brand-500 text-black hover:bg-brand-400 transition-all shadow-glow hover:shadow-glow-strong active:scale-[0.97]"
          >
            Apply to Join
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-medium border border-border-default text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-all"
          >
            How It Works
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 sm:gap-16 mt-16 pt-8 border-t border-border-default">
          {[
            { icon: Trophy, label: "Monthly Cash Prizes" },
            { icon: Shield, label: "Elite Founders Only" },
            { icon: DollarSign, label: "4-Figure Bounties" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-2 text-center">
              <stat.icon className="h-5 w-5 text-brand-500" />
              <p className="text-sm sm:text-base font-semibold text-text-primary">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      title: "Apply & Join",
      description:
        "Complete a short application sharing your faith journey and entrepreneurial interests. Approved members join with a $10/month subscription.",
    },
    {
      title: "Pitch Your Ideas",
      description:
        "Record and upload a video pitch with supporting materials. Share your GitHub repos, websites, or slide decks alongside your vision.",
    },
    {
      title: "Win Serious Cash",
      description:
        "Compete for monthly prize pools funded by membership fees and tackle 4-figure bounties from real entrepreneurs looking for fresh solutions.",
    },
    {
      title: "Build Your Network",
      description:
        "Connect with ambitious Christian founders, find co-founders for your projects, and grow a professional network that lasts beyond high school.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            How It Works
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">
            From application to winning, here&apos;s the monthly cycle
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative p-6 rounded-2xl border border-border-default bg-surface-card hover:bg-surface-card-hover hover:border-border-strong transition-all duration-300 group"
            >
              <div className="text-5xl font-bold text-brand-500 mb-4 select-none">
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Judging",
      description:
        "Get instant, detailed feedback on your pitch from our AI scoring engine, built on a professional rubric.",
    },
    {
      icon: DollarSign,
      title: "Monthly Prize Pool",
      description:
        "90% of membership fees fund the monthly prize pool. Top 3 finishers split the pot: 55% / 30% / 15%.",
    },
    {
      icon: Shield,
      title: "Elite Founder Community",
      description:
        "A vetted, faith-driven community exclusively for high school students aged 14-18.",
    },
    {
      icon: Rocket,
      title: "Venture Studio Pipeline",
      description:
        "Top performers get flagged for ACU's venture studio program with mentorship and scholarship opportunities.",
    },
    {
      icon: Star,
      title: "Build Your Portfolio",
      description:
        "Create a track record of pitches, scores, and wins. Showcase your entrepreneurial journey to colleges.",
    },
    {
      icon: Users,
      title: "Find Co-Founders",
      description:
        "Connect with other young founders, collaborate on projects, and build your network early.",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 bg-surface-secondary">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            Why Join?
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">
            Everything you need to launch your entrepreneurial journey
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border-default bg-surface-card hover:border-brand-500/30 hover:shadow-glow transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-brand-500" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="relative p-12 rounded-3xl border border-dashed border-brand-500/30 bg-gradient-to-b from-brand-500/5 to-transparent overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(196,154,34,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(196,154,34,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
              Ready to Start Building?
            </h2>
            <p className="mt-4 text-text-secondary max-w-lg mx-auto">
              Join a community of faith-driven young entrepreneurs. Apply today
              and start your venture journey.
            </p>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 rounded-xl text-base font-semibold bg-brand-500 text-black hover:bg-brand-400 transition-all shadow-glow hover:shadow-glow-strong active:scale-[0.97]"
            >
              Apply Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 border-t border-border-default">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Swords className="h-4 w-4 text-black" />
            </div>
            <span className="text-sm font-semibold text-text-primary">
              The Arena
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-tertiary">
            <Link href="#" className="hover:text-text-secondary transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-text-secondary transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-text-secondary transition-colors">
              Contact
            </Link>
          </div>
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Austin Christian University
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface-primary">
      <NavBar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
