export default function Footer() {
  return (
    <footer className="shrink-0 flex items-center justify-between px-6 py-3 bg-white text-sm text-neutral-400">
      <span>© {new Date().getFullYear()} finia. All rights reserved.</span>
      <div className="flex items-center gap-4">
        <a href="#" className="hover:text-neutral-600 transition-colors">Privacy</a>
        <a href="#" className="hover:text-neutral-600 transition-colors">Terms</a>
        <a href="#" className="hover:text-neutral-600 transition-colors">Support</a>
      </div>
    </footer>
  )
}
