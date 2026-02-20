import React from 'react'

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <h4 className="text-white font-semibold mb-3">NODUE</h4>
          <p className="text-sm text-gray-400">
            Recover payments faster with smart WhatsApp & voice automation.
          </p>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-white mb-3">Product</h5>
          <ul className="space-y-2 text-sm">
            <li><a href="#features" className="hover:text-white">Features</a></li>
            <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
            <li><a href="#docs" className="hover:text-white">Docs</a></li>
          </ul>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-white mb-3">Company</h5>
          <ul className="space-y-2 text-sm">
            <li><a href="#about" className="hover:text-white">About</a></li>
            <li><a href="#careers" className="hover:text-white">Careers</a></li>
            <li><a href="/contact" className="hover:text-white">Contact</a></li>
          </ul>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-white mb-3">Subscribe</h5>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 rounded-md bg-gray-800 px-3 py-2 text-sm placeholder-gray-500 outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button className="rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600">
              Join
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-xs text-gray-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} NODUE. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

