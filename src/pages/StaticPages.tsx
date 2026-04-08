import { Header } from '../components/Header';
import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface StaticPageProps {
    title: string;
    children: ReactNode;
}

export function StaticPage({ title, children }: StaticPageProps) {
    return (
        <div className="min-h-screen bg-anime-bg text-anime-text pt-20">
            <Header />
            <div className="max-w-[800px] mx-auto px-6 py-10">
                <h1 className="text-4xl font-bold mb-8">{title}</h1>
                <div className="prose prose-lg text-anime-text">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function TermsPage() {
    return (
        <StaticPage title="Terms of Service">
            <p className="mb-4">Welcome to our Pinterest Clone. By using our service, you agree to these terms.</p>
            <h3 className="text-xl font-bold mb-2">1. Acceptance of Terms</h3>
            <p className="mb-4">By accessing this website, you agree to be bound by these Terms and Conditions of Use.</p>
            <h3 className="text-xl font-bold mb-2">2. Use License</h3>
            <p className="mb-4">Permission is granted to temporarily download one copy of the materials (information or software) on this website for personal, non-commercial transitory viewing only.</p>
            <p>This is a demo application for educational purposes.</p>
        </StaticPage>
    )
}

export function PrivacyPage() {
    return (
        <StaticPage title="Privacy Policy">
            <p className="mb-4">Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you across our website.</p>
            <h3 className="text-xl font-bold mb-2">Information We Collect</h3>
            <p className="mb-4">We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.</p>
            <h3 className="text-xl font-bold mb-2">Log Data</h3>
            <p>We may log standard information such as your IP address, browser type, and pages visited for analytics purposes.</p>
        </StaticPage>
    )
}

export function HelpPage() {
    return (
        <StaticPage title="Help Center">
            <div className="relative max-w-xl mb-12">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Search for help..."
                    className="w-full bg-anime-surface border border-anime-border rounded-full py-3 pl-12 pr-4 text-anime-text focus:outline-none focus:ring-1 focus:ring-anime-primary transition-all"
                />
            </div>

            <p className="mb-8 text-xl font-semibold">Common topics</p>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-6 border border-anime-border rounded-2xl hover:shadow-lg hover:border-anime-primary cursor-pointer transition-all duration-200 bg-anime-surface">
                    <h3 className="font-bold text-lg mb-2 text-anime-text">Account basics</h3>
                    <p className="text-gray-400 text-sm">Settings, profile, and preferences</p>
                </div>
                <div className="p-6 border border-anime-border rounded-2xl hover:shadow-lg hover:border-anime-primary cursor-pointer transition-all duration-200 bg-anime-surface">
                    <h3 className="font-bold text-lg mb-2 text-anime-text">Creating Pins</h3>
                    <p className="text-gray-400 text-sm">Upload images, add links, and more</p>
                </div>
                <div className="p-6 border border-anime-border rounded-2xl hover:shadow-lg hover:border-anime-primary cursor-pointer transition-all duration-200 bg-anime-surface">
                    <h3 className="font-bold text-lg mb-2 text-anime-text">Safety and security</h3>
                    <p className="text-gray-400 text-sm">Keep your account and data safe</p>
                </div>
                <div className="p-6 border border-anime-border rounded-2xl hover:shadow-lg hover:border-anime-primary cursor-pointer transition-all duration-200 bg-anime-surface">
                    <h3 className="font-bold text-lg mb-2 text-anime-text">Business and ads</h3>
                    <p className="text-gray-400 text-sm">Promote your content</p>
                </div>
            </div>
        </StaticPage>
    )
}
