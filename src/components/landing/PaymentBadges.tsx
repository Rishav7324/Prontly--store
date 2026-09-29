export function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 select-none">
      {/* UPI Official Logo */}
      <div className="flex items-center h-6 px-2 py-0.5 rounded-md bg-white border border-zinc-200 shadow-2xs">
        <svg className="h-3.5 w-auto" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M42 4L34 26H40L48 4H42Z" fill="#097939" />
          <path d="M49 4L41 26H47L55 4H49Z" fill="#ED752E" />
          <text x="57" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="18" fill="#1C355E" fontStyle="italic">UPI</text>
        </svg>
      </div>

      {/* Google Pay Official Logo */}
      <div className="flex items-center h-6 px-2 py-0.5 rounded-md bg-white border border-zinc-200 shadow-2xs">
        <svg className="h-3.5 w-auto" viewBox="0 0 76 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* G multi-color icon */}
          <g transform="translate(2, 2)">
            <path d="M9.8 10c0-.67-.06-1.32-.18-1.92H0V11.8h5.5c-.24 1.3-.97 2.4-2.07 3.14v2.6h3.35C8.74 15.74 9.8 13.1 9.8 10z" fill="#4285F4" />
            <path d="M0 20c2.7 0 4.96-.9 6.62-2.46l-3.35-2.6c-.9.6-2.05.96-3.27.96-2.52 0-4.65-1.7-5.41-4h-3.46v2.68C-7.23 17.8-3.88 20 0 20z" fill="#34A853" transform="translate(9.8, 0)" />
            <path d="M-5.41 11.9c-.2-.6-.31-1.24-.31-1.9s.11-1.3.31-1.9V5.42h-3.46C-9.58 6.82-10 8.35-10 10s.42 3.18 1.13 4.58l3.46-2.68z" fill="#FBBC05" transform="translate(15.2, 0)" />
            <path d="M0 3.96c1.47 0 2.8.5 3.84 1.5l2.88-2.88C5-.5 2.7-1.5 0-1.5c-3.88 0-7.23 2.2-8.87 5.42l3.46 2.68C-4.65 4.3-2.52 2.6 0 2.6z" fill="#EA4335" transform="translate(9.8, 1.4)" />
          </g>
          <text x="26" y="16.5" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="13" fill="#5F6368">Pay</text>
        </svg>
      </div>

      {/* PhonePe Official Logo */}
      <div className="flex items-center h-6 px-2 py-0.5 rounded-md bg-white border border-zinc-200 shadow-2xs">
        <svg className="h-3.5 w-auto" viewBox="0 0 88 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="18" height="18" rx="9" y="2" fill="#5F259F" />
          <text x="4" y="15" fontFamily="sans-serif" fontWeight="bold" fontSize="12" fill="#FFFFFF">पे</text>
          <text x="22" y="16" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="12" fill="#5F259F">PhonePe</text>
        </svg>
      </div>

      {/* Paytm Official Logo */}
      <div className="flex items-center h-6 px-2 py-0.5 rounded-md bg-white border border-zinc-200 shadow-2xs">
        <svg className="h-3.5 w-auto" viewBox="0 0 68 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="15" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="14" fill="#002970">Pay</text>
          <text x="28" y="15" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="14" fill="#00BAF2">tm</text>
        </svg>
      </div>

      {/* Visa & Mastercard Badges */}
      <div className="flex items-center gap-1.5 h-6 px-2 py-0.5 rounded-md bg-white border border-zinc-200 shadow-2xs">
        <span className="font-black text-[11px] italic tracking-tighter text-[#1A1F71] font-sans">VISA</span>
        <span className="text-zinc-300 text-xs">•</span>
        <div className="flex -space-x-1 items-center">
          <span className="h-2.5 w-2.5 rounded-full bg-[#EB001B] inline-block opacity-90" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#F79E1B] inline-block opacity-90" />
        </div>
      </div>
    </div>
  );
}
