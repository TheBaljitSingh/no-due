import React, { useState, useRef } from "react";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // null | 'sending' | 'success' | 'error'
  const formRef = useRef(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    return; //remove this later
    setStatus("sending");

    // Simulate API call — replace with real endpoint if backend exists
    await new Promise((r) => setTimeout(r, 1800));
    setStatus("success");
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const infoCards = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: "Email Us",
      value: "divyendra.purohit[@]insansa.com",
      href: "mailto:divyendra.purohit@insansa.com",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      label: "Call Us",
      value: "+91 9510279207",
      href: "tel:+919510279207",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: "Office",
      value: "Vadodara, Gujarat, India",
      href: "https://maps.google.com",
    },
  ];

  return (
    <div className="min-h-screen w-full backgroundone">
      {/* Hero Band */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-semibold text-teal-700 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            We usually respond within 2 hours
          </span>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
            Get in{" "}
            <span className="primary-gradient-text">Touch</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto">
            Have a question about NODUE? Our team is here to help you recover
            payments faster and automate your business communication.
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
          {infoCards.map((card) => (
            <a
              key={card.label}
              href={card.href}
              target={card.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="group flex flex-col items-center gap-3 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-6 text-center cursor-pointer"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-green-500 text-white shadow-md group-hover:scale-110 transition-transform">
                {card.icon}
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {card.label}
              </span>
              <span className="text-sm font-medium text-slate-700 group-hover:text-teal-600 transition-colors">
                {card.value}
              </span>
            </a>
          ))}
        </div>

        {/* Main Two-Column */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* Left — Form */}
          <div className="lg:col-span-3 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-1">Send us a message</h2>
            <p className="text-sm text-slate-500 mb-8">
              Fill in the details below and our team will get back to you shortly.
            </p>

            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-teal-500 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <h3 className="text-xl font-semibold text-slate-900">Message Sent!</h3>
                <p className="text-slate-500 max-w-sm">
                  Thanks for reaching out. We'll get back to you within 2 business hours.
                </p>
                <button
                  onClick={() => setStatus(null)}
                  className="mt-2 rounded-full bg-gradient-to-r from-teal-500 to-green-500 px-6 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Rahul Sharma"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="rahul@business.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select a topic…</option>
                      <option value="general">General Enquiry</option>
                      <option value="pricing">Pricing & Plans</option>
                      <option value="technical">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="billing">Billing</option>
                      <option value="demo">Request a Demo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help you..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-green-500 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                   <button
                    disabled={true}
                    className="flex items-center justify-center gap-2 cursor-not-allowed disabled:opacity-50"
                  >
                    Send Message
                  </button>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right — FAQ + Social */}
          <div className="lg:col-span-2 space-y-6">
            {/* FAQ Section */}
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Frequently Asked</h3>
              <ul className="space-y-4">
                {[
                  {
                    q: "How quickly can I onboard?",
                    a: "You can start recovering payments within 15 minutes of signing up — no technical setup needed.",
                  },
                  {
                    q: "Do you support bulk uploads?",
                    a: "Yes! Upload Excel/CSV files and let NODUE handle reminders for hundreds of customers automatically.",
                  },
                  {
                    q: "Is WhatsApp integration included?",
                    a: "All paid plans include WhatsApp Business API integration with custom templates.",
                  },
                  {
                    q: "Is there a free trial?",
                    a: "Every plan starts with a free trial so you can test before committing.",
                  },
                ].map((item) => (
                  <li key={item.q} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-semibold text-slate-800">{item.q}</p>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.a}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social Links */}
            <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-green-500 p-6 text-white shadow-md">
              <h3 className="text-lg font-semibold mb-2">Connect with us</h3>
              <p className="text-sm text-teal-100 mb-5">
                Follow NODUE for product updates, tips, and payment recovery insights.
              </p>
              <div className="flex gap-3">
                {[
                  {
                    label: "LinkedIn",
                    href: "https://linkedin.com",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Twitter",
                    href: "https://twitter.com",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Instagram",
                    href: "https://instagram.com",
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    ),
                  },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Business Hours */}
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <svg className="h-4 w-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                </svg>
                Business Hours
              </h3>
              <ul className="space-y-2 text-sm">
                {[
                  { day: "Monday – Friday", hours: "9:00 AM – 7:00 PM IST" },
                  { day: "Saturday", hours: "10:00 AM – 4:00 PM IST" },
                  { day: "Sunday", hours: "Closed" },
                ].map((row) => (
                  <li key={row.day} className="flex justify-between text-slate-600">
                    <span className="font-medium">{row.day}</span>
                    <span className={row.hours === "Closed" ? "text-red-400" : "text-teal-600"}>{row.hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Strip */}
      <div className="mt-10 w-full bg-gradient-to-r from-teal-600 to-green-500 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-100 mb-2">Ready to start?</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Start recovering payments today — no setup fee.
          </h2>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors shadow-md"
          >
            Explore NODUE
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
